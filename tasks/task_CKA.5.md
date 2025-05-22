# Task ID: CKA.5
# Title: CKA.5 - Implement Gemini Interaction Module & Function Calling Logic
# Status: pending
# Dependencies: None
# Priority: high
# Description: Develop the `gemini_interaction.py` module to initialize the Gemini model, send it prompts (with context and defined tools/functions), and process its responses, including executing function calls via the Template Exchange API Client.

Details:
- In `gemini_interaction.py`:
  - Import necessary libraries: `google.generativeai` as `genai`, the function declarations from CKA.4, the API client functions from CKA.3 (`template_exchange_client.py`), and config from CKA.2 (`config_loader.py`).
  - Implement `initialize_gemini_model()` function:
    - Retrieve `GEMINI_API_KEY` using `config_loader`.
    - Configure `genai` with the API key.
    - Get a generative model instance (e.g., `genai.GenerativeModel('gemini-1.5-pro-latest')` or another suitable model).
    - Create a `Tool` object containing the list of `FunctionDeclaration` objects defined in CKA.4 (e.g., `store_template_in_firebase`, `fetch_template_from_firebase`).
    - Return the initialized model configured with the `Tool`.
  - Implement `generate_llm_response(model, prompt_text, chat_history=None)` function:** (This will be the main interaction point)
    - Takes the initialized `model`, `prompt_text` (from HD or Context Loader), and an optional `chat_history` (for multi-turn conversations).
    - Sends the content (prompt + history) to the model using `model.generate_content(..., tools=[the_tool_object_created_earlier])`.
    - Process the `response` from `model.generate_content()`:
      - Check if `response.candidates[0].content.parts[0].function_call` exists.
      - If a `function_call` exists:
        - Extract `function_name` and `args` (arguments dictionary).
        - Conditionally execute the corresponding Python function from `template_exchange_client.py` (CKA.3) based on `function_name`:
          - If `function_name == 'store_template_in_firebase'`: Call `template_exchange_client.create_or_update_template_api(**args)`.
          - If `function_name == 'fetch_template_from_firebase'`: Call `template_exchange_client.get_template_api(**args)`.
        - Prepare a `FunctionResponse` part: Create a `Part` object containing the result (success/failure, data) from your API client function.
        - Send this `FunctionResponse` back to the Gemini model by calling `model.generate_content()` again, this time including the original prompt/history and the new `FunctionResponse` part in the `contents`.
        - The model will then generate a final natural language response based on the function's output. Return this final text.
      - If no `function_call` (i.e., a direct text response):
        - Extract and return `response.text`.
    - Handle potential errors during API calls to Gemini.
- This module should not contain hardcoded prompts for specific tasks (like "generate handoff for X"); that will be handled by the Main Script (CKA.6) or Context Loader (CKA.7). This module provides the *mechanism* for LLM interaction and function execution.
- Refer to Google Gemini API documentation for `generate_content`, handling `FunctionCall` parts, and sending `FunctionResponse` parts.
# Details:


# Test Strategy:


# Subtasks:
## CKA.5.1. Import Libraries and Set Up Module Structure [pending]
### Dependencies: None
### Description: Import necessary libraries and set up the basic structure of the `gemini_interaction.py` module.

Details:
- Import required libraries:
  - `google.generativeai` as `genai` for the Gemini API
  - `config_loader` module from CKA.2 for accessing API keys
  - Function declarations from CKA.4
  - API client functions from `template_exchange_client.py` (CKA.3)
- Create the module structure with proper docstrings and type annotations
- Implement helper functions and constants that will be used across the module
### Details:


## CKA.5.2. Implement Gemini Model Initialization Function [pending]
### Dependencies: None
### Description: Implement the `initialize_gemini_model()` function to set up and configure the Gemini AI model with the appropriate API key and tools.

Details:
- Create the `initialize_gemini_model()` function that:
  - Retrieves the `GEMINI_API_KEY` using the `config_loader` module
  - Configures the Gemini API with the key using `genai.configure(api_key=api_key)`
  - Creates a generative model instance with an appropriate model name (e.g., `gemini-1.5-pro-latest`)
  - Retrieves the function declarations defined in CKA.4
  - Creates a `Tool` object containing these function declarations
  - Configures the model with the tool
  - Returns the initialized model
- Include error handling for cases where the API key is missing or invalid
- Add logging for initialization steps and potential issues
### Details:


## CKA.5.3. Implement Base Response Generation Function [pending]
### Dependencies: None
### Description: Implement the core `generate_llm_response()` function that sends prompts to Gemini and processes the initial response.

Details:
- Create the `generate_llm_response(model, prompt_text, chat_history=None)` function that:
  - Takes the initialized Gemini model, prompt text, and optional chat history
  - Formats the content correctly for Gemini, including prompt and history if provided
  - Sends the content to Gemini using `model.generate_content()`
  - Adds appropriate error handling for API rate limits, network issues, etc.
  - Returns the response object for further processing
- Implement basic response handling for direct text responses (non-function calls)
- Add logging of prompts sent and responses received (excluding sensitive data)
### Details:


## CKA.5.4. Implement Function Call Detection and Extraction [pending]
### Dependencies: None
### Description: Add logic to detect and extract function calls from Gemini responses.

Details:
- Extend `generate_llm_response()` to:
  - Check if the response contains a function call (i.e., `response.candidates[0].content.parts[0].function_call` exists)
  - Extract the function name and arguments from the function call
  - Validate that the function name matches one of the supported functions
  - Parse and validate the function arguments
  - Log details about the detected function call
- Create helper functions for extracting and validating function calls
- Handle edge cases like multiple function calls or malformed function calls
### Details:


## CKA.5.5. Implement Function Execution Logic [pending]
### Dependencies: None
### Description: Implement the logic to execute the appropriate API client function based on the detected function call.

Details:
- Create a function execution handler that:
  - Takes the extracted function name and arguments
  - Maps the function name to the corresponding API client function:
    - `store_template_in_firebase` → `template_exchange_client.create_or_update_template_api()`
    - `fetch_template_from_firebase` → `template_exchange_client.get_template_api()`
  - Executes the function with the provided arguments
  - Captures the result (success/failure, data) from the API client function
  - Formats the result as a `FunctionResponse` object
  - Handles and logs any errors that occur during function execution
### Details:


## CKA.5.6. Implement Function Response Handling and Final Response Generation [pending]
### Dependencies: None
### Description: Complete the function calling flow by sending function responses back to Gemini and generating the final response.

Details:
- Extend `generate_llm_response()` to:
  - Create a `FunctionResponse` part containing the result from the executed function
  - Send this `FunctionResponse` back to Gemini by calling `model.generate_content()` again
  - Include the original prompt/history and the new `FunctionResponse` in the `contents`
  - Process the final response from Gemini
  - Extract and return the final natural language response
- Add comprehensive error handling for the entire function calling flow
- Implement cleanup and logging for the completed process
### Details:


