# [B7.X] Session Handoff & Initialization Plan (SHIP) - Revolutionary Firebase Workflow v1

**Session ID (Firebase):** `[firebase_sessions_document_id]` (e.g., M1.S1_YYYYMMDD_focus)
**Task Master Task ID (if primary focus):** #[TM_ID]
**Date:** [YYYY-MM-DD]

---
**(CK START BLOCK) Attention Context Keeper (CK):**

- **Your Role:** You are the CK for this KarmaCash session, operating under the **Revolutionary Firebase Workflow**.
- **Context Source:** Your primary context comes from Firebase:
    - Active `sessions/{sessionId}` document (retrieved via `mcp_firebase_firestore_get_document`).
    - Your `ck_continuity/{ck_instance_id}` document.
    - Relevant `templates/{templateId}` (e.g., handoffs, summaries, context snapshots).
- **HD Context:** The HD is non-developer. Guide them with clear, actionable steps.
- **Key Workflow Change:** Most context exchange (handoffs, summaries, session state) now happens via Firestore `templates` and `sessions` collections. Task Master is still used for task definition and status, but SHIP itself is lighter.
- **Action Required:**
  1. Fetch the active `sessions/{sessionId}` document from Firebase.
  2. Fetch your `ck_continuity/{ck_instance_id}` document.
  3. Summarize the **Plan for This Session (Section 4)** based on the `active_plan` within the session document.
---

**Purpose:** To structure development sessions using a Firebase-centric context management system, minimizing local file dependencies for SHIP and streamlining AI-to-AI handoffs, while still integrating with Task Master for task tracking.

## 1. Core Project Context (Links & Stable Refs)

*Static links to core Bible sections. Detailed context is now primarily in Firebase.*

- **Project Vision:** [Link to B1.0]
- **Guiding Principles:** [Link to B1.1]
- **Architecture Overview:** [Link to B2]
- **Key Standards:** [Link to B2.2]
- **Primary "Bible" Sections for this Milestone/Feature:** [e.g., B3.X, B5.Y, B6.Z]
- **Revolutionary Workflow Schema:** `documentation/revolutionary_workflow_schema_v1.md`

## 2. Session Initialization & Context Loading (Firebase Driven)

*CK performs these steps at session start.*

- **2.1. Active Firebase Session ID:** `[firebase_sessions_document_id]` (Matches top of doc)
- **2.2. CK Instance ID (Firebase):** `[ck_instance_id_for_firestore]`
- **2.3. Current Milestone (from `sessions/{sessionId}.milestone_active`):** `[...]`
- **2.4. Associated Task Master Task(s) (from `sessions/{sessionId}.tasks_focus`):**
    - `#[TM_ID_1]` - [Title]
    - `#[TM_ID_2]` - [Title]
- **2.5. Continuity Loaded (from `ck_continuity/{ck_instance_id}.last_snapshot`):** [Brief note on what context was loaded, e.g., "Loaded previous session's active files, common Bible refs"]
- **2.6. Handoff from CG (if applicable, from `templates/{templateId}` of type `cg_implementation_summary` linked in `sessions/{sessionId}.last_cg_summary_ref`):**
    - Handoff Template ID: `[...]`
    - Brief Summary of CG's last work: `[...]`

## 3. Collaboration Workflow (Ref: Firebase Schema & [B7.1 Adaptations])

- **HD Role:** Vision, decisions, validation, final TM CLI ops if AI tools for TM fail.
- **CK Role (You):** Firebase context management, planning with HD, prompting CG (via Firebase handoff `templates`), preparing Firebase `session_context_snapshot` for CG.
- **CG Role (Cursor AI):** Retrieves handoff `templates` from Firebase, implements, creates implementation summary `templates` in Firebase. Queries Task Master via MCP tools as needed.
- **Key Flow:**
    1. HD/CK define session plan in `sessions/{sessionId}.active_plan`.
    2. CK prepares handoff `template` (type: `ck_to_cg_handoff`) in Firebase.
    3. CG retrieves handoff `template`, implements.
    4. CG creates summary `template` (type: `cg_implementation_summary`) in Firebase.
    5. CK/HD review summary `template`. CK updates `sessions/{sessionId}`.

## 4. Plan for *This* Session (Pulled from `sessions/{sessionId}.active_plan`)

*This section is primarily a reflection of `sessions/{sessionId}.active_plan.current_focus` and `active_plan.tasks_planned`.*

- **4.1. Session Goal (from `active_plan.goal`):** `[...]`
- **4.2. Primary Area(s) of Focus (from `active_plan.focus_areas`):** `[...]`
- **4.3. Planned Tasks for Today (from `active_plan.tasks_planned`):**
  *(Each task here should have a corresponding entry in `sessions/{sessionId}.tasks_focus` and link to Task Master)*

  - **Task 1: (Ref: Task Master ID #[TM_ID]) - [Task Title from Task Master]**
    - **Session Objective (from `active_plan.tasks_planned[0].session_objective`):** `[...]`
    - **Key Bible Ref(s) (from `active_plan.tasks_planned[0].bible_refs`):** `[BX.Y]`
    - **Input Firebase Template ID (e.g., prior research, from `active_plan.tasks_planned[0].input_template_ref`):** `[...]`

  - *(Add Task 2 if applicable)*

- **4.4. Expected Outcome (from `active_plan.expected_outcome`):** `[...]`
- **4.5. Session Constraints (from `active_plan.constraints`):** `[...]`

## 5. Emergent Task Management (During the Session)

*New tasks or significant deviations identified during the session. CK updates `sessions/{sessionId}.active_plan.emergent_tasks` array in Firebase.*

- **5.1. Emergent Task Log (Mirrors `sessions/{sessionId}.active_plan.emergent_tasks`):**
    - `{description: "...", status: "pending/addressed", resolution_notes: "..."}`

## 6. CK-to-CG Handoff (via Firebase `templates` collection)

*CK prepares a document in `templates` with `type: "ck_to_cg_handoff"`.*

- **Handoff Template ID (Firebase):** `[ID of the new templates document]`
- **Handoff Content Structure (Example - see `revolutionary_workflow_schema_v1.md` for full spec):**
    ```json
    // templates/{templateId}
    {
      "sessionId": "current_firebase_session_id",
      "type": "ck_to_cg_handoff",
      "source": "claude-desktop-ck", // or your ck_instance_id
      "status": "active",
      "taskMasterId": "#[TM_ID_for_this_handoff]",
      "sessionGoal": "Copy from Sec 4.1 of this SHIP / sessions doc",
      "taskObjective": "Specific goal for CG for this task",
      "keyFiles": ["src/components/example.jsx", "@MyComponent"],
      "relevantBibleRefs": ["[B3.4]", "[B5.2]"],
      "corePrinciples": ["Zen UI", "Mobile-first"],
      "specificInstructions": [
        "Implement the UI based on mockup X (ref: templates/mockup_X_id)",
        "Ensure all state is managed via Zustand store Y (ref: bible [B6.3])",
        "Write unit tests for function Z."
      ],
      "requiredSummaryFormat": "Standard CG summary fields required in response template (type: cg_implementation_summary)",
      "attachments": [
        {"type": "mockup_ref", "templateId": "firebase_template_id_of_mockup"}
      ],
      "metadata": {"version": "1.0"}
    }
    ```
- **CK Action:** After creating the handoff template in Firebase, notify HD. HD will then instruct CG (Cursor AI) to fetch and process this template using `mcp_firebase_firestore_get_document --collection="templates" --id="[HANDOFF_TEMPLATE_ID]"`.

## 7. CG Implementation Summary (via Firebase `templates` collection)

*CG creates a document in `templates` with `type: "cg_implementation_summary"`.*

- **Expected Summary Template ID (Firebase):** `[Will be provided by CG upon creation]`
- **Expected Content Structure (Example - see `revolutionary_workflow_schema_v1.md` for full spec):**
    ```json
    // templates/{templateId}
    {
      "sessionId": "current_firebase_session_id",
      "type": "cg_implementation_summary",
      "source": "cursor-ai-cg",
      "status": "complete",
      "relatedHandoffTemplateId": "[ID of the ck_to_cg_handoff template]",
      "taskMasterId": "#[TM_ID_from_handoff]",
      "taskObjective": "Restated from handoff",
      "keyChangesMade": [
        "Added new component X.jsx",
        "Modified store Y to include Z state",
        "Updated B3.X with new pattern"
      ],
      "filesModified": ["📄 src/components/X.jsx", "📄 src/stores/Y.js", "📄 docs/B3.X.md"],
      "decisionsByAI": ["Assumed X for Y due to Z"],
      "issuesOrFollowUp": ["Consider refactoring A in future", "Unit test for B needs review"],
      "metadata": {"version": "1.0", "duration_minutes": 45}
    }
    ```
- **CK Action:** Once CG notifies that the summary template is created, CK fetches it from Firebase, reviews it with HD, and updates `sessions/{sessionId}.last_cg_summary_ref` and `sessions/{sessionId}.status_details`.

## 8. Session Conclusion & Context Persistence (CK Actions)

*End of session tasks for CK.*

- **8.1. Update Task Master Statuses:**
    - HD/CK instruct CG (Cursor AI) to use `mcp_taskmaster-ai_set_task_status` for all relevant Task Master tasks.
- **8.2. Update `sessions/{sessionId}` in Firebase:**
    - `status`: "completed" (or "paused")
    - `endedAt`: ServerTimestamp
    - `summary_notes`: Brief overall summary of session achievements/blockers.
    - `active_plan.emergent_tasks`: Ensure all are documented.
    - `active_plan.status`: "completed"
    - `next_session_plan_proposal`: { goal: "...", focus_tasks_tm_ids: ["#[TM_ID]"] } (Based on emergent tasks and HD discussion)
- **8.3. Update `ck_continuity/{ck_instance_id}` in Firebase:**
    - `last_session_id`: current `firebase_sessions_document_id`
    - `last_active_bible_refs`: Key Bible sections used.
    - `last_snapshot`: { key_files_worked_on: ["..."], common_errors_encountered: ["..."], successful_patterns: ["..."] }
    - `updatedAt`: ServerTimestamp
- **8.4. (Optional) Create Final `session_context_snapshot` Template:**
    - If a full snapshot of the session's detailed context (beyond the main `sessions` doc) is needed for deep archival or complex future resumption.
    - Type: `session_context_snapshot` in `templates` collection.

## End of Session Checklist (Revolutionary Workflow)

- [ ] **Firebase:** CK: All emergent tasks logged in `sessions/{sessionId}.active_plan.emergent_tasks`.
- [ ] **Task Master:** HD/CK: Instruct CG to update all relevant Task Master task statuses.
- [ ] **Firebase:** CK: Update `sessions/{sessionId}` (status, endedAt, summary, next session proposal).
- [ ] **Firebase:** CK: Update `ck_continuity/{ck_instance_id}` with learnings and last session ID.
- [ ] **Git:** HD: Perform Git actions (Commit, Push relevant code and documentation, including this SHIP if it was locally drafted/modified significantly before creating final Firebase session doc).
- [ ] **Next SHIP Prep:**
    - HD/CK: Discuss and agree on next session's goal and focus tasks.
    - CK: Create the *new* `sessions/{sessionId_next}` document in Firebase, populating `milestone_active`, `tasks_focus`, and `active_plan` (goal, focus_areas, tasks_planned, expected_outcome) based on discussion and `next_session_plan_proposal` from current session.
    - CK: Draft the *local* SHIP markdown file for the next session (e.g., M1.S2_....md), referencing the *new* Firebase `sessionId_next`.
- [ ] **HD Review:** HD reviews the newly drafted local SHIP for the next session.

---
*This SHIP document serves as a local guide and a template for Firebase interactions. The authoritative session state resides in Firestore.* 