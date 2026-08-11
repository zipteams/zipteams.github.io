---
sidebar_position: 3
---

# Section 2 — Disposition Status Update API

Use this API when a customer's status or custom-field data changes **outside** of a call, and you want Zipteams to reflect it.

Typical cases: an agent updates the lead status in your CRM later in the day, the lead is marked "Do Not Call", or a custom field such as a policy number gets filled in after the conversation.

This API does **not** create anything. It only updates a customer who is already in Zipteams.

:::info When to use which API
- The status came from **a call you are also sending us** → put it in `customer.disposition_status` in [Section 1](./call-sync.md). Do not call this API separately.
- The status changed **independently of a call** → use this API.
:::

## Endpoint

Same endpoint as call sync — the `type` field is what makes it a status update:

```
POST https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler
```

Headers:

```
x-zip-api-key: YOUR_API_KEY
Content-Type: application/json
```

:::danger `type` is mandatory here
You **must** send `"type": "disposition-status"`. Without it, your payload is treated as a call-sync request and will be rejected for having no `call` object.
:::

---

## Request body

```json
{
  "type": "disposition-status",
  "data": [
    {
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      },
      "customer": {
        "id": "CRM-100294",
        "name": "Rahul Verma",
        "email": "rahul.verma@example.com",
        "phone_number": "+919876543210",
        "disposition_status": "Callback Requested"
      },
      "custom_fields": [
        { "internal_name": "zt_custom_2", "value": "POL-77120" }
      ]
    }
  ]
}
```

### The minimum viable payload

```json
{
  "type": "disposition-status",
  "data": [
    {
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "customer": {
        "phone_number": "+919876543210",
        "disposition_status": "Not Interested"
      }
    }
  ]
}
```

---

## Field reference

### `type` — **required**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | **Yes** | Must be exactly `"disposition-status"`. |

### `agent` object — **required**

The agent who owns the customer. This is how Zipteams knows which workspace to look the customer up in.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | Email of the agent **as they exist on Zipteams**. If no Active Zipteams user in your organisation has this email, the update is ignored. Must be a valid email — do not send `""`. |
| `id` | string | **Yes** | Your internal identifier for the agent. Used as a fallback for lookup when `email` is not supplied, but only if the id was pre-registered against the Zipteams user — so treat `email` as the path that works. |

:::danger The agent must exist on Zipteams
Exactly as with call sync, an agent who is not on Zipteams (or not yet Active) causes the update to be silently ignored.

**Setup → Manage Team → Add → enter comma-separated emails → scroll down to the "Invited" section → Make All Active**
:::

### `customer` object — **required in practice**

This identifies which customer to update. Zipteams looks up an **existing** customer by email or phone number.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Conditional | Customer's email. Required **unless** you send `phone_number`. If you send this key, it must be a valid email — do not send `""`. |
| `phone_number` | string | Conditional | Customer's phone number in E.164 format (`+919876543210`). Required **unless** you send `email`. **Note the difference from Section 1**, where the phone number goes in `call.phone_number` — here it belongs to the `customer` object. Send **the same value** you sent as `call.phone_number` when syncing that customer's calls, otherwise the lookup will not match. |
| `disposition_status` | string | No | The new status. Free text — send whatever your CRM uses (`Interested`, `Do Not Call`, `Callback Requested`, …). Recorded against the customer with the current timestamp. |
| `id` | string | No | Your CRM id for the customer. Informational. |
| `name` | string | No | Customer's name. Informational. |

:::warning Identification rules
- If the whole `customer` object is missing, the record is a no-op.
- If **both** `email` and `phone_number` are missing, the record is a no-op.
- If no Zipteams customer matches the email or phone, the record is a no-op. The customer must already exist — which means **at least one call must have been synced for them first** via [Section 1](./call-sync.md).

None of these produce an error response; the record is simply skipped.
:::

### `custom_fields` array — optional

Same shape and the same `internal_name` requirement as in [Section 1](./call-sync.md#custom_fields-array--optional).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `internal_name` | string | **Yes** | The identifier generated by Zipteams — sequential names like `zt_custom_1`, `zt_custom_2`. Create the field under **Setup → Connect your CRM → Enable Inbound Dynamic CRM Fields Mapping → + Add New Field**, then copy the `internal_name` shown beside it. It is not derived from the label you typed. |
| `value` | string | **Yes** | The value to store. |

:::note Custom fields attach to the customer's most recent call
Because a status update has no call of its own, `custom_fields` sent here are stored against the customer's **latest synced conversation**. If the customer has no conversations yet, the custom fields are skipped — the `disposition_status` update still goes through.
:::

There is **no** `metadata` field on this API, and **no** `callback_url` — status updates do not trigger a callback.

---

## Examples

### Update a disposition status by phone number

```bash
# Replace with the API key Zipteams shared with you
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "type": "disposition-status",
  "data": [
    {
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      },
      "customer": {
        "phone_number": "+919876543210",
        "disposition_status": "Callback Requested"
      }
    }
  ]
}'
```

### Update a status and a custom field by email

```bash
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "type": "disposition-status",
  "data": [
    {
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      },
      "customer": {
        "id": "CRM-100294",
        "name": "Rahul Verma",
        "email": "rahul.verma@example.com",
        "disposition_status": "Interested"
      },
      "custom_fields": [
        { "internal_name": "zt_custom_2", "value": "POL-77120" }
      ]
    }
  ]
}'
```

### Bulk update several customers

```bash
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "type": "disposition-status",
  "data": [
    {
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "customer": { "phone_number": "+919876543210", "disposition_status": "Interested" }
    },
    {
      "agent": { "id": "AG-5502", "email": "arjun.mehta@yourcompany.com" },
      "customer": { "email": "neha.gupta@example.com", "disposition_status": "Do Not Call" }
    }
  ]
}'
```

---

## Response

```json
{
  "message": "Data Received Successfully"
}
```

**HTTP Status Code**: `200 OK`

As with call sync, this means the payload was accepted and queued. Records that cannot be matched to an existing agent or customer are skipped during processing without a separate error response.

For error responses, see [Responses](./introduction.md#responses) in the overview.

---

## Common use cases

**Marking a lead as not to be contacted**

```json
{
  "type": "disposition-status",
  "data": [
    {
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "customer": { "phone_number": "+919876543210", "disposition_status": "Do Not Call" }
    }
  ]
}
```

**Recording a scheduled callback**

```json
{
  "type": "disposition-status",
  "data": [
    {
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "customer": { "phone_number": "+919876543210", "disposition_status": "Callback Requested" }
    }
  ]
}
```

**Backfilling a custom field captured after the call**

```json
{
  "type": "disposition-status",
  "data": [
    {
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "customer": { "email": "rahul.verma@example.com" },
      "custom_fields": [
        { "internal_name": "zt_custom_2", "value": "POL-77120" }
      ]
    }
  ]
}
```

---

## Related

- [Section 1 — Call Sync API](./call-sync.md) — must run at least once per customer before status updates will match
- [Section 4 — Customer Summary Callback](./customer-summary-callback.md) — contact-level rollup pushed back to you
