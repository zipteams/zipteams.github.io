---
sidebar_position: 2
---

# Batch Call Ingestion API

This API allows partners to ingest multiple call recordings in a single request. The system processes each call recording asynchronously, providing an efficient way to upload multiple recordings at once.

## Endpoint

```
POST /partner/ingest/batch-call
```

## Version

`v1`

## Request Body

The request body should be a JSON object with the following structure:

```json
{
  "data": [
    {
      "call": {
        "id": "string",
        "recording_url": "string",
        "start_time": "2023-01-01T00:00:00Z",
        "end_time": "2023-01-01T00:30:00Z",
        "contact_number": "string"
      },
      "agent": {
        "id": "string",
        "email": "string",
        "name": "string"
      },
      "customer": {
        "id": "string",
        "name": "string",
        "email": "string",
        "disposition_status": "string"
      },
      "callback_url": "string",
      "metadata": {
        "key1": "value1",
        "key2": "value2"
      },
      "custom_fields": [
        {
          "internal_name": "string",
          "value": "string"
        }
      ]
    }
  ]
}
```

### Field Descriptions

#### Call Object

| Field | Type | Required | Description                                                                                                          |
|-------|------|----------|----------------------------------------------------------------------------------------------------------------------|
| id | string | Yes | Unique identifier for the call. Must be unique across all calls for your partner account.                            |
| recording_url | string | Yes | Publicly accessible URL to the call recording file. Supported formats: MP3, WAV, AAC, M4A.  |
| start_time | string (ISO 8601) | Yes | Start time of the call in ISO 8601 format (YYYY-MM-DDThh:mm:ssZ). Must be in UTC timezone.                           |
| end_time | string (ISO 8601) | Yes | End time of the call in ISO 8601 format (YYYY-MM-DDThh:mm:ssZ). Must be in UTC timezone and must be after start_time. |
| contact_number | string | Yes | Contact number used for the call. Format: E.164 international format (e.g., +1234567890).                            |

#### Agent Object

| Field | Type | Required | Description                                               |
|-------|------|----------|-----------------------------------------------------------|
| id | string | Yes | Unique identifier for the agent within your system.       |
| email | string | No | Email address of the agent. Must be a valid email format. |
| name | string | No | Full name of the agent. Maximum length: 255 characters.   |

#### Customer Object

| Field | Type | Required | Description                                                  |
|-------|------|----------|--------------------------------------------------------------|
| id | string | Yes | Unique identifier for the customer within your system.       |
| name | string | No | Full name of the customer. Maximum length: 255 characters.   |
| email | string | No | Email address of the customer. Must be a valid email format. |
| disposition_status | string | No | Current disposition status of the customer in your system.   |

#### Additional Fields

| Field | Type | Required | Description                                                                                                                                                                                             |
|-------|------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| callback_url | string | No | HTTPS URL to call back when processing is complete. Must be a valid URL starting with https://.                                                                                                         |
| metadata | object | No | Additional metadata as key-value pairs. Maximum of 5 key-value pairs. Keys must be strings, values can be strings or numbers. These will be sent back in the callback url when processing is completed. |
| custom_fields | array | No | Custom fields as name-value pairs. Maximum of 10 custom fields.                                                                                                                                         |

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

#### Missing Sub-Tenant ID

```json
{
  "success": false,
  "message": "Sub-Tenant ID is required"
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
      "field": "data[0].call.id",
      "message": "id should not be empty"
    }
  ]
}
```

**HTTP Status Code**: 422 Unprocessable Entity

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
curl -X POST \
  https://api.zipteams.com/api/v1/partner/ingest/batch-call \
  -H 'Content-Type: application/json' \
  -H 'x-partner-id: 123' \
  -H 'x-tenant-id: tenant1' \
  -H 'x-sub-tenant-id: subtenant1' \
  -d '{
  "data": [
    {
      "call": {
        "id": "call123",
        "recording_url": "https://example.com/recordings/call123.mp3",
        "start_time": "2023-01-01T10:00:00Z",
        "end_time": "2023-01-01T10:30:00Z",
        "contact_number": "+1234567890"
      },
      "agent": {
        "id": "agent123",
        "email": "agent@example.com",
        "name": "John Doe"
      },
      "customer": {
        "id": "customer123",
        "name": "Jane Smith",
        "email": "customer@example.com",
        "disposition_status": "interested"
      },
      "industry": "Technology",
      "function": "Sales",
      "callback_url": "https://partner.example.com/callback",
      "metadata": {
        "campaign": "Q1 Outreach",
        "source": "Website"
      }
    }
  ]
}'
```

### Response

```json
{
  "success": true
}
```

[//]: # (## Callback Response)

[//]: # ()
[//]: # (If a `callback_url` is provided, the system will make a POST request to that URL with the following payload when processing is complete:)

[//]: # ()
[//]: # (```json)

[//]: # ({)

[//]: # (  "call_id": "call123",)

[//]: # (  "status": "completed",)

[//]: # (  "processing_time": 45.2,)

[//]: # (  "error": null,)

[//]: # (  "results": {)

[//]: # (    "transcription_available": true,)

[//]: # (    "analytics_available": true)

[//]: # (  })

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (In case of an error:)

[//]: # ()
[//]: # (```json)

[//]: # ({)

[//]: # (  "call_id": "call123",)

[//]: # (  "status": "failed",)

[//]: # (  "processing_time": 12.3,)

[//]: # (  "error": "Invalid recording URL or format not supported",)

[//]: # (  "results": null)

[//]: # (})

[//]: # (```)

## Technical Notes

- The system processes each call recording asynchronously.
- The maximum number of calls in a single batch is 50. If you need to ingest more calls, split them into multiple requests.
- The maximum request payload size is 5MB.
- Supported recording formats: MP3, WAV, ACC, M4A, MP4.
- Recordings must be publicly accessible via the provided URL.
- Processing time depends on the length and quality of the recording.
- If the `callback_url` is provided, the system will call back with the processing results when complete.
- Callbacks will retry up to 3 times with exponential backoff if the callback endpoint returns an error.
- All timestamps must be in UTC timezone in ISO 8601 format.
- The API is idempotent - submitting the same call ID multiple times will not result in duplicate processing.