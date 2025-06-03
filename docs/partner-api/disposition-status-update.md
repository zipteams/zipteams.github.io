---
sidebar_position: 3
---

# Disposition Status Update API

This API allows partners to update the disposition status of a customer. The disposition status represents the outcome or current state of customer interactions, enabling better tracking and analysis of customer engagement.

## Endpoint

```
PUT /partner/ingest/disposition-status
```

## Version

`v1`

## Request Body

The request body should be a JSON object with the following structure:

```json
{
  "customer_id": "string",
  "disposition_status": "string"
}
```

### Field Descriptions

| Field | Type | Required | Description                                                                                                                               |
|-------|------|----------|-------------------------------------------------------------------------------------------------------------------------------------------|
| customer_id | string | Yes | Unique identifier for the customer within your system. This must match a customer ID previously ingested through the call ingestion APIs. |
| disposition_status | string | No | New disposition status for the customer. You can send custom disposition statuses based on your business needs.                           |

## Response

### Success Response

```json
{
  "success": true
}
```

**HTTP Status Code**: 200 OK

### Error Responses

#### Authentication Error

```json
{
  "success": false,
  "message": "Forbidden"
}
```

**HTTP Status Code**: 403 Forbidden

#### Missing Tenant ID

```json
{
  "success": false,
  "message": "Tenant ID is required"
}
```

**HTTP Status Code**: 400 Bad Request

#### Missing Subtenant ID

```json
{
  "success": false,
  "message": "Subtenant ID is required"
}
```

**HTTP Status Code**: 400 Bad Request

#### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "customer_id",
      "message": "customer_id should not be empty"
    }
  ]
}
```

**HTTP Status Code**: 422 Unprocessable Entity

#### Customer Not Found

```json
{
  "success": false,
  "message": "Customer not found"
}
```

**HTTP Status Code**: 404 Not Found

#### Rate Limit Exceeded

```json
{
  "success": false,
  "message": "Rate limit exceeded. Try again in 60 seconds."
}
```

**HTTP Status Code**: 429 Too Many Requests

#### Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

**HTTP Status Code**: 500 Internal Server Error

## Example

### Request

```bash
curl -X PUT \
  https://api.zipteams.com/api/v1/partner/ingest/disposition-status \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: api-key' \
  -H 'x-api-secret: api-secret' \
  -H 'x-tenant-id: tenant1' \
  -H 'x-subtenant-id: subtenant1' \
  -d '{
  "customer_id": "customer123",
  "disposition_status": "interested"
}'
```

### Response

```json
{
  "success": true
}
```

## Technical Notes

- If the customer does not exist in the system (no calls have been ingested with this customer ID), the API will return a 404 Not Found error.
- Disposition status updates are processed immediately and are reflected in reports and analytics in real-time.
- Historical disposition status changes are tracked and can be accessed through the reporting APIs (Coming Soon).
- The maximum request payload size is 5MB.

## Use Cases

### Sales Follow-up Tracking

Track the outcome of sales calls to identify interested prospects for follow-up:

```json
{
  "customer_id": "customer123",
  "disposition_status": "interested"
}
```

### Do Not Call Compliance

Mark customers who have requested not to be contacted:

```json
{
  "customer_id": "customer456",
  "disposition_status": "do_not_call"
}
```

### Callback Scheduling

Flag customers who have requested a callback at a later time:

```json
{
  "customer_id": "customer789",
  "disposition_status": "callback_requested"
}
```

## Related APIs

- [Batch Call Ingestion](./batch-call-ingestion.md) - Ingest multiple call recordings with initial disposition statuses
