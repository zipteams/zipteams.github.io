---
sidebar_position: 1
---

# Partner API Documentation

Welcome to the Zipteams Partner API documentation. This comprehensive guide provides detailed information about the APIs available for partners to integrate with the Zipteams platform. Our APIs are designed to be robust, secure, and easy to use, enabling seamless integration with your existing systems.

## Host

`https://api.zipteams.com/`

## Authentication

All Partner API endpoints require authentication using API keys provided in HTTP headers.

For all endpoints, you need to provide the following headers unless specified otherwise:

- `x-api-key`: Provided API Key after onboarding (required)
- `x-api-secret`: Provided API Secret after onboarding (required)
- `x-tenant-id`: The tenant identifier for the organization (see [Key Terminology](/intro.md#key-terminology)) (required)
- `x-sub-tenant-id`: The subtenant identifier for the specific group/department/team (see [Key Terminology](/intro.md#key-terminology)) (required)

Failure to provide the required headers will result in authentication errors with appropriate HTTP status codes.

## API Versioning

All APIs are versioned to ensure backward compatibility as we evolve our platform. The current version is `v1`. The version is specified in the URL path.

Example: `/api/v1/partner/ingest/batch-call`

## Response Format

All API responses follow a standard format to ensure consistency across our platform:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

HTTP Status Code: 200 OK

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional array of specific errors
}
```

HTTP Status Codes:
- 400 Bad Request - Invalid input parameters
- 401 Unauthorized - Missing authentication credentials
- 403 Forbidden - Invalid authentication credentials
- 404 Not Found - Resource not found
- 422 Unprocessable Entity - Validation errors
- 500 Internal Server Error - Unexpected server error

## Rate Limiting

To ensure optimal performance for all partners, our APIs implement rate limiting. The current limits are:

- 120 requests per minute per partner

If you exceed these limits, you will receive 429 Too Many Requests responses with a Retry-After header indicating when you can resume making requests.

## Available APIs

The following APIs are available for partners:

1. [Batch Call Ingestion](./batch-call-ingestion.md) - Ingest multiple call recordings in a single request
2. [Disposition Status Update](./disposition-status-update.md) - Update the disposition status of a customer

Each API is documented in detail in its respective section.

## Support

If you encounter any issues or have questions about our APIs, please contact our support team at [support@zipteams.com](mailto:support@zipteams.com).
