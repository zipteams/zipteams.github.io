---
sidebar_position: 1
---

# Customer API — Overview

The **Customer API** is how you push your own call data into Zipteams and get AI analysis back.

You send us a call recording plus a small amount of context (who the agent was, who the customer was). Zipteams transcribes the recording, runs its AI analysis, and — if you ask for it — posts the results back to a URL you control.

There are **four things** to understand, and they are documented one per page:

| # | Section | Direction | Purpose |
|---|---------|-----------|---------|
| 1 | [Call Sync API](./call-sync.md) | You → Zipteams | Send a call recording + context so Zipteams can analyse it |
| 2 | [Disposition Status Update API](./disposition-status-update.md) | You → Zipteams | Update a customer's status / custom fields **without** sending a call |
| 3 | [Call Summary Callback](./call-summary-callback.md) | Zipteams → You | Per-call AI analysis, posted back to your `callback_url` |
| 4 | [Customer Summary Callback](./customer-summary-callback.md) | Zipteams → You | Contact-level rollup of AI analysis, posted back to your URL |

Sections **1 and 2** are APIs you call. Sections **3 and 4** are webhooks we call.

Separately, and optional: the [Chrome Extension](./chrome-extension.md) can surface a contact's insights inside your own web interface. It needs no API key and is not part of the four sections above.

---

## How the flow works

```
 ┌──────────────┐   1. POST call data      ┌─────────────────────┐
 │  Your system │ ───────────────────────► │  Zipteams API       │
 └──────────────┘                          └──────────┬──────────┘
        ▲                                             │
        │                                             │ 2. queued, one record at a time
        │                                             ▼
        │                                  ┌─────────────────────┐
        │                                  │  Zipteams platform  │
        │                                  │  • fetch recording  │
        │                                  │  • transcribe       │
        │                                  │  • AI analysis      │
        │                                  └──────────┬──────────┘
        │                                             │
        │      3. Call Summary Callback               │
        └─────────────────────────────────────────────┘
               4. Customer Summary Callback
                  (on request)
```

**The API responds immediately with `200 OK` as soon as your payload is accepted.** It does *not* wait for the recording to be downloaded, transcribed or analysed — that happens asynchronously and takes a few minutes depending on the length of the recording.

:::warning `200 OK` means "accepted", not "processed"
A `200` response only confirms that your request was well-formed and queued. A call can still fail to sync afterwards — for example if the recording URL is not reachable or the agent does not exist on Zipteams. See [Why a call did not sync](#why-a-call-did-not-sync) below.
:::

---

## Endpoint

Everything in sections 1 and 2 goes to a **single endpoint** using `POST`:

```
POST https://mixu6sd8i0.execute-api.ap-south-1.amazonaws.com/calls-webhook-ingestion-handler
```

Which action you are performing is decided by the **`type`** field in the request body:

| `type` value | Action | Documented in |
|--------------|--------|---------------|
| *(omit the field)* | Sync a call recording | [Section 1](./call-sync.md) |
| `"disposition-status"` | Update customer status / custom fields | [Section 2](./disposition-status-update.md) |

---

## Authentication

Send your API key in a header on every request:

```
x-zip-api-key: YOUR_API_KEY
```

| Header | Required | Notes |
|--------|----------|-------|
| `x-zip-api-key` | Yes | Provided by Zipteams during onboarding. Keep it secret — it identifies your organisation. |
| `Content-Type` | Yes | Must be `application/json`. |

There is no other header to send. You do **not** need to pass your organisation id anywhere — it is derived from your API key.

### Authentication errors

| Status | Response | Meaning |
|--------|----------|---------|
| `403` | `{ "error": "No authorization header" }` | The `x-zip-api-key` header was missing. |
| `401` | `{ "error": "Incorrect API Key in Authorization Header" }` | The key is wrong, or has been revoked. |

---

## Request envelope

Both sections 1 and 2 use the same envelope. `data` is always an **array**, so you can send several records in one request.

```json
{
  "type": "disposition-status",
  "data": [
    { "...": "one record" },
    { "...": "another record" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | No | Omit it to sync calls. Set it to `"disposition-status"` to update statuses instead. |
| `data` | array | Yes | One or more records. Each record is processed **independently** — one bad record does not stop the others. |

:::tip Keep batches small
Each record in `data` is queued separately. Batches of **up to 50 records** per request work best. If you have more, split them across multiple requests.
:::

---

## Responses

### Success

```json
{
  "message": "Data Received Successfully"
}
```

**HTTP Status Code**: `200 OK`

### Errors

| Status | Response | Cause |
|--------|----------|-------|
| `400` | `{ "error": "No body found" }` | The request had no body. |
| `400` | `{ "error": "Invalid JSON" }` | The body was not valid JSON. A common cause is a trailing comma or an unescaped quote. |
| `403` | `{ "error": "No authorization header" }` | Missing `x-zip-api-key` header. |
| `401` | `{ "error": "Incorrect API Key in Authorization Header" }` | Invalid API key. |

---

## Before you start: two one-time setup steps

Two things must be configured on the Zipteams Dashboard before your data will sync. Both are done once, by an admin on your team.

### 1. Add your agents to Zipteams

A call only syncs if the agent it belongs to **already exists on Zipteams and is Active**. This is the single most common reason calls silently do not appear.

To add agents:

1. Go to **Setup → Manage Team**
2. Click the **Add** button
3. Enter one email, or several comma-separated emails, of the agents you want to onboard
4. Scroll down — the new users appear in the **Invited** section
5. Click **Make All Active**

Once they are Active, their calls will start syncing. Any call you send for an email that is not on Zipteams is dropped.

### 2. Create your custom fields (only if you use `custom_fields`)

If you want to push your own data points into Zipteams (campaign name, lead source, policy number, anything), you do it through `custom_fields`. Each custom field needs an **`internal_name`**, which is generated by Zipteams — you cannot invent it yourself.

To create a field and get its `internal_name`:

1. Go to **Setup → Connect your CRM**
2. Scroll to the **Enable Inbound Dynamic CRM Fields Mapping** section
3. Click **+ Add New Field**
4. Once saved, the **`internal_name`** is displayed on the same page, next to the field you just created

Internal names are generated in sequence — `zt_custom_1`, `zt_custom_2`, `zt_custom_3` and so on. They are **not** derived from the label you typed, so always copy the value shown on the page rather than guessing it from the field name.

Copy that value and use it as the `internal_name` in your payload:

```json
"custom_fields": [
  { "internal_name": "zt_custom_1", "value": "Google Ads" }
]
```

:::note `custom_fields` vs `metadata` — what's the difference?
They look similar but do opposite things.

- **`custom_fields`** — data you want to **store in Zipteams**. It becomes visible on the Zipteams dashboard and can be used in reports. Requires an `internal_name` created on the dashboard first.
- **`metadata`** — data you want **echoed back to you**. Zipteams does not interpret it; it simply returns it untouched in the `meta` object of the [Call Summary Callback](./call-summary-callback.md). Use it to carry your own correlation ids (ticket id, campaign id, internal row id) through the async processing.

Send a value in `custom_fields` if *you* want to see it in Zipteams. Send it in `metadata` if *your* system needs it back.
:::

---

## Recording URLs

Everything Zipteams does starts with the recording, so this is the field to get right.

- **`recording_url` must always be present.** If it is missing or empty, nothing syncs — no customer is created, no analysis runs.
- **It must be publicly accessible.** Zipteams fetches the file over plain HTTP(S) with no credentials. If the URL requires a login, a signed token that has already expired, or is behind a VPN, the fetch fails.
- **Supported formats**: MP3, WAV, AAC, M4A, MP4.

### If your recordings require IP whitelisting

Some telephony providers restrict recording downloads to approved IPs. If that is your setup:

1. **Whitelist this Zipteams IP address:**

   ```
   13.201.157.246
   ```

2. **Tell us to use it**, by setting `access_type` in the call object:

   ```json
   "call": {
     "id": "call_98231",
     "recording_url": "https://recordings.yourcompany.com/98231.mp3",
     "start_time": "2026-07-28T09:15:00Z",
     "phone_number": "+919876543210",
     "access_type": "whitelisted_ip"
   }
   ```

Both steps are needed. Whitelisting the IP without sending `access_type: "whitelisted_ip"` will not work, because the request will be made from our standard processing path instead of the whitelisted one.

If your recordings are publicly accessible, **omit `access_type` entirely**.

:::info Whitelisting for the callbacks too
If *your* webhook endpoint (sections 3 and 4) also restricts inbound traffic by IP, we can send our callbacks from the same whitelisted address `13.201.157.246`. This is not on by default — [contact us](mailto:support@zipteams.com) and we will enable it for your workspace.
:::

---

## Common mistakes

These are the issues that come up most often during integration. Each one is worth checking before you get in touch.

| Mistake | What happens | Fix |
|---------|--------------|-----|
| `"callback_url": ""` | The whole record is rejected with an invalid-URL validation error | **Omit the key entirely** if you have no callback URL. An empty string is not a valid URL. The same applies to any other URL field. |
| Sending `"end_time"` | Ignored | `end_time` is not needed. Zipteams derives the call duration from the recording itself. Do not send it. |
| Phone number in the wrong place | Customer is not matched, or the record is rejected | In **Section 1 (call sync)** the phone goes in `call.phone_number`. In **Section 2 (status update)** it goes in `customer.phone_number`. They are different objects. |
| Agent email not on Zipteams | Call is dropped silently | Add the agent under **Setup → Manage Team** and click **Make All Active**. |
| Inventing an `internal_name` | The custom field value is not stored | `internal_name` must be created on the dashboard first — see [step 2](#2-create-your-custom-fields-only-if-you-use-custom_fields) above. |
| `start_time` without a timezone | The call lands at the wrong time | Always include a timezone designator — an offset (`2026-07-28T14:45:00+05:30`) or `Z` for UTC (`2026-07-28T09:15:00Z`). Both are accepted; neither is optional. |
| Reusing the same `call.id` | The second call is ignored as a duplicate | `call.id` must be unique for every call. |
| Recording URL behind auth | Call is created but no analysis appears | Make the URL public, or use [IP whitelisting](#if-your-recordings-require-ip-whitelisting). |

---

## Why a call did not sync

If a call returned `200 OK` but never appeared in Zipteams, it will be one of these:

| Reason | Explanation |
|--------|-------------|
| Recording URL not present | `call.recording_url` was empty or missing. |
| Call owner not found on Zipteams | No Active Zipteams user matched `agent.email` (or `agent.id`) within your organisation. |
| Duplicate call | A call with the same `call.id` had already been synced. |
| Maximum minutes reached | Your plan's processing minutes for the period are exhausted. Contact us to increase your limit. |
| Recording could not be fetched | The URL was not reachable, needed credentials, or the file format is unsupported. |
| Neither phone nor email supplied | At least one of `call.phone_number` or `customer.email` is required. |

---

## Support

If something is still not working after checking the above, email [support@zipteams.com](mailto:support@zipteams.com) with:

- the exact JSON payload you sent,
- the `call.id` values affected, and
- the timestamp of the request.

That lets us trace the record end to end without a call.
