---
sidebar_position: 5
---

# Section 4 — Customer Summary Callback

Where [Section 3](./call-summary-callback.md) tells you about **one call**, this callback tells you about **the contact**.

It is a flat, CRM-shaped view of where a customer currently stands — their latest intent, their BANT position, their qualification answers, their talking points, keyed by the contact's phone and email rather than by a call id. It is designed to be written straight into a CRM record or an automation tool without much transformation.

## How to enable it

:::warning This callback is not enabled by default
Unlike Section 3, sending a `callback_url` does **not** switch this on. It has to be configured for your workspace by Zipteams.

**[Contact us](mailto:support@zipteams.com)** to enable it, and tell us:

1. **The URL** you want the payload posted to.
2. **Your field names**, if you want the contact identifiers renamed to match your system — see [Field name mapping](#field-name-mapping) below.
3. **Basic auth credentials**, if your endpoint requires them — see [Authentication](#authentication-on-your-endpoint) below.

We will confirm once it is live.
:::

---

## Delivery details

| Property | Value |
|----------|-------|
| Method | `POST` |
| Content type | `application/json` |
| Destination | The URL you gave us during enablement — **not** the `callback_url` in your call-sync payload |
| Timing | After each call for that contact finishes processing, reflecting their latest state |
| Expected response | `200 OK` |
| Authentication | None by default; HTTP Basic Auth available on request |

:::info If your endpoint restricts inbound traffic by IP
We can send these callbacks from a fixed whitelisted IP address:

```
13.201.157.246
```

Mention it when you contact us to enable the callback and we will configure it at the same time.
:::

---

## Payload

```json
{
  "type": "CUSTOMER_SUMMARY",
  "customer_id": "CRM-100294",
  "phone": "+919876543210",
  "email": "rahul.verma@example.com",
  "owner": "priya.sharma@yourcompany.com",
  "intent": "INTERESTED",
  "intent_justification": "The customer confirmed budget availability and asked for a demo next week, indicating active evaluation.",
  "intent_score": 74,
  "objection": "Concerned about how quickly the team can be onboarded before the quarter ends.",
  "objection_handling": "The agent explained that onboarding takes under a week and offered a weekend setup session.",
  "objection_category": "Implementation Timeline",
  "budget": "Approximately 3 lakh per annum, already approved.",
  "authority": "The customer is the decision maker but will loop in their finance lead.",
  "needs": "Call quality visibility across a 40-member sales team and less manual call auditing.",
  "competitors": "Also evaluating one other vendor.",
  "timeline": "Wants to go live before the end of the quarter.",
  "customer_involvement": 68,
  "call_quality_score": 82,
  "qualification": {
    "Needs": "Call quality visibility for a 40-member sales team.",
    "Budget": "Confirmed budget of approximately 3 lakh per annum.",
    "Timeline": "Wants to go live before the end of the quarter."
  },
  "talking_points": "1. Onboarding timeline\n  Walk through the one-week onboarding plan and share the checklist.\n  This directly addresses their quarter-end concern.\n\n2. Competitor differentiation\n  Cover the two capabilities the other vendor does not offer before revisiting pricing.\n  The customer raised the comparison but it was never addressed.",
  "meta": {
    "internal_row_id": "8842",
    "campaign": "July Retargeting"
  }
}
```

---

## Field reference

### Identification

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"CUSTOMER_SUMMARY"`. Use it to tell this payload apart from `CALL_SUMMARY` if both post to the same endpoint. |
| `customer_id` | string | The `customer.id` you sent when syncing the call — i.e. your own CRM id for this contact. Use this to look the record up on your side. |
| `phone` | string | The contact's phone number. **The key name is configurable** — see [Field name mapping](#field-name-mapping). |
| `email` | string | The contact's email. Key name configurable. |
| `owner` | string | Email of the Zipteams user who owns this contact. Key name configurable. |

### Intent

| Field | Type | Description |
|-------|------|-------------|
| `intent` | string | **Aggregated** intent label across all of this contact's calls, e.g. `HIGH`, `MODERATE`, `LOW`, `INTERESTED`, `NEUTRAL`, `NOT_QUALIFIED`, `NOT_AVAILABLE`. |
| `intent_justification` | string | Why that intent label was assigned. Free text, typically 3–4 lines — size your CRM field accordingly. |
| `intent_score` | number | Score from **0 to 100** representing the lead's overall interest level. |

### BANT and objections

| Field | Type | Description |
|-------|------|-------------|
| `budget` | string | Budget information captured from the BANT framework across all calls. |
| `authority` | string | Decision-maker information captured from BANT. |
| `needs` | string | Key requirements and pain points captured from BANT. |
| `timeline` | string | Expected purchase or decision timeline from BANT. |
| `competitors` | string | Competing products or vendors the lead mentioned. |
| `objection` | string | Key objections raised by the lead across all calls. |
| `objection_handling` | string | How the agent handled or addressed those objections. |
| `objection_category` | string | Category bucket for the objection, e.g. `Pricing`, `Functionality`, `Timing`. |

### Scores

| Field | Type | Description |
|-------|------|-------------|
| `customer_involvement` | number | Score from **0 to 100** for how engaged the lead was across their calls. Higher means more two-way conversation and less agent monologue. |
| `call_quality_score` | number | Audit / quality score from **0 to 100**, reflecting the most recent call with this lead. |

### Qualification and coaching

| Field | Type | Description |
|-------|------|-------------|
| `qualification` | object | A flat map of `label` → `answer` for each qualification topic that was discussed. **Note the difference from Section 3**, where `qualification` is an *array* of `{ label, answer }` objects. Here it is an object keyed by label, so it drops straight into CRM fields. |
| `talking_points` | string | Suggested next-conversation talking points as a single numbered, newline-separated string, ready to paste into a CRM note field. |

### Your data

| Field | Type | Description |
|-------|------|-------------|
| `meta` | object | The `metadata` object from this contact's most recent synced call, returned verbatim. Empty or absent if no metadata was sent. |

:::note Every analysis field is optional
Only `type` is guaranteed. Any inference field can be empty or absent depending on what was actually discussed. Never assume a field is present.
:::

---

## Field name mapping

Three keys in the payload are renameable, so the JSON can match the field names your CRM or automation tool already expects. Tell us the mapping when you ask us to enable the callback.

| Payload key | Default name | Example custom name |
|-------------|--------------|---------------------|
| Phone | `phone` | `phone_number`, `mobile`, `Phone__c` |
| Email | `email` | `contact_email`, `Email` |
| Owner | `owner` | `OwnerId`, `assigned_to` |

With a mapping of `phone → phone_number`, `email → contact_email`, `owner → OwnerId`, the top of the payload arrives as:

```json
{
  "type": "CUSTOMER_SUMMARY",
  "customer_id": "CRM-100294",
  "phone_number": "+919876543210",
  "contact_email": "rahul.verma@example.com",
  "OwnerId": "priya.sharma@yourcompany.com",
  "intent": "INTERESTED"
}
```

All other field names are fixed.

---

## Authentication on your endpoint

By default the callback is an unauthenticated `POST` with `Content-Type: application/json`.

If your endpoint requires **HTTP Basic Auth**, give us the username and password during enablement and we will send an `Authorization: Basic …` header on every request.

Other auth schemes (bearer tokens, HMAC signatures, custom headers) are not currently supported. If you need one, get in touch and we will discuss options — a common workaround is a hard-to-guess path segment or query string in the callback URL itself.

---

## Receiving the callback

```javascript
// Express example
app.post('/zipteams/customer-summary', (req, res) => {
  // 1. Acknowledge first.
  res.sendStatus(200);

  // 2. Then process.
  const payload = req.body;

  if (payload.type !== 'CUSTOMER_SUMMARY') return;   // ignore other callback types

  // qualification is an OBJECT here, not an array
  const budgetAnswer = payload.qualification?.['Budget'];

  crm.upsertContact({
    externalId: payload.customer_id,
    phone: payload.phone,
    email: payload.email,
    intent: payload.intent,
    intentScore: payload.intent_score,
    nextSteps: payload.talking_points,
    budget: budgetAnswer,
  });
});
```

### Testing your endpoint

```bash
YOUR_CALLBACK_URL="https://yourcompany.com/zipteams/customer-summary"

curl -X POST "$YOUR_CALLBACK_URL" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "CUSTOMER_SUMMARY",
  "customer_id": "CRM-100294",
  "phone": "+919876543210",
  "email": "rahul.verma@example.com",
  "owner": "priya.sharma@yourcompany.com",
  "intent": "INTERESTED",
  "intent_justification": "The customer confirmed budget availability and asked for a demo next week.",
  "intent_score": 74,
  "objection": "Concerned about onboarding time before quarter end.",
  "objection_handling": "The agent explained onboarding takes under a week.",
  "objection_category": "Implementation Timeline",
  "budget": "Approximately 3 lakh per annum, already approved.",
  "authority": "Decision maker, will loop in finance.",
  "needs": "Call quality visibility for a 40-member sales team.",
  "competitors": "Also evaluating one other vendor.",
  "timeline": "Wants to go live before quarter end.",
  "customer_involvement": 68,
  "call_quality_score": 82,
  "qualification": {
    "Budget": "Confirmed approximately 3 lakh per annum.",
    "Timeline": "Wants to go live before the end of the quarter."
  },
  "talking_points": "1. Onboarding timeline\n  Walk through the one-week onboarding plan.",
  "meta": { "internal_row_id": "8842" }
}'
```

If you use Basic Auth, add `-u "username:password"`.

---

## Section 3 or Section 4 — which do you need?

|  | Section 3 — Call Summary | Section 4 — Customer Summary |
|--|--------------------------|------------------------------|
| Granularity | One payload per **call** | One payload per **contact**, refreshed after each of their calls |
| Enabling | Automatic — just send `callback_url` | **Contact us** to enable |
| Destination URL | The `callback_url` in your payload, per call | One URL configured for your workspace |
| Primary key | `call_id` | `customer_id`, plus phone and email |
| `type` value | `CALL_SUMMARY` | `CUSTOMER_SUMMARY` |
| `qualification` shape | Array of `{ label, answer }` | Object of `label: answer` |
| Includes chapter summaries | Yes (`summary`) | No |
| Includes per-parameter QA scoring | Yes (`quality` array) | No — only the aggregate `call_quality_score` |
| Includes BANT as separate fields | Grouped in a `bant` object | Flat top-level fields |
| Includes talking points | No | Yes (`talking_points`) |
| Custom field names | No | Yes, for phone / email / owner |
| Basic auth support | No | Yes |
| Best for | Call-level QA, coaching dashboards, per-call records | Writing the latest state into a CRM contact or an automation tool |

Most integrations start with **Section 3** and add **Section 4** later when they want contact-level state pushed into a CRM. You can run both at the same time — check the `type` field to tell them apart.

---

## Related

- [Section 1 — Call Sync API](./call-sync.md) — where `customer.id` and `metadata` are set
- [Section 3 — Call Summary Callback](./call-summary-callback.md) — the per-call equivalent, enabled by default
