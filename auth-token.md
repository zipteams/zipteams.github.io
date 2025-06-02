---
sidebar_position: 2
---

# Auth Token API

This API enables partners to obtain an authentication token for securely accessing and displaying the Zipteams Insights Dashboard. The token ensures that only authorized partners can access dashboard features, analytics, and insights.

## Host

`https://api.zipteams.com/`

## Endpoint

```
GET /partner/dashboard/auth/token
```

## Version

`v1`

Full endpoint URL: `https://api.zipteams.com/api/v1/partner/dashboard/auth/token`

## Authentication

This endpoint requires authentication using API keys provided in HTTP headers. You must include all the required headers listed below to successfully authenticate your request.

## Request Parameters

### Headers

| Header | Required | Description                                        |
|--------|----------|----------------------------------------------------|
| x-api-key | Yes | Your partner API key provided during onboarding    |
| x-api-secret | Yes | Your partner API secret provided during onboarding |
| x-tenant-id | Yes | The tenant identifier for the organization (see [Key Terminology](/intro.md#key-terminology)) |
| x-sub-tenant-id | Yes | The subtenant identifier for the specific group/department/team (see [Key Terminology](/intro.md#key-terminology)) |

Failure to provide any of these required headers will result in authentication errors with appropriate HTTP status codes.

## Response

### Success Response

```json
{
  "code": "RESPONSE_SUCCESS",
  "message": "Request served successfully.",
  "type": "object",
  "data": {
    "token": "authentication token"
  }
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
curl --location 'https://api.zipteams.com/api/v1/partner/dashboard/auth/token' \
--header 'x-sub-tenant-id: subTenantId' \
--header 'x-tenant-id: tenantId' \
--header 'x-api-key: apiKey' \
--header 'x-api-secret: apiSecret'
```

### Response

```json
{
  "code": "RESPONSE_SUCCESS",
  "message": "Request served successfully.",
  "type": "object",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6InRlbmFudElkIiwic3ViVGVuYW50SWQiOiJzdWJUZW5hbnRJZCIsImlhdCI6MTYxNjc2MjIwMCwiZXhwIjoxNjE2ODQ4NjAwfQ.example-token-signature"
  }
}
```

## Using the Token

Once you have obtained the authentication token, you can use it to:

**Embed the Dashboard**: Use the token to authenticate embedded dashboard views in your application.

## Technical Notes

- Tokens are valid only for 24 hours from the time of generation. Once expired, you need to obtain a new token by calling this API again.
- The token is a JWT (JSON Web Token) that contains encoded information about the tenant and subtenant.
- Store the token securely and do not expose it in client-side code or public repositories.
- This API is designed to be called server-side to maintain the security of your API credentials.
- Each token is specific to a tenant-subtenant combination and cannot be used across different combinations.
