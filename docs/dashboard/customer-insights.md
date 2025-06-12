---
sidebar_position: 1
---

# Insights Dashboard

## Overview

Zipteams provides an embeddable Insights Dashboard that offers a comprehensive view of all customer interactions and AI-powered analytics. This feature-rich dashboard visualizes critical business information.

By embedding this dashboard into your application, you can provide your users with powerful, actionable analytics without the complexity and cost of building your own visualization tools.

## Visual Preview

The Insights Dashboard appears as shown below once you have submitted calls to our platform and our AI has analyzed them:

![Insights Dashboard Overview](img.png)
*Fig 1: Insights Dashboard showing key metrics and analytics*

## Key Features and Benefits

- **Comprehensive Analytics**: Get a holistic view of all customer interactions and performance metrics
- **AI-Powered Insights**: Leverage advanced AI to identify trends, patterns, and areas for improvement
- **Interactive Visualizations**: Explore data through intuitive charts, graphs, and filterable tables
- **Seamless Integration**: Easily embed within your existing application with minimal development effort
- **Customizable Views**: Filter and segment data to focus on specific time periods or metrics

## Getting Started

To embed the Insights Dashboard in your application, follow these steps:

### Step 1: Ingest Call Recordings

First, submit your call recordings to Zipteams using the [Batch Call Ingestion API](./../partner-api/batch-call-ingestion.md). The dashboard will automatically aggregate and analyze data from all ingested calls.

### Step 2: Obtain Authentication Token

Next, obtain an authentication token using the [Get Auth Token API](./auth-token.md):

### Step 3: Embed the Insights Dashboard

After obtaining the authentication token, you can display the Insights Dashboard in an iframe by constructing a URL with the token:

```html
<!-- Example iframe implementation -->
<iframe
  src="https://app.zipteams.com/view-insights?token={auth-token}"
  width="100%"
  height="800px"
  frameborder="0"
  allow="autoplay; encrypted-media"
  allowfullscreen>
</iframe>
```

Replace `{auth-token}` with the authentication token you obtained.

## Technical Notes

- The dashboard requires a valid authentication token. If an invalid token is provided, an error will be displayed.
- The dashboard will start showing data once you have pushed calls to our system using the [Ingestion API](./../partner-api/batch-call-ingestion.md) and our AI has completed analyzing them.
- Each authentication token is unique for a specific tenant and subtenant combination.
- To display dashboards for multiple subtenants within a tenant, you must generate separate authentication tokens for each subtenant.
- Tokens have a limited validity period of 24 hours. Refer to the [Auth Token API documentation](./auth-token.md#technical-notes) for details.
- This dashboard can only be opened in an iframe on HTTPS webpages and will not open on localhost.
- Once you have completed the integration, you'll need to get your domain whitelisted by Zipteams. Without whitelisting, the dashboard will not render and you'll see a "refused to connect" error.

### Best Practices

- **Token Management**: Implement server-side token generation and refresh mechanisms to ensure tokens are always valid
- **Error Handling**: Add appropriate error handling in your application to gracefully handle cases where the iframe cannot load
- **Responsive Design**: Ensure your container adjusts appropriately to different screen sizes for optimal user experience

## Support
If you encounter any issues or have questions about our APIs, please contact our support team at [support@zipteams.com](mailto:support@zipteams.com).