---
sidebar_position: 4
---

# Section 3 — Call Summary Callback

This is the **per-call** analysis Zipteams sends back to you once a recording has finished processing. One call in via [Section 1](./call-sync.md), one callback out.

It is the section most integrations need. Everything Zipteams inferred from that single conversation — intent, BANT, chapter summaries, qualification answers, pitch-quality scoring — arrives in one `POST` to a URL you own.

## What you receive

If you are creating fields in your own CRM to hold this data, these are the outputs to plan for:

| Output | Type | Notes for sizing your fields |
|--------|------|------------------------------|
| Customer intent | string | A label such as `INTERESTED`. Short. |
| Customer intent justification | string | Free text, typically 3–4 lines. Use a long-text field. |
| Concern / low-intent category | string | The bucket behind a low intent, e.g. `Financial Constraints`, `Pricing`, `Functionality`. Delivered as `bant.concern_categories`. Short. |
| Call summary and action items | array of strings | Chapter-by-chapter. Can total up to roughly **600 words** per call. Needs a long-text field, or one row per chapter. |
| Call quality score | number | 0–100. |
| Qualification answers | array | One label + answer pair per topic discussed. Variable length. |
| Per-parameter quality scoring | array | One entry per configured audit parameter, with coaching suggestions. |

## How to enable it

**Send `callback_url` in your call sync payload. That's it.**

```json
{
  "data": [
    {
      "call": { "id": "call_98231", "recording_url": "…", "start_time": "…", "phone_number": "…" },
      "agent": { "id": "AG-4471", "email": "priya.sharma@yourcompany.com" },
      "callback_url": "https://yourcompany.com/zipteams/call-analysis"
    }
  ]
}
```

This callback is **enabled by default** — no configuration on the Zipteams side is needed. If `callback_url` is present, you get the callback. If it is absent, you do not.

:::danger Never send an empty `callback_url`
`"callback_url": ""` is not a valid URL and will cause the **entire call record to be rejected**. If you do not want a callback, leave the key out of the JSON completely.
:::

:::tip Don't want to build a webhook receiver?
Omit `callback_url` and view exactly the same analysis on the [Zipteams Dashboard](/dashboard/customer-insights.md), or embed it in your own app with our [embeddable components](/dashboard/customer-insights.md). No integration work required.
:::

---

## Delivery details

| Property | Value |
|----------|-------|
| Method | `POST` |
| Content type | `application/json` |
| Destination | The exact `callback_url` you sent for that call |
| Timing | A few minutes after your call-sync request, depending on recording length |
| Expected response | `200 OK` — return it as soon as you have received the body, do not process synchronously |
| Retries | Up to 3 attempts with exponential backoff if your endpoint errors or times out |
| Identifier | `call_id` — always present, always matches the `call.id` you sent |

Your endpoint must be publicly reachable over HTTPS.

:::info If your endpoint restricts inbound traffic by IP
We can send these callbacks from a fixed whitelisted IP address:

```
13.201.157.246
```

This is **not enabled by default**. [Contact us](mailto:support@zipteams.com) with the workspace and the callback URL, and we will switch it on for you. Whitelisting the IP on your firewall alone is not sufficient — the routing has to be enabled on our side too.
:::

---

## Payload

```json
{
  "call_id": "call_98231",
  "customer_id": "CRM-100294",
  "agent_id": "AG-4471",
  "type": "CALL_SUMMARY",
  "intent": "INTERESTED",
  "intent_justification": "The customer confirmed budget availability and asked for a demo next week, indicating active evaluation. No pricing objection was raised.",
  "intent_score": 74,
  "quality_score": 82,
  "summary": [
    {
      "chapter_name": "Introduction and Requirement Gathering",
      "chapter_summary": "The agent introduced themselves and confirmed the customer had submitted an enquiry. The customer explained they are looking for a solution for a 40-member sales team."
    },
    {
      "chapter_name": "Pricing and Next Steps",
      "chapter_summary": "Pricing tiers were discussed along with the annual discount. The customer asked for a demo the following week and agreed to loop in their finance lead."
    }
  ],
  "bant": {
    "needs": "The customer needs call quality visibility across a 40-member sales team and wants to reduce manual call auditing effort.",
    "objection": "Concerned about how quickly the team can be onboarded before the quarter ends.",
    "concern_categories": "Implementation Timeline",
    "objection_handling": "The agent explained that onboarding takes under a week and offered to run the setup session on a Saturday to avoid disrupting the team."
  },
  "qualification": [
    { "label": "Needs", "answer": "Call quality visibility for a 40-member sales team." },
    { "label": "Budget", "answer": "Confirmed budget of approximately 3 lakh per annum." },
    { "label": "Timeline", "answer": "Wants to go live before the end of the quarter." }
  ],
  "quality": [
    {
      "parameter_name": "Setting Context",
      "justification": "The agent clearly stated the purpose of the call and confirmed the agenda with the customer before proceeding.",
      "suggestion": "Continue opening calls by stating the purpose and confirming the agenda.",
      "inference_score": 10,
      "parameter_score": 10,
      "status": "Done",
      "is_fatal": false
    },
    {
      "parameter_name": "Competitor Differentiation",
      "justification": "The customer mentioned they are also evaluating another vendor, but the agent did not explain how Zipteams differs.",
      "suggestion": "When a competitor is mentioned, walk through the two or three capabilities they do not offer before moving on to pricing.",
      "inference_score": 0,
      "parameter_score": 10,
      "status": "Needs Improvement",
      "is_fatal": true
    }
  ],
  "meta": {
    "internal_row_id": "8842",
    "campaign": "July Retargeting"
  }
}
```

---

## Field reference

### Top level

| Field | Type | Always present | Description |
|-------|------|----------------|-------------|
| `call_id` | string | **Yes** | The `call.id` you sent in the call-sync request. **Use this to join the callback back to your own record.** |
| `customer_id` | string | No | The `customer.id` you sent, if you sent one. |
| `agent_id` | string | No | The `agent.id` you sent. |
| `type` | string | **Yes** | Always `"CALL_SUMMARY"` for this callback. Use it to distinguish this payload from the [Customer Summary Callback](./customer-summary-callback.md) if both post to the same endpoint. |
| `intent` | string | No | The customer's overall intent, e.g. `INTERESTED`, `NOT_INTERESTED`, `NEUTRAL`, `NOT_QUALIFIED`, `NOT_AVAILABLE`. |
| `intent_justification` | string | No | Why that intent was assigned, in plain language. Useful to show agents and managers rather than just the label. |
| `intent_score` | number | No | Buying-propensity score from **0 to 100**, rounded to a whole number. Higher means the prospect looks more like the profile of customers who historically converted. |
| `quality_score` | number | No | Overall call-quality score from **0 to 100**, aggregated across all the parameters in the `quality` array. Higher is better. Use it for performance tracking; use the `quality` array for the per-parameter detail behind it. |
| `summary` | array | No | Chapter-by-chapter summary of the conversation. See below. |
| `bant` | object | No | Budget / Authority / Need / Timeline extraction. See below. |
| `qualification` | array | No | Answers to your configured qualification questions. Only questions **actually discussed** on the call are included. See below. |
| `quality` | array | No | Per-parameter pitch-quality scoring, for coaching. See below. |
| `meta` | object | No | The `metadata` object you sent in the call-sync request, returned **verbatim**. Empty object if you sent nothing. |

### `summary` array

Each element is one chapter of the conversation, in order.

| Field | Type | Description |
|-------|------|-------------|
| `chapter_name` | string | Title of this part of the conversation. |
| `chapter_summary` | string | What was discussed in this part. |

### `bant` object

| Field | Type | Description |
|-------|------|-------------|
| `needs` | string | What the customer said they need. |
| `objection` | string | Objections or concerns the customer raised. |
| `concern_categories` | string | Category of the concern, e.g. `Pricing`, `Functionality`, `Implementation Timeline`. |
| `objection_handling` | string | How the agent responded to those objections. |

Any of these can be empty if the topic did not come up on the call.

### `qualification` array

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | The qualification question / topic, e.g. `Needs`, `Budget`, `Timeline`. |
| `answer` | string | What was established on the call for that topic. |

:::note Only discussed topics appear
Qualification topics that were not covered in the conversation are omitted from the array entirely — they are not returned with a null answer. Do not assume a fixed set of labels or a fixed array length.
:::

### `quality` array

One element per pitch-quality parameter configured for your workspace. This is the data to use for agent coaching and QA dashboards.

| Field | Type | Description |
|-------|------|-------------|
| `parameter_name` | string | The parameter being assessed, e.g. `Setting Context`, `Competitor Differentiation`. |
| `justification` | string | Evidence from the call for the score given. |
| `suggestion` | string | Actionable coaching feedback for the agent. |
| `inference_score` | number | The score the agent actually got on this parameter. |
| `parameter_score` | number | The maximum score available for this parameter. Use it as the denominator — parameters are not equally weighted. |
| `status` | string | Human-readable outcome derived from the two scores. One of `Done`, `Partially Done`, `Needs Improvement`, `Not Applicable`. |
| `is_fatal` | boolean | `true` means this parameter is critical for your business and needs attention regardless of the overall score. Surface these first. |

**How `status` is derived**, if you want to reproduce it:

| Condition | `status` |
|-----------|----------|
| The parameter was not discussed / no data found on the call | `Not Applicable` |
| `inference_score` equals `parameter_score` | `Done` |
| `inference_score` is above 0 but below `parameter_score` | `Partially Done` |
| `inference_score` is 0 | `Needs Improvement` |

---

## Receiving the callback

A minimal receiver — acknowledge immediately, process afterwards:

```javascript
// Express example
app.post('/zipteams/call-analysis', (req, res) => {
  // 1. Acknowledge first. Zipteams retries on non-200 responses.
  res.sendStatus(200);

  // 2. Then process asynchronously.
  const payload = req.body;

  if (payload.type !== 'CALL_SUMMARY') return;   // ignore other callback types

  const yourRowId = payload.meta?.internal_row_id;  // whatever you put in metadata
  const callId = payload.call_id;                   // always present

  queue.push({ callId, yourRowId, payload });
});
```

### Testing your endpoint

Before going live, verify your receiver handles the payload shape by posting the sample above to it yourself:

```bash
YOUR_CALLBACK_URL="https://yourcompany.com/zipteams/call-analysis"

curl -X POST "$YOUR_CALLBACK_URL" \
  -H "Content-Type: application/json" \
  -d '{
  "call_id": "call_98231",
  "customer_id": "CRM-100294",
  "agent_id": "AG-4471",
  "type": "CALL_SUMMARY",
  "intent": "INTERESTED",
  "intent_justification": "The customer confirmed budget availability and asked for a demo next week.",
  "intent_score": 74,
  "quality_score": 82,
  "summary": [
    { "chapter_name": "Introduction", "chapter_summary": "The agent introduced themselves and confirmed the enquiry." }
  ],
  "bant": {
    "needs": "Call quality visibility for a 40-member sales team.",
    "objection": "Concerned about onboarding time.",
    "concern_categories": "Implementation Timeline",
    "objection_handling": "The agent explained onboarding takes under a week."
  },
  "qualification": [
    { "label": "Budget", "answer": "Confirmed approximately 3 lakh per annum." }
  ],
  "quality": [
    {
      "parameter_name": "Setting Context",
      "justification": "The agent clearly stated the purpose of the call.",
      "suggestion": "Keep doing this.",
      "inference_score": 10,
      "parameter_score": 10,
      "status": "Done",
      "is_fatal": false
    }
  ],
  "meta": { "internal_row_id": "8842", "campaign": "July Retargeting" }
}'
```

---

## Integration notes

- **Always key on `call_id`.** It is the only field guaranteed to be present, and it always matches the `call.id` you sent.
- **Treat every analysis field as optional.** Depending on the recording quality, its length and what was actually said, individual fields can be empty or absent. Never assume a field exists.
- **Respond `200` fast.** Do your processing after acknowledging. A slow endpoint looks like a failure and triggers retries.
- **Be idempotent.** Because failed deliveries are retried, your endpoint may see the same `call_id` more than once. Upsert rather than insert.
- **Use `meta` for correlation.** Anything you put in `metadata` at sync time comes back here untouched. It is the cleanest way to tie the analysis to your own primary key without storing a mapping table.
- **Check `type`** if you also enable [Section 4](./customer-summary-callback.md) and both post to the same URL. `CALL_SUMMARY` is per call; `CUSTOMER_SUMMARY` is per contact.

---

## Related

- [Section 1 — Call Sync API](./call-sync.md) — where `callback_url` and `metadata` are set
- [Section 4 — Customer Summary Callback](./customer-summary-callback.md) — the contact-level equivalent
