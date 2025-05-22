# Task ID: CKA.7
# Title: CKA.7 - Implement Context Loading Module
# Status: pending
# Dependencies: None
# Priority: medium
# Description: Develop the `context_loader.py` module to read content from specified project files (e.g., SHIP documents, Bible sections, Task Master task details) and format it as context for Gemini prompts.

Details:
- In `context_loader.py`:
  - Implement `load_ship_document(session_id)` function:
    - Takes a `session_id` (e.g., "M5.S4").
    - Constructs the SHIP filename (e.g., `Session Handoff & Initialization Plan_M5.NavUX-S4.md`).
    - Reads the content of the specified SHIP markdown file.
    - Returns the file content as a string, or None/error if not found.
  - Implement `load_task_master_task_details(task_id)` function:
    - Takes a `task_id` (e.g., "TM#205").
    - Option 1 (Simpler): Assume for now it could read from a pre-exported individual markdown task file (e.g., `tasks/TM-205.md`) if that's part of your workflow.
    - Option 2 (More Robust): Parse `tasks.json` to find the task object by ID and extract its description, details, test strategy, etc., formatting them into a string. (This could be a later enhancement if too complex initially).
    - Returns the formatted task details as a string, or None/error.
  - Implement `load_bible_section(bible_ref)` function:
    - Takes a `bible_ref` (e.g., "B6.1" or "B3.8_Style_Guide_v2.md").
    - Constructs the Bible filename (e.g., `docs/B6.1_Budget_Calculations.md`).
    - Reads the content of the specified Bible markdown file.
    - Returns the file content as a string, or None/error.
  - Implement `assemble_prompt_context(ship_content=None, task_details_content=None, bible_sections_content=None, user_query="")` function:
    - Takes various context strings and the user's direct query.
    - Assembles them into a single formatted string suitable for a Gemini prompt (e.g., clearly demarcating sections: "=== SHIP Context ===\n{ship_content}\n=== Task Details ===\n{task_details_content}\n=== User Query ===\n{user_query}").
- The `main.py` script (from CKA.6) will need to be updated to:
  - Call these context loading functions based on the user's request (e.g., if the user says "Generate handoff for TM#205 for SHIP M5.S4 using B6.1", it would parse these and call the loaders).
  - Pass the assembled context to `gemini_interaction.generate_llm_response()`.
- Implement error handling for file not found, read errors, etc.
- Paths to documentation (SHIPs, Bible, tasks) might need to be configurable (e.g., via `config_loader.py` or relative to the project root).
# Details:


# Test Strategy:

