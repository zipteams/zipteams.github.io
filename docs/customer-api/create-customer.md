---
sidebar_position: 4
---

# Section 3 — Create Customer API

Use this API to push a customer into Zipteams directly — no call recording involved. If the customer does not exist yet (matched by email and/or phone in the workspace), it is created. If they already exist, it's updated instead. Either way, you can set the disposition status and customer-level custom fields in the same request.

Think of it as **Section 1 (create) and Section 2 (update) combined**, for the case where you just have customer data to push and no call to sync.

:::info When to use which API
- You have a **call recording** to send → [Section 1 — Call Sync API](./call-sync.md).
- The customer **already exists** in Zipteams and you're only changing their status / custom fields → [Section 2 — Disposition Status Update API](./disposition-status-update.md).
- You want to **create the customer if needed** (or update them if they already exist) without sending a call → this API.
:::

## Endpoint

This is a **different endpoint** from Sections 1 and 2 — it does not use the shared AWS webhook URL or the `type` field.

```
POST https://api.zipteams.com/api/v1/client/conversation/webhook/customer-sync
```

Headers:

```
x-zip-api-key: YOUR_API_KEY
Content-Type: application/json
```

Your organisation is derived from the API key, same as the other sections.

:::warning One customer per request
Unlike Sections 1 and 2, this endpoint takes a **single customer object** as the request body — there is no wrapping `data` array. To push multiple customers, send multiple requests.
:::

---

## Request body

```json
{
  "agent_email": "priya.sharma@yourcompany.com",
  "name": "Rahul Verma",
  "email": "rahul.verma@example.com",
  "phone_number": "+919876543210",
  "disposition_status": "Interested",
  "custom_fields": [
    { "field_name": "Deal Size", "value": "50000" }
  ]
}
```

### The minimum viable payload

```json
{
  "agent_email": "priya.sharma@yourcompany.com",
  "phone_number": "+919876543210"
}
```

This alone will create the customer (if they don't already exist) with no status and no custom fields set.

---

## Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_email` | string | **Yes** | The agent this customer is attributed to. Must be a valid email. Zipteams first looks for an **Active** user in your organisation with this exact email; if none matches, it falls back to treating the value as an **external id** pre-registered against a Zipteams user (the same `id` concept used in Sections 1 and 2). If neither matches an Active user, the request is rejected — see [Errors](#errors) below. |
| `name` | string | No | Customer's name. If omitted, `email` is used, falling back to `phone_number`. |
| `email` | string | Conditional | Customer's email. Required **unless** you send `phone_number`. If sent, must be a valid email — do not send `""`. |
| `phone_number` | string | Conditional | Customer's phone number, ideally in E.164 format (`+919876543210`). Required **unless** you send `email`. |
| `disposition_status` | string | No | The status to record against the customer. Free text — send whatever your CRM uses. Best-effort: if this write fails, it's reported in `warnings` rather than failing the whole request. |
| `custom_fields` | array | No | See [below](#custom_fields-array--optional). |

:::info One of `email` or `phone_number` is mandatory
If both are missing, the request is rejected with a validation error.
:::

### How the customer is matched

Zipteams looks for an existing customer in the agent's workspace by `email` and/or `phone_number`.

- **Match found** → that customer is updated. If you sent `phone_number`, it's backfilled onto the matched customer's contact. `created` is `false` in the response.
- **No match** → a new customer and contact are created. If you didn't send `email`, a placeholder (`<phone_number>@noemail.com`) is used internally so the record has one. `created` is `true` in the response.

### `custom_fields` array — optional

:::danger A different system from Sections 1 and 2
The `custom_fields` here are **customer-level** custom fields, set up under **Setup → Manage Custom Field**. This is a separate system from the **conversation-level** `internal_name` / `zt_custom_N` fields used by [Section 1](./call-sync.md#custom_fields-array--optional) and [Section 2](./disposition-status-update.md#custom_fields-array--optional) (those live under Setup → Connect your CRM). Don't mix the two up — an `internal_name` from that system will not match here.
:::

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field_name` | string | **Yes** | Must match the **display name** of a customer custom field that already exists in your workspace, case-insensitively (surrounding whitespace is also ignored). It is not auto-generated — you type it yourself when creating the field, and send that exact name back. |
| `value` | string | **Yes** | The value to store against the customer for that field. |

**To create a field:**

1. Go to **Setup → Manage Custom Field**
2. Click **Add**
3. Name the field — this is the name you'll send as `field_name`

```json
"custom_fields": [
  { "field_name": "Deal Size", "value": "50000" }
]
```

If a `field_name` doesn't match any field in the workspace, that field is skipped — you'll see it listed in `warnings` — but the rest of the request (customer creation/update, disposition status) still goes through.

---

## Examples

### Create (or update) a customer by phone number

```bash
ZIPTEAMS_ENDPOINT_URL="https://api.zipteams.com/api/v1/client/conversation/webhook/customer-sync"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "agent_email": "priya.sharma@yourcompany.com",
  "name": "Rahul Verma",
  "phone_number": "+919876543210",
  "disposition_status": "Interested"
}'
```

### Create a customer with custom fields

```bash
ZIPTEAMS_ENDPOINT_URL="https://api.zipteams.com/api/v1/client/conversation/webhook/customer-sync"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "agent_email": "priya.sharma@yourcompany.com",
  "name": "Rahul Verma",
  "email": "rahul.verma@example.com",
  "phone_number": "+919876543210",
  "disposition_status": "Interested",
  "custom_fields": [
    { "field_name": "Deal Size", "value": "50000" },
    { "field_name": "Lead Source", "value": "Google Ads" }
  ]
}'
```

### Update an existing customer's status only

```bash
ZIPTEAMS_ENDPOINT_URL="https://api.zipteams.com/api/v1/client/conversation/webhook/customer-sync"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "agent_email": "priya.sharma@yourcompany.com",
  "email": "rahul.verma@example.com",
  "disposition_status": "Do Not Call"
}'
```

---

## Response

### Success

```json
{
  "code": "RESPONSE_SUCCESS",
  "message": "Request served successfully.",
  "type": "object",
  "data": {
    "customer_id": 48213,
    "created": true,
    "warnings": [
      "Custom field \"Deal Size\" was skipped because no CRM field with that display name exists in workspace 45."
    ]
  }
}
```

**HTTP Status Code**: `200 OK`

| Field | Description |
|-------|--------------|
| `data.customer_id` | The Zipteams id of the customer that was created or matched. |
| `data.created` | `true` if a new customer and contact were created; `false` if an existing customer (matched by email and/or phone in that workspace) was reused and updated. |
| `data.warnings` | Always present — `[]` when nothing was skipped or failed. Non-fatal problems (an unmatched `field_name`, a disposition-status write that failed) are reported here instead of failing the request, since the customer itself was still created/matched successfully. |

A `200` with entries in `warnings` still means the customer was created or matched — check `warnings` if a specific field or the status doesn't show up as expected.

### Errors

| Status | Response | Cause |
|--------|----------|-------|
| `403` | `{ "code": "FORBIDDEN", "message": "You are not allowed to perform this action." }` | The `x-zip-api-key` header was missing, or the key is invalid. Unlike Sections 1 and 2, this endpoint does not distinguish between the two cases. |
| `400` | `{ "code": "BAD_REQUEST", "message": [...] }` | The payload failed validation — for example, neither `email` nor `phone_number` was sent, or `email`/`agent_email` was not a valid email address. |
| `404` | `{ "code": "AGENT_NOT_FOUND_ON_ZIPTEAMS", "message": "...", "data": { "field": "agent_email" } }` | `agent_email` matched neither an Active user's email nor a pre-registered external id in your organisation. |
| `400` | `{ "code": "AGENT_HAS_NO_WORKSPACE", "message": "...", "data": { "field": "agent_email" } }` | The matched agent has no workspace configured. Contact Zipteams support. |
| `500` | `{ "code": "CUSTOMER_CREATION_FAILED", "message": "..." }` | The customer record could not be created. Retry, and contact support if it persists. |

:::danger The agent must exist and be Active
Same rule as Sections 1 and 2:

**Setup → Manage Team → Add → enter comma-separated emails → scroll down to the "Invited" section → Make All Active**
:::

---

## Related

- [Section 1 — Call Sync API](./call-sync.md) — send a call recording; also creates the customer if needed
- [Section 2 — Disposition Status Update API](./disposition-status-update.md) — update-only version of this API, for customers you know already exist
- [Section 5 — Customer Summary Callback](./customer-summary-callback.md) — contact-level rollup pushed back to you
