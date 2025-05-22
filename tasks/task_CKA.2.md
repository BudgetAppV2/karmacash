# Task ID: CKA.2
# Title: CKA.2 - Implement Configuration Module for API Keys & Endpoints
# Status: pending
# Dependencies: None
# Priority: high
# Description: Develop the Configuration Module (`config_loader.py`) to securely load API keys (Gemini, Template Exchange) and the Template Exchange API base URL from environment variables or a `.env` file.

Details:
- In `config_loader.py`, implement functions/logic to:
  - Load environment variables using the `python-dotenv` library from a `.env` file.
  - Specifically load:
    - `GEMINI_API_KEY`
    - `TEMPLATE_EXCHANGE_API_KEY` (this is the `x-api-key` for your existing API)
    - `TEMPLATE_EXCHANGE_BASE_URL` (the base URL for your Cloud Function API, e.g., `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/api`)
- Provide clear error handling if any required configuration variable is missing (e.g., raise an exception or log an error and exit).
- Create a `.env.example` file in the project root that lists the required environment variables without their actual values (e.g., `GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"`).
- Add `.env` to the `.gitignore` file (already done in CKA.1 if followed, but double-check) to prevent accidental commits of secret keys.
- The module should make these configuration values easily accessible to other parts of the CK Assistant application (e.g., via functions like `get_gemini_key()`, `get_template_api_key()`, `get_template_api_url()`).
# Details:


# Test Strategy:

