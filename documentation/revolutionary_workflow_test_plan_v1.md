# Basic Test Plan - Revolutionary Firebase Workflow v1

**Version:** 1.0
**Date:** [YYYY-MM-DD]
**Associated Task Master ID:** #311

## 1. Introduction

This document outlines a basic test plan to verify the core functionalities of the Revolutionary Firebase Workflow prototype. The primary goal is to ensure that session initialization, context management (CK continuity), inter-AI handoff (CK to CG), and summary processing (CG to CK) via Firebase are working as expected using the `fs_revolutionary_prototype.js` script and the schemas defined in `documentation/revolutionary_workflow_schema_v1.md`.

## 2. Prerequisites

1.  Firebase project set up and configured.
2.  Firestore database initialized.
3.  `fs_revolutionary_prototype.js` script deployed and executable.
4.  A valid `serviceAccountKey.json` for Firebase Admin SDK available to the script.
5.  Defined `revolutionary_workflow_schema_v1.md` available for reference.
6.  Defined `ck_priming_revolutionary_v1.md` available for CK (Claude Desktop) guidance.
7.  Defined `ship_revolutionary_v1.md` template available for session structure guidance.

## 3. Test Environment

-   **Firebase Project:** [Your Firebase Project ID]
-   **Key Collections to Monitor:** `sessions`, `ck_continuity`, `templates`
-   **Execution Method:** Human Developer (HD) running `node src/template-exchange/fs_revolutionary_prototype.js <command> [args...]` commands in a terminal, guided by CK (simulated or actual).
-   **AI Roles (Simulated if necessary):**
    -   **CK (Context Keeper):** Will determine the command and data to be used for the script.
    -   **CG (Code Generator - Cursor AI):** Will simulate receiving handoff data and providing summary data.

## 4. Test Scenarios & Cases

**Scenario 1: Full Session Lifecycle Simulation**

This scenario tests the end-to-end flow of initializing a session, CK managing continuity, CK creating a handoff for CG, CG (simulated) creating a summary, and CK processing the summary and updating the session.

**Test Case 1.1: Initialize a New Session**

-   **Objective:** Verify successful creation of a new session document in the `sessions` collection.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **Steps:**
    1.  CK determines parameters: `milestoneName = "TestMilestone_Alpha"`, `focusTaskIds = ["TM#901", "TM#902"]`, `customSessionId = "TestSession_001"`.
    2.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js initializeNewSession "TestMilestone_Alpha" "TM#901,TM#902" "TestSession_001"`
-   **Expected Result:**
    1.  Script output indicates successful creation with ID `TestSession_001`.
    2.  A new document with ID `TestSession_001` exists in the `sessions` collection.
    3.  The document contains fields: `milestone_active`, `tasks_focus` (with TM#901, TM#902), `status: "active"`, `startedAt` (timestamp), `updatedAt` (timestamp), `active_plan` (with default structure), `history_log` (with initial creation event).
-   **Verification:** Inspect Firestore `sessions` collection.

**Test Case 1.2: CK Updates Its Continuity (Initial)**

-   **Objective:** Verify CK can create/update its continuity document.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **CK Instance ID:** `test_ck_instance_001`
-   **Steps:**
    1.  CK prepares data: `continuityData = { displayName: "Test CK 001", last_active_bible_refs: ["B1.0", "B7.1"], last_snapshot: { info: "Initial setup for testing" } }`.
    2.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js updateCkContinuity "test_ck_instance_001" '{"displayName":"Test CK 001","last_active_bible_refs":["B1.0","B7.1"],"last_snapshot":{"info":"Initial setup for testing"}}'`
-   **Expected Result:**
    1.  Script output indicates successful update.
    2.  A document with ID `test_ck_instance_001` exists in `ck_continuity`.
    3.  The document contains the provided data and an `updatedAt` timestamp.
-   **Verification:** Inspect Firestore `ck_continuity` collection.

**Test Case 1.3: CK Sets Presence in Session**

-   **Objective:** Verify CK can update the active session with its instance ID.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **Session ID:** `TestSession_001` (from TC1.1)
-   **CK Instance ID:** `test_ck_instance_001`
-   **Steps:**
    1.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js updateSessionStatus "TestSession_001" '{"current_ck_instance_id":"test_ck_instance_001"}'`
-   **Expected Result:**
    1.  Script output indicates successful update.
    2.  The `sessions/TestSession_001` document now has `current_ck_instance_id: "test_ck_instance_001"` and an updated `updatedAt` timestamp.
-   **Verification:** Inspect Firestore `sessions/TestSession_001`.

**Test Case 1.4: CK Creates a Handoff Template for CG**

-   **Objective:** Verify successful creation of a `ck_to_cg_handoff` template.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **Session ID:** `TestSession_001`
-   **Steps:**
    1.  CK prepares `handoffData` (ensure it matches schema `revolutionary_workflow_schema_v1.md`):
        ```json
        {
          "source": "test_ck_instance_001",
          "taskMasterId": "TM#901",
          "sessionGoal": "Complete initial setup for TestMilestone_Alpha",
          "taskObjective": "Implement the core login function as per spec B4.2",
          "keyFiles": ["src/auth.js"],
          "relevantBibleRefs": ["B4.2", "B2.1"],
          "specificInstructions": ["Use JWT for tokens", "Ensure password hashing"],
          "requiredSummaryFormat": "Standard CG summary fields"
        }
        ```
    2.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js createCgHandoff "TestSession_001" '{"source":"test_ck_instance_001","taskMasterId":"TM#901","sessionGoal":"Complete initial setup for TestMilestone_Alpha","taskObjective":"Implement the core login function as per spec B4.2","keyFiles":["src/auth.js"],"relevantBibleRefs":["B4.2","B2.1"],"specificInstructions":["Use JWT for tokens","Ensure password hashing"],"requiredSummaryFormat":"Standard CG summary fields"}'`
-   **Expected Result:**
    1.  Script output indicates successful creation and returns a new `handoffTemplateId`.
    2.  A new document exists in the `templates` collection with this ID.
    3.  The document has `type: "ck_to_cg_handoff"`, `sessionId: "TestSession_001"`, and all other provided `handoffData` fields, plus `createdAt` and `updatedAt` timestamps.
-   **Verification:** Inspect Firestore `templates` collection. Record the `handoffTemplateId` for the next step.

**Test Case 1.5: CG (Simulated) Creates an Implementation Summary**

-   **Objective:** Simulate CG creating a `cg_implementation_summary` (this step is manual in Firestore or via another script/tool for testing purposes, as CG is external to this script).
-   **Actors:** Test operator (simulating CG).
-   **Related Handoff ID:** (From TC1.4)
-   **Session ID:** `TestSession_001`
-   **Steps:**
    1.  Manually create a new document in the `templates` collection with the following structure (or use a separate script to do so):
        ```json
        {
          "sessionId": "TestSession_001",
          "type": "cg_implementation_summary",
          "source": "simulated_cg_001",
          "status": "complete",
          "relatedHandoffTemplateId": "[handoffTemplateId_from_TC1.4]",
          "taskMasterId": "TM#901",
          "taskObjective": "Implement the core login function as per spec B4.2",
          "keyChangesMade": ["Implemented login() in src/auth.js", "Added password hashing utility"],
          "filesModified": ["📄 src/auth.js", "📄 src/utils/hash.js"],
          "decisionsByAI": ["Used bcrypt for hashing due to industry standard"],
          "issuesOrFollowUp": ["Unit tests for hashing pending"],
          "createdAt": admin.firestore.FieldValue.serverTimestamp(), // Or static test timestamp
          "updatedAt": admin.firestore.FieldValue.serverTimestamp() // Or static test timestamp
        }
        ```
-   **Expected Result:** A new document of type `cg_implementation_summary` exists in `templates`.
-   **Verification:** Inspect Firestore `templates` collection. Record the ID of this new summary document (`summaryTemplateId`).

**Test Case 1.6: CK Retrieves the CG Summary**

-   **Objective:** Verify CK can fetch the CG summary template.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **Summary Template ID:** (From TC1.5)
-   **Steps:**
    1.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js getCgSummary "[summaryTemplateId_from_TC1.5]"`
-   **Expected Result:**
    1.  Script output shows the data of the summary document.
    2.  The data matches what was created in TC1.5.
-   **Verification:** Compare script output with Firestore data.

**Test Case 1.7: CK Updates Session Status After CG Summary**

-   **Objective:** Verify CK can update the session document with summary reference and other details.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **Session ID:** `TestSession_001`
-   **Summary Template ID:** (From TC1.5)
-   **Steps:**
    1.  CK prepares `statusUpdateData`:
        ```json
        {
          "last_cg_summary_ref": "[summaryTemplateId_from_TC1.5]",
          "status_details": "CG work for TM#901 reviewed. Looks good.",
          "history_log_append": {
            "event_type": "cg_summary_processed",
            "actor": "test_ck_instance_001",
            "details": "Processed CG summary for TM#901. Ref: [summaryTemplateId_from_TC1.5]"
          }
        }
        ```
        *(Note: `history_log_append` is a conceptual field; the script currently merges top-level. This might need script adjustment for array appends or the test will verify direct field updates.)*
    2.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js updateSessionStatus "TestSession_001" '{"last_cg_summary_ref":"[summaryTemplateId_from_TC1.5]","status_details":"CG work for TM#901 reviewed. Looks good."}'` (Simplified for current script capabilities. Manual check for history log or script enhancement needed for append.)
-   **Expected Result:**
    1.  Script output indicates successful update.
    2.  `sessions/TestSession_001` document has `last_cg_summary_ref` and `status_details` updated.
    3.  `updatedAt` timestamp is updated.
    4.  (If script supports history log append): `history_log` array has a new entry.
-   **Verification:** Inspect Firestore `sessions/TestSession_001`.

**Test Case 1.8: CK Updates Its Continuity (End of Cycle)**

-   **Objective:** Verify CK updates its continuity after a work cycle.
-   **Actors:** HD (executing script), CK (providing parameters).
-   **CK Instance ID:** `test_ck_instance_001`
-   **Steps:**
    1.  CK prepares data: `continuityUpdate = { last_session_id: "TestSession_001", last_active_bible_refs: ["B4.2", "B2.1"], last_snapshot: { info: "Completed test cycle for TM#901", patterns_used: ["JWT_auth"] } }`.
    2.  HD executes: `node src/template-exchange/fs_revolutionary_prototype.js updateCkContinuity "test_ck_instance_001" '{"last_session_id":"TestSession_001","last_active_bible_refs":["B4.2","B2.1"],"last_snapshot":{"info":"Completed test cycle for TM#901","patterns_used":["JWT_auth"]}}'`
-   **Expected Result:**
    1.  Script output indicates successful update.
    2.  `ck_continuity/test_ck_instance_001` document is updated with new data and `updatedAt` timestamp.
-   **Verification:** Inspect Firestore `ck_continuity/test_ck_instance_001`.

**Scenario 2: Error Handling & Edge Cases (Basic)**

**Test Case 2.1: Get Non-Existent CK Continuity**

-   **Objective:** Verify script handles fetching a non-existent CK continuity document gracefully.
-   **Actors:** HD, CK.
-   **Steps:** HD executes: `node src/template-exchange/fs_revolutionary_prototype.js getCkContinuity "non_existent_ck_id"`
-   **Expected Result:** Script outputs a message indicating no document found (e.g., "No CK continuity document found...") and returns null or equivalent without crashing.
-   **Verification:** Observe script output.

**Test Case 2.2: Get Non-Existent CG Summary**

-   **Objective:** Verify script handles fetching a non-existent CG summary template gracefully.
-   **Actors:** HD, CK.
-   **Steps:** HD executes: `node src/template-exchange/fs_revolutionary_prototype.js getCgSummary "non_existent_summary_id"`
-   **Expected Result:** Script outputs a message indicating no document found and returns null or equivalent without crashing.
-   **Verification:** Observe script output.

## 5. Test Data Management

-   Before each full run of Scenario 1, consider clearing or archiving documents created in `sessions`, `ck_continuity`, and `templates` with IDs like `TestSession_001`, `test_ck_instance_001` to ensure a clean test environment, or use unique IDs for each test run.
-   Note IDs generated during testing (e.g., handoff template IDs, summary template IDs) as they are needed for subsequent steps.

## 6. Reporting

-   For each test case, record:
    -   Test Case ID
    -   Steps Executed
    -   Actual Result (script output, Firestore data state)
    -   Expected Result
    -   Pass/Fail Status
    -   Notes/Observations (any errors, deviations, or issues encountered).

## 7. Future Considerations (Beyond Basic Test Plan)

-   Testing concurrent access (if applicable to future design).
-   Scalability testing with many documents.
-   More comprehensive error handling in the script (e.g., invalid input JSON, Firestore permission errors).
-   Testing the `history_log` append functionality more robustly if the script is enhanced.
-   Testing interaction with actual CK and CG AI instances once they are adapted to use this workflow. 