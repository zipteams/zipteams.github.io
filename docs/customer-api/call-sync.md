---
sidebar_position: 2
---

# Section 1 — Call Sync API

Use this API to send a completed call to Zipteams for AI analysis. Each record contains one recording plus the context Zipteams needs to attach it to the right agent and the right customer.

If the customer does not already exist in Zipteams, they are created automatically. If they do exist, the call is added to their timeline.

## Endpoint

```
POST https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler
```

Headers:

```
x-zip-api-key: YOUR_API_KEY
Content-Type: application/json
```

:::note
Do **not** send a `type` field for call sync. The `type` field is only used for [Section 2 — Disposition Status Update](./disposition-status-update.md).
:::

---

## Request body

```json
{
  "data": [
    {
      "call": {
        "id": "call_98231",
        "recording_url": "https://recordings.yourcompany.com/98231.mp3",
        "start_time": "2026-07-28T09:15:00Z",
        "phone_number": "+919876543210",
        "access_type": "whitelisted_ip"
      },
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
        { "internal_name": "zt_custom_1", "value": "Google Ads" },
        { "internal_name": "zt_custom_2", "value": "POL-77120" }
      ],
      "callback_url": "https://yourcompany.com/zipteams/call-analysis",
      "metadata": {
        "internal_row_id": "8842",
        "campaign": "July Retargeting"
      }
    }
  ]
}
```

### The minimum viable payload

Everything above is useful, but only this much is actually required:

```json
{
  "data": [
    {
      "call": {
        "id": "call_98231",
        "recording_url": "https://recordings.yourcompany.com/98231.mp3",
        "start_time": "2026-07-28T09:15:00Z",
        "phone_number": "+919876543210"
      },
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      }
    }
  ]
}
```

Start here, confirm calls are appearing in Zipteams, then add the optional objects one at a time.

---

## Field reference

### `call` object — **required**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Your unique identifier for this call. **Must be unique for every call.** If a call with the same id has already been synced, the new one is ignored as a duplicate. This value is returned to you as `call_id` in the [Call Summary Callback](./call-summary-callback.md), so use something you can look up in your own system. |
| `recording_url` | string (URL) | **Yes** | Direct, **publicly accessible** URL to the audio file. Must always be present — if it is missing or empty, **nothing syncs at all**. Supported formats: MP3, WAV, AAC, M4A, MP4. See [Recording URLs](./introduction.md#recording-urls). |
| `start_time` | string (ISO 8601) | **Yes** | When the call started. **Must include a timezone designator.** Either an offset — `YYYY-MM-DDTHH:mm:ss±hh:mm`, e.g. `2026-07-28T14:45:00+05:30` — or `Z` for UTC, e.g. `2026-07-28T09:15:00Z`. Both are accepted. A timestamp with no timezone is ambiguous and will be misinterpreted. |
| `phone_number` | string | **Yes** (or `customer.email`) | The customer's phone number, in E.164 format (`+919876543210`). Treat this as mandatory — the only alternative is supplying `customer.email` instead. This is the field Zipteams uses to match or create the customer; `customer.phone_number` is **ignored** during call sync. |
| `access_type` | string | No | Set to `"whitelisted_ip"` **only** if `recording_url` is restricted to approved IPs. You must also whitelist `13.201.157.246` on your side. Omit this field entirely for public URLs. See [IP whitelisting](./introduction.md#if-your-recordings-require-ip-whitelisting). |

:::warning Do not send `end_time`
`end_time` is not required and should be left out. Zipteams determines the call duration from the recording file itself.
:::

### `agent` object — **required**

The agent is the salesperson who made or received the call. The call is attributed to them in Zipteams.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | The email of the agent **as they exist on Zipteams**. This is how a call gets attributed. If no Active Zipteams user in your organisation has this email, **the call is not synced**. Must be a valid email — do not send `""`. |
| `id` | string | **Yes** | Your own internal identifier for the agent. Echoed back as `agent_id` in the callback. If you genuinely cannot supply `email`, this is used as a fallback — but only if the id was pre-registered against the Zipteams user, so treat `email` as the path that works. |

:::danger The agent must exist on Zipteams first
This is the most common cause of "my calls aren't showing up". Add your agents before you start syncing:

**Setup → Manage Team → Add → enter comma-separated emails → scroll down to the "Invited" section → Make All Active**

Only Active users' calls will sync.
:::

### `customer` object — optional

The person on the other end of the call. Zipteams matches an existing customer by email or phone within your workspace, and creates one if there is no match.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Your CRM's identifier for this customer. Stored against the Zipteams customer and echoed back as `customer_id` in both callbacks. Strongly recommended so you can join the analysis back to your own records. |
| `name` | string | No | Customer's full name. If omitted, the phone number is used as the display name in Zipteams. |
| `email` | string | No | Customer's email. Required **only** if you are not sending `call.phone_number`. If you send this key, it must be a valid email — do not send `""`. |
| `disposition_status` | string | No | The outcome of this call in your system (e.g. `Interested`, `Callback Requested`, `Not Reachable`). Free text — send whatever your CRM uses. Recorded against the customer with the call's timestamp. |
| `phone_number` | string | No | **Ignored during call sync.** Put the phone number in `call.phone_number` instead. This field is only used by [Section 2](./disposition-status-update.md). |

:::info One of these two is mandatory
You must send either **`call.phone_number`** or **`customer.email`**. If both are missing, the record is rejected — Zipteams has no way to identify the customer.
:::

### `custom_fields` array — optional

Data from your system that you want **stored and visible inside Zipteams**.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `internal_name` | string | **Yes** | The identifier generated by Zipteams for this field. You cannot make this up — it must be created on the dashboard first (see below). Names are sequential: `zt_custom_1`, `zt_custom_2`, `zt_custom_3`… If the `internal_name` does not exist in your workspace, the value is not stored. |
| `value` | string | **Yes** | The value for this call. Send it as a string. |

**To create a field and find its `internal_name`:**

1. Go to **Setup → Connect your CRM**
2. Scroll to **Enable Inbound Dynamic CRM Fields Mapping**
3. Click **+ Add New Field**
4. After saving, the **`internal_name`** appears on the same page next to your new field — copy it from there

The `internal_name` is **not** derived from the label you typed. A field you label "Lead Source" will be `zt_custom_1`, not `lead_source`. Always copy the generated value.

```json
"custom_fields": [
  { "internal_name": "zt_custom_1", "value": "Google Ads" }
]
```

### `metadata` object — optional

Data you want **handed straight back to you**. Zipteams stores it and returns it verbatim in the `meta` object of the [Call Summary Callback](./call-summary-callback.md). It is never interpreted, never shown on the dashboard, and never used for matching.

Use it for anything your own system needs in order to process the callback — a row id, a ticket number, a campaign name, a queue name.

```json
"metadata": {
  "internal_row_id": "8842",
  "campaign": "July Retargeting",
  "queue": "inbound-support"
}
```

| Rule | Detail |
|------|--------|
| Type | Must be a JSON **object** of key–value pairs. An array or a string will be rejected. |
| Values | Use strings. |
| Size | Keep it small — around 5 keys. It is metadata, not a payload. |

:::tip Not sure which one to use?
`custom_fields` = "I want to see this in Zipteams."
`metadata` = "I want this back in the callback."
You can use both in the same request.
:::

### `callback_url` — optional

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `callback_url` | string (URL) | No | An HTTPS URL Zipteams will `POST` the completed analysis to. Providing it automatically enables the [Call Summary Callback](./call-summary-callback.md) — there is nothing else to switch on. |

:::danger Never send `"callback_url": ""`
An empty string is **not** a valid URL and the entire record will be rejected with a validation error. If you do not have a callback URL, **leave the key out of the JSON altogether**.

```json
// ✅ Correct — no callback wanted
{ "call": { }, "agent": { } }

// ✅ Correct — callback wanted
{ "call": { }, "agent": { }, "callback_url": "https://yourcompany.com/hook" }

// ❌ Rejected
{ "call": { }, "agent": { }, "callback_url": "" }
```

If you would rather view the analysis in Zipteams than receive it over a webhook, simply omit `callback_url` and use the [Zipteams Dashboard](/dashboard/customer-insights.md).
:::

---

## Examples

### Minimal — a single call

```bash
# Replace with the API key Zipteams shared with you
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "data": [
    {
      "call": {
        "id": "call_98231",
        "recording_url": "https://recordings.yourcompany.com/98231.mp3",
        "start_time": "2026-07-28T09:15:00Z",
        "phone_number": "+919876543210"
      },
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      }
    }
  ]
}'
```

### Full — customer details, custom fields, callback and metadata

```bash
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "data": [
    {
      "call": {
        "id": "call_98231",
        "recording_url": "https://recordings.yourcompany.com/98231.mp3",
        "start_time": "2026-07-28T09:15:00Z",
        "phone_number": "+919876543210"
      },
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
        { "internal_name": "zt_custom_1", "value": "Google Ads" },
        { "internal_name": "zt_custom_2", "value": "POL-77120" }
      ],
      "callback_url": "https://yourcompany.com/zipteams/call-analysis",
      "metadata": {
        "internal_row_id": "8842",
        "campaign": "July Retargeting"
      }
    }
  ]
}'
```

### Recording behind an IP whitelist

Whitelist `13.201.157.246` on your recording server, then send `access_type`:

```bash
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "data": [
    {
      "call": {
        "id": "call_98232",
        "recording_url": "https://private-recordings.yourcompany.com/98232.mp3",
        "start_time": "2026-07-28T11:40:00Z",
        "phone_number": "+919812345678",
        "access_type": "whitelisted_ip"
      },
      "agent": {
        "id": "AG-4471",
        "email": "priya.sharma@yourcompany.com"
      }
    }
  ]
}'
```

### Several calls in one request

```bash
ZIPTEAMS_ENDPOINT_URL="https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler"
ZIP_API_KEY="your-api-key"

curl -X POST "$ZIPTEAMS_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -H "x-zip-api-key: $ZIP_API_KEY" \
  -d '{
  "data": [
    {
      "call": {
        "id": "call_98233",
        "recording_url": "https://recordings.yourcompany.com/98233.mp3",
        "start_time": "2026-07-28T09:15:00Z",
        "phone_number": "+919876543210"
      },
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" }
    },
    {
      "call": {
        "id": "call_98234",
        "recording_url": "https://recordings.yourcompany.com/98234.mp3",
        "start_time": "2026-07-28T09:52:00Z",
        "phone_number": "+919811122233"
      },
      "agent": { "id": "AG-5502", "email": "arjun.mehta@yourcompany.com" }
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

This confirms your payload was accepted and queued. Recording download, transcription and AI analysis then happen asynchronously — typically within a few minutes of the request, depending on the length of the recording.

For error responses, see [Responses](./introduction.md#responses) in the overview.

---

## What happens after a successful call sync

1. Zipteams checks that `call.id` has not already been synced.
2. The agent is resolved from `agent.email` (falling back to `agent.id`). **If no Active Zipteams user matches, processing stops here.**
3. The customer is matched by `customer.email` or `call.phone_number`, or created if there is no match.
4. `customer.id` is stored as the customer's CRM id, `disposition_status` is recorded, and `custom_fields` are saved against the call.
5. The recording is fetched — using the whitelisted IP if `access_type` is `whitelisted_ip` — then transcribed and analysed.
6. If `callback_url` was provided, the results are posted to it. See [Section 3](./call-summary-callback.md).

If the call does not appear in Zipteams, work through [Why a call did not sync](./introduction.md#why-a-call-did-not-sync).

---

## Related

- [Section 2 — Disposition Status Update API](./disposition-status-update.md) — update a status without sending a call
- [Section 3 — Call Summary Callback](./call-summary-callback.md) — the analysis you get back for this call
- [Section 4 — Customer Summary Callback](./customer-summary-callback.md) — contact-level rollup
