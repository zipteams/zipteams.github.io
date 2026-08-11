---
sidebar_position: 6
---

# Chrome Extension — Open Zipteams from your own web app

The Zipteams Chrome extension shows a contact's Zipteams insights in a side panel, on top of whatever web interface your agents already work in — your CRM, your admin panel, your dialer.

This page covers how to trigger it programmatically from your own page, so an agent does not have to search for the contact manually.

:::note This is not one of the four API sections
Sections [1](./call-sync.md) and [2](./disposition-status-update.md) are APIs you call; sections [3](./call-summary-callback.md) and [4](./customer-summary-callback.md) are webhooks we call. The extension is a separate, optional front-end integration — no API key or backend work involved.
:::

---

## 1. Install the extension

Each agent installs it once from the Chrome Web Store:

**[Zipteams on the Chrome Web Store](https://chromewebstore.google.com/detail/zipteams/obcjlbhpiidmfcohobdeemabmkchjbib?hl=en)**

The agent then signs in with the same Zipteams account they use on the dashboard. Only contacts within their workspace are visible to them.

---

## 2. Open it from your page

Add the following one-liner to your web interface — on a button click, on row select, or whenever your agent opens a contact. Pass the contact's **email or phone number**, and the panel opens showing that contact's insights automatically.

```javascript
window.postMessage(
  {
    action: 'openZipExtensionWindow',
    payload: { email: '', phone: '' },
  },
  '*',
);
```

### Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | **Yes** | Must be exactly `"openZipExtensionWindow"`. |
| `payload.email` | string | Conditional | Email of the contact whose insights should be shown. |
| `payload.phone` | string | Conditional | Phone number of the contact, in E.164 format (`+919876543210`). |

Send **at least one** of `email` or `phone`. If you have both, send both — it improves the chance of a match. These are matched against the same contacts created by the [Call Sync API](./call-sync.md), so the contact must already exist in Zipteams.

---

## Examples

### Open on a button click

```html
<button id="zip-insights">View Zipteams Insights</button>

<script>
  document.getElementById('zip-insights').addEventListener('click', () => {
    window.postMessage(
      {
        action: 'openZipExtensionWindow',
        payload: {
          email: 'rahul.verma@example.com',
          phone: '+919876543210',
        },
      },
      '*',
    );
  });
</script>
```

### Open with values from your own page

```javascript
function openZipteamsInsights(contact) {
  window.postMessage(
    {
      action: 'openZipExtensionWindow',
      payload: {
        email: contact.email || '',
        phone: contact.phoneNumber || '',
      },
    },
    '*',
  );
}

// e.g. when your agent opens a lead
openZipteamsInsights(currentLead);
```

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Nothing happens on click | The extension is not installed, or the agent is not signed in to it. Confirm both before debugging your code. |
| Panel opens but shows no contact | Neither `email` nor `phone` matched a contact in that agent's workspace. The contact is created by the first [call sync](./call-sync.md) — if no call has been synced for them yet, there is nothing to show. |
| Works for one agent, not another | The second agent is not an Active Zipteams user. Add them under **Setup → Manage Team**, then **Make All Active**. |
| Phone does not match | Send the number in E.164 format, including the country code. |

---

## Related

- [Customer Insights dashboard](/dashboard/customer-insights.md) — the same insights as a full embeddable page rather than a side panel
- [Section 1 — Call Sync API](./call-sync.md) — creates the contacts the extension looks up
