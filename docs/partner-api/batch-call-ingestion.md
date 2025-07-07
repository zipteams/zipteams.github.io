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
  -H 'x-api-key: api-key' \
  -H 'x-api-secret: api-secret' \
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

## Callback Response

If a `callback_url` is provided, the system will make a POST request to that URL with the call analysis data when processing is complete. This allows your application to receive and process the call analysis results asynchronously.

### Callback Payload

The system will send a JSON payload to the provided `callback_url` with the following structure:

```json
{
  "call_id": "call_12345",
  "intent": "INTERESTED",
  "intent_justification": "Customer is interested and exploring technical aspects, integrations, and feature requests, with a focus on webhook functionality, data fields, and potential workarounds. They express a clear need for the product to meet their requirements, indicating a strong interest in utilizing the product, but there is no explicit commitment to purchase.",
  "quality_score": 42,
  "summary": [
    {
      "chapter_name": "Introduction and Initial Discussion",
      "chapter_summary": "The conversation begins with greetings and introductions among the participants, including representatives from Zipteams and the customer's team. The focus quickly shifts to technical aspects, specifically the structure of the application and the progress of the test run, with discussions about demos and onboarding."
    },
    {
      "chapter_name": "Webhook Challenges and Agenda",
      "chapter_summary": "The meeting's agenda is outlined, covering both the discussion of the current setup in the demo account and the challenges encountered with webhooks. The primary concern revolves around the integration of webhooks and how data is transmitted between platforms."
    }
  ],
  "bant": {
    "needs": "\n- The customer is facing challenges with webhook setup, particularly with mandatory parameters like date format and agent id.\n- They desire a more flexible system regarding data requirements, as many users have synced calls without providing necessary ids.\n- Additionally, they are looking for clarification on timezone handling.",
    "objection": "- There may be a lack of email notifications for updates that could lead to customer confusion.",
    "concern_categories": "Functionality",
    "objection_handling": "\n- The salesperson acknowledged the customer's concerns about lacking data or information and proposed a solution by suggesting adding an email id in the callback process to mitigate issues.\n- They also communicated that checking for the phone number would be handled simultaneously and emphasized collaboration with team members to resolve the customer's concerns."
  },
  "qualification": [
    {
      "label": "Needs",
      "answer": "The customer is facing challenges with webhook setup, particularly with mandatory parameters like date format and agent ID. They desire a more flexible system regarding data requirements, as many users have synced calls without providing necessary IDs. Additionally, they are looking for clarification on timezone handling."
    },
    {
      "label": "Objection",
      "answer": "The customer expresses frustration regarding the potential lack of updates communicated through email, which may lead to confusion or lack of information. They indicate that this could impact customer experience negatively over time."
    },
    {
      "label": "Objection Handling",
      "answer": "The salesperson acknowledged the customer's concerns about lacking data or information and proposed a solution by suggesting adding an email ID in the callback process to mitigate issues. They also communicated that checking for the phone number would be handled simultaneously and emphasized collaboration with team members to resolve the customer's concerns."
    }
  ],
  "quality": [
    {
      "justification": "The sales call summary indicates that the salesperson set the context for the call by mentioning the agenda, which included discussing the application structure and the demo account setup. The customer confirmed their understanding, indicating that the context was effectively set.",
      "suggestion": "You did a great job setting the context for the call by outlining the agenda and confirming it with the customer. Continue to start your calls by clearly stating the purpose and structure to ensure everyone is aligned.",
      "parameter_name": "Setting Context",
      "inference_score": 10,
      "parameter_score": 10,
      "is_fatal": false
    },
    {
      "justification": "The salesperson did not explain the AI Audit feature as per the description. The summary clearly states that the salesperson failed to mention any of the key points related to the AI Audit feature, including its ability to capture errors in pitches, aid in salesperson training, and identify compliance breaches.",
      "suggestion": "You missed an opportunity to highlight the AI Audit feature's key benefits. Next time, be sure to explain how it captures errors in pitches, aids in salesperson training using actual data, and identifies compliance breaches. This will help the customer understand the full value of the feature.",
      "parameter_name": "USP Audits",
      "inference_score": 0,
      "parameter_score": 10,
      "is_fatal": true
    }
  ],
  "meta": {
    "source": "webhook",
    "timestamp": "2025-05-08T04:53:11.110Z"
  }
}
```

### Field Descriptions

#### Top-Level Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| call_id | string | Unique identifier for the call that was processed. This matches the `id` provided in the original request. Always use this field to correlate the callback with your original request. | Yes |
| intent | string | The detected intent of the customer during the call (e.g., "INTERESTED", "NOT_INTERESTED", etc.). Use this field to understand the customer's overall interest level. | No |
| intent_justification | string | A detailed explanation of why the system determined the specific intent. Useful for understanding the reasoning behind the intent classification. | No |
| quality_score | number | A numerical score (0-100) indicating the overall quality of the call. Higher scores indicate better call quality. Use this for performance tracking. | No |
| summary | array | An array of chapter objects that summarize different segments of the call. Use this to get a quick overview of the call content without listening to the entire recording. | No |
| bant | object | BANT (Budget, Authority, Need, Timeline) qualification information extracted from the call. Important for sales qualification processes. | No |
| qualification | array | An array of qualification objects with labels and answers extracted from the call. Provides structured qualification data that can be used for lead scoring. | No |
| quality | array | An array of quality assessment objects with justifications, suggestions, and scores. Use this for agent performance evaluation and coaching. | No |
| meta | object | Metadata about the callback, including the source and timestamp. This contains the same metadata that was provided in the original request. Use this to track the processing source and time. | No |

#### Summary Array Fields
Each object in the `summary` array contains:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| chapter_name | string | The title of the chapter or segment of the call. Use this to identify different parts of the conversation. | No |
| chapter_summary | string | A concise summary of what was discussed in this segment of the call. Contains the key points and topics covered. | No |

#### BANT Object Fields
The `bant` object contains:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| needs | string | Detailed description of the customer's needs identified during the call. Important for understanding what the customer is looking for. | No |
| objection | string | Customer objections or concerns raised during the call. Use this to address potential roadblocks in the sales process. | No |
| concern_categories | string | Categories of concerns expressed by the customer (e.g., "Functionality", "Pricing", "Integration"). Helps in classifying objection types. | No |
| objection_handling | string | Description of how the salesperson handled the objections. Useful for coaching and improving objection handling techniques. | No |

#### Qualification Array Fields
Each object in the `qualification` array contains:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| label | string | The category or type of qualification information (e.g., "Needs", "Objection", "Objection Handling"). Use this to identify the type of qualification data. | No |
| answer | string | The detailed qualification information for the given label. Contains the actual qualification content that can be used for lead scoring. | No |

#### Quality Array Fields
Each object in the `quality` array contains:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| justification | string | Explanation of why a particular quality score was assigned. Provides context for the quality assessment. | No |
| suggestion | string | Actionable feedback for improving performance. Use this for agent coaching and training. | No |
| parameter_name | string | The name of the quality parameter being assessed (e.g., "Setting Context", "USP Audits"). Identifies the specific aspect of the call being evaluated. | No |
| inference_score | number | The score (0-10) assigned to this specific parameter. Higher scores indicate better performance on this parameter. | No |
| parameter_score | number | The maximum possible score for this parameter. Used as a reference to understand the relative importance of the parameter. | No |
| is_fatal | boolean | Indicates whether this parameter is considered critical. If true, this issue requires immediate attention regardless of the overall quality score. | No |

### Notes on Callback Processing

- The callback is sent as a POST request with a JSON body.
- Your callback endpoint should respond with a 200 OK status code to acknowledge receipt.
- If your endpoint returns an error, the system will retry the callback up to 3 times with exponential backoff.
- The `call_id` field will always be present, but other fields may be null or empty depending on the analysis results.
- The `meta` object contains the same metadata that was provided in the original request, allowing you to correlate the callback with your internal systems.
- The callback URL must be publicly accessible and support HTTPS.

### Analytics Data Options

When using the `callback_url` feature, you have two options for displaying analytics data:

1. **Custom UI Integration**: Use the analytics data received via the callback to display insights in your own user interface. This option provides maximum customization and seamless integration with your existing application.

2. **Zipteams Dashboard**: Alternatively, you can omit the callback_url and use the [Zipteams Dashboard](/dashboard/customer-insights.md) to display analytics with minimal implementation effort. The dashboard provides a comprehensive, ready-to-use visualization of all your data and AI analysis outputs.

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
