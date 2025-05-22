# Task ID: CKA.4
# Title: CKA.4 - Define Gemini Function Declarations for Template Exchange API
# Status: pending
# Dependencies: None
# Priority: high
# Description: In `gemini_interaction.py`, create the Gemini `FunctionDeclaration` objects that describe the Template Exchange API operations (creating/updating and getting templates) so the Gemini model can request these actions.

Details:
- In `gemini_interaction.py`:
  - Import `FunctionDeclaration` and `Tool` from the `google.generativeai.types` (or directly `google.generativeai` depending on SDK version).
  - Define a `FunctionDeclaration` for creating/updating a template:
    - Name: e.g., `store_template_in_firebase` (this is the name Gemini will use in its `function_call`).
    - Description: A clear description for Gemini, e.g., "Stores or updates a handoff or summary template in the Firebase Template Exchange system for a given session."
    - Parameters (as a JSON schema object):
      - `sessionId` (type: string, description: "Session ID, e.g., 'M5.S4'", required)
      - `type` (type: string, description: "Template type, either 'handoff' or 'summary'", enum: ["handoff", "summary"], required)
      - `content` (type: string, description: "The Markdown content of the template.", required)
      - `status` (type: string, description: "Status of the template, e.g., 'draft', 'active'. Defaults to 'draft'.", optional)
      - `metadata` (type: object, description: "Optional metadata dictionary for the template.", optional, properties could be loosely defined or allow any additionalProperties)
  - Define a `FunctionDeclaration` for getting a template:
    - Name: e.g., `fetch_template_from_firebase`.
    - Description: e.g., "Retrieves a specific handoff or summary template from the Firebase Template Exchange system for a given session."
    - Parameters (as a JSON schema object):
      - `sessionId` (type: string, description: "Session ID, e.g., 'M5.S4'", required)
      - `type` (type: string, description: "Template type, either 'handoff' or 'summary'. Defaults to 'handoff'.", enum: ["handoff", "summary"], optional)
- These function declarations will be used when initializing the Gemini model with tools (covered in CKA.5).
- Ensure the parameter names and types in these declarations accurately match what your Python functions in `template_exchange_client.py` (from CKA.3) expect as input and what your API (from `api-reference.md`) requires.
- Refer to the Google Gemini API documentation for the exact syntax of `FunctionDeclaration` and parameter schema definition.
# Details:


# Test Strategy:

