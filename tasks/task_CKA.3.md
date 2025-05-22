# Task ID: CKA.3
# Title: CKA.3 - Develop Template Exchange API Client Module
# Status: pending
# Dependencies: None
# Priority: high
# Description: Implement the `template_exchange_client.py` module with Python functions to interact with the existing Template Exchange API (Cloud Function endpoints) for creating/updating and retrieving templates.

Details:
- In `template_exchange_client.py`:
  - Import necessary libraries (e.g., `requests`, and the `config_loader` module from CKA.2 to get API URL and key).
  - Implement `create_or_update_template_api(session_id, template_type, content, status='draft', metadata=None)` function:
    - This function will be called by the Gemini interaction logic when Gemini wants to store a handoff or summary.
    - Construct the JSON payload as per `/api/templates` POST endpoint in `api-reference.md`:
      ```json
      {
        "sessionId": session_id, // e.g., "M5.S4"
        "type": template_type,   // "handoff" or "summary"
        "content": content,      // Markdown string
        "status": status,        // "draft", "active", "archived"
        "metadata": metadata     // Optional dictionary
      }
      ```
    - Make a `POST` request to `TEMPLATE_EXCHANGE_BASE_URL + "/templates"`.
    - Include the `x-api-key: YOUR_TEMPLATE_EXCHANGE_API_KEY` header.
    - Handle the HTTP response:
      - Check for success status codes (e.g., 201 Created).
      - Parse the JSON response (e.g., to get the created template ID).
      - Implement robust error handling for API errors (4xx, 5xx status codes), network issues. Log errors and return a clear success/failure indication or the response data/error message.
  - Implement `get_template_api(session_id, template_type='handoff')` function:
    - This function will be called by the Gemini interaction logic when Gemini wants to fetch a template.
    - Make a `GET` request to `TEMPLATE_EXCHANGE_BASE_URL + "/templates/" + session_id + "?type=" + template_type` (as per `api-reference.md`).
    - Include the `x-api-key` header.
    - Handle the HTTP response:
      - Check for success (200 OK).
      - Parse JSON response to get template content.
      - Handle errors (e.g., 404 Not Found if template doesn't exist, other API/network errors). Log errors and return template data or None/error indication.
  - (Optional, consider later) Implement functions for other API endpoints if needed (e.g., `list_templates_api`, `update_template_by_id_api`, `delete_template_api` from `api-reference.md`). Start with create/get.
- Ensure all functions properly use the API base URL and API key loaded via the `config_loader` module.
# Details:


# Test Strategy:

