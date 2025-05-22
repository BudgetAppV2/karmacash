# Template Exchange API Reference

This document provides a comprehensive reference for the Template Exchange API endpoints, request/response formats, and authentication requirements.

## Authentication

All API endpoints require authentication using an API key. This key should be provided in the `x-api-key` HTTP header.

```
x-api-key: YOUR_API_KEY
```

API keys can be generated using the `create-api-key.js` script in the `scripts` directory:

```bash
node src/template-exchange/scripts/create-api-key.js [path/to/serviceAccountKey.json]
```

## API Endpoints

### 1. Get Template by Session ID

Retrieves a template for a specific session ID and type.

**URL:** `/api/templates/:sessionId`

**Method:** `GET`

**URL Parameters:**
- `sessionId` (required): The session ID in the format `M1.S2` (e.g., "M5.S4")

**Query Parameters:**
- `type` (optional): The template type, either "handoff" or "summary". Defaults to "handoff".

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "id": "abc123",
  "sessionId": "M5.S4",
  "type": "handoff",
  "content": "# Task Objective: Implement feature X\n## Details: ...",
  "createdAt": "2025-05-21T14:30:00Z",
  "updatedAt": "2025-05-21T14:30:00Z",
  "status": "draft",
  "shard": "a",
  "metadata": {
    "source": "google_ai_studio",
    "version": 1
  }
}
```

**Error Responses:**
- **Code:** 400 Bad Request
  - **Content:** `{ "error": "Bad Request", "message": "Invalid session ID format. Expected format: M1.S2" }`
- **Code:** 404 Not Found
  - **Content:** `{ "error": "Not Found", "message": "No handoff template found for session M5.S4" }`
- **Code:** 401 Unauthorized
  - **Content:** `{ "error": "Unauthorized", "message": "Missing API key. Please provide an API key in the x-api-key header." }`

### 2. Create/Update Template

Creates a new template or updates an existing one.

**URL:** `/api/templates`

**Method:** `POST`

**Request Body:**
```json
{
  "sessionId": "M5.S4",
  "type": "handoff",
  "content": "# Task Objective: Implement feature X\n## Details: ...",
  "status": "draft",
  "metadata": {
    "source": "google_ai_studio",
    "tags": ["feature", "backend"]
  }
}
```

**Required Fields:**
- `sessionId`: Session ID in format `M1.S2`
- `type`: Template type ("handoff" or "summary")
- `content`: Template content in markdown format

**Optional Fields:**
- `status`: Template status ("draft", "active", or "archived"). Defaults to "draft".
- `metadata`: Additional metadata object

**Success Response:**
- **Code:** 201 Created
- **Content:**
```json
{
  "id": "abc123",
  "sessionId": "M5.S4",
  "type": "handoff",
  "content": "# Task Objective: Implement feature X\n## Details: ...",
  "createdAt": "2025-05-21T14:30:00Z",
  "updatedAt": "2025-05-21T14:30:00Z",
  "status": "draft",
  "shard": "a",
  "metadata": {
    "source": "google_ai_studio",
    "tags": ["feature", "backend"]
  },
  "message": "Template created successfully"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
  - **Content:** `{ "error": "Bad Request", "message": "Missing required fields: sessionId, type, content" }`
- **Code:** 401 Unauthorized
  - **Content:** `{ "error": "Unauthorized", "message": "Invalid API key." }`

### 3. List Templates

Retrieves a list of templates with optional filtering.

**URL:** `/api/templates`

**Method:** `GET`

**Query Parameters:**
- `type` (optional): Filter by template type ("handoff" or "summary")
- `status` (optional): Filter by status ("draft", "active", or "archived")
- `limit` (optional): Maximum number of templates to return (default: 10, max: 100)
- `startAfter` (optional): ID of the template to start after, for pagination

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "templates": [
    {
      "id": "abc123",
      "sessionId": "M5.S4",
      "type": "handoff",
      "content": "# Task Objective: Implement feature X\n## Details: ...",
      "createdAt": "2025-05-21T14:30:00Z",
      "updatedAt": "2025-05-21T14:30:00Z",
      "status": "draft",
      "shard": "a",
      "metadata": {
        "source": "google_ai_studio",
        "version": 1
      }
    },
    {
      "id": "def456",
      "sessionId": "M5.S3",
      "type": "handoff",
      "content": "# Task Objective: Implement feature Y\n## Details: ...",
      "createdAt": "2025-05-20T10:15:00Z",
      "updatedAt": "2025-05-20T10:15:00Z",
      "status": "draft",
      "shard": "b",
      "metadata": {
        "source": "google_ai_studio",
        "version": 1
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "hasMore": true,
    "nextStartAfter": "def456"
  }
}
```

**Error Responses:**
- **Code:** 400 Bad Request
  - **Content:** `{ "error": "Bad Request", "message": "Limit must be a number between 1 and 100" }`
- **Code:** 401 Unauthorized
  - **Content:** `{ "error": "Unauthorized", "message": "Missing API key. Please provide an API key in the x-api-key header." }`

### 4. Update Template

Updates an existing template.

**URL:** `/api/templates/:id`

**Method:** `PUT`

**URL Parameters:**
- `id` (required): The ID of the template to update

**Request Body:**
```json
{
  "content": "# Updated Task Objective: Implement feature X\n## Details: ...",
  "status": "active",
  "metadata": {
    "tags": ["updated", "feature", "backend"]
  }
}
```

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "id": "abc123",
  "content": "# Updated Task Objective: Implement feature X\n## Details: ...",
  "updatedAt": "2025-05-21T15:45:00Z",
  "status": "active",
  "metadata": {
    "tags": ["updated", "feature", "backend"]
  },
  "message": "Template updated successfully"
}
```

**Error Responses:**
- **Code:** 404 Not Found
  - **Content:** `{ "error": "Not Found", "message": "Template with ID abc123 not found" }`
- **Code:** 401 Unauthorized
  - **Content:** `{ "error": "Unauthorized", "message": "Invalid API key." }`

### 5. Delete Template

Deletes a template.

**URL:** `/api/templates/:id`

**Method:** `DELETE`

**URL Parameters:**
- `id` (required): The ID of the template to delete

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "id": "abc123",
  "message": "Template deleted successfully"
}
```

**Error Responses:**
- **Code:** 404 Not Found
  - **Content:** `{ "error": "Not Found", "message": "Template with ID abc123 not found" }`
- **Code:** 401 Unauthorized
  - **Content:** `{ "error": "Unauthorized", "message": "Missing API key. Please provide an API key in the x-api-key header." }`

## Response Codes

- `200 OK`: The request was successful
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was malformed or contains invalid parameters
- `401 Unauthorized`: Authentication failed or is missing
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An unexpected error occurred on the server

## Rate Limiting

To ensure system stability, the API implements rate limiting:

- 10 requests per second per IP address
- 1,000 requests per hour per API key

When a rate limit is exceeded, the API will return a `429 Too Many Requests` response with a `Retry-After` header indicating the number of seconds to wait before retrying.

## Pagination

For endpoints that return lists of resources, pagination is implemented using the cursor-based approach:

1. The initial request includes a `limit` parameter (default: 10, max: 100)
2. The response includes a `pagination` object with:
   - `limit`: The number of items returned
   - `hasMore`: Boolean indicating if there are more items
   - `nextStartAfter`: ID of the last item, to use in the next request

To get the next page, include the `startAfter` parameter with the value from `nextStartAfter` in the previous response. 