# Firebase Schema for Revolutionary AI Workflow Context Storage v1

## 1. Overview

This document outlines the Firebase Firestore schema designed to support a revolutionary, streamlined AI-driven workflow. The goal is to enable dynamic context storage, real-time synchronization between AI agents (Claude Desktop as "CK" and Cursor AI as "CG"), and significantly reduce session startup times.

This schema addresses the requirements of Task #312 and is based on the "Revolutionary Workflow Test Handoff" (ID: `p6Ut3b7CuMd8JkvRak6W`).

## 2. Core Collections

### 2.1. `sessions` Collection

**Purpose**: Stores active and historical context for distinct work sessions. This allows for quick resumption and provides a detailed log of activities within a session.

**Path**: `sessions/{sessionId}`

#### Document Structure (`sessions/{sessionId}`)

| Field                         | Type                     | Description                                                                                                | Required | Example                                         |
| :---------------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------- | :------- | :---------------------------------------------- |
| `milestone_active`            | String                   | Identifier of the current active milestone (e.g., Task Master ID, or a conceptual milestone name).         | Yes      | "TM_Milestone_Phase1"                           |
| `tasks_selected`              | Array\<String>           | List of Task Master IDs specifically targeted or active within this session.                             | No       | `["301", "302", "305"]`                         |
| `context_summary`             | String                   | A brief, human-readable summary of the session's primary goal, focus, or current state.                  | Yes      | "Continue PWA auto-save documentation (Tasks 303-304)." |
| `decisions_made`              | Array\<Object>           | Log of significant decisions made during the session.                                                    | No       | `[{"ts": Timestamp, "decision": "Use X library..."}]` |
| `decisions_made[].timestamp`  | Timestamp                | Timestamp of when the decision was logged.                                                                 | Yes      | `serverTimestamp()`                             |
| `decisions_made[].decision`   | String                   | Description of the decision.                                                                               | Yes      | "Opted for direct Firestore writes via MCP..."    |
| `decisions_made[].rationale`  | String                   | (Optional) Justification or reasoning behind the decision.                                               | No       | "Simpler for AI prompting than generic HTTP."   |
| `next_session_ideas`          | Array\<String>           | Bullet points or brief notes for tasks, ideas, or follow-ups intended for future sessions.               | No       | `["Investigate token tracking", "Refine SHIP template"]` |
| `status`                      | String                   | Current status of the session.                                                                             | Yes      | "active", "paused", "completed", "archived"     |
| `createdAt`                   | Timestamp                | Firestore server timestamp when the session document was created.                                          | Yes      | `serverTimestamp()`                             |
| `updatedAt`                   | Timestamp                | Firestore server timestamp of the last update to this session document.                                    | Yes      | `serverTimestamp()`                             |
| `endedAt`                     | Timestamp                | (Nullable) Firestore server timestamp when the session was formally concluded (e.g., status set to "completed"). | No       | `serverTimestamp()`                             |
| `createdByAiInstanceId`       | String                   | (Nullable) Identifier of the AI instance (CK or CG) that initiated or owns this session.                 | No       | "claude-desktop-ck-instance-001"                |
| `lastUpdatedByAiInstanceId`   | String                   | (Nullable) Identifier of the AI instance that last made significant updates to this session.             | No       | "cursor-ai-cg-instance-105"                     |

*(Detailed schema to be added here)*

### 2.2. `ck_continuity` Collection

**Purpose**: Provides a mechanism for Claude Desktop (CK) instances to maintain context and learning across different operational instances or interruptions. This helps CK to remember patterns, active references, and overall progress.

**Path**: `ck_continuity/{ck_instance_id}`

#### Document Structure (`ck_continuity/{ck_instance_id}`)

| Field                               | Type            | Description                                                                                                    | Required | Example                                                                 |
| :---------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------- | :------- | :---------------------------------------------------------------------- |
| `displayName`                       | String          | A human-readable name for this CK instance configuration.                                                      | No       | "CK - Primary Development Rig"                                          |
| `last_context`                      | Object          | Snapshot of the last significant working context.                                                              | No       | `{"last_session_id": "M.WF-MCP.S1"}`                                     |
| `last_context.last_session_id`      | String          | Reference to the last active session ID from the `sessions` collection.                                          | Cond.    | "M.WF-MCP.S1"                                                           |
| `last_context.active_document_path` | String          | Path to the primary document/file being worked on at the end of the last known context.                          | Cond.    | "src/components/MyComponent.jsx"                                        |
| `last_context.recent_tool_usage`    | Array\<Object>  | Log of recent tools used and their outcomes.                                                                   | No       | `[{"tool_name": "readFile", "ts": Timestamp, "result": "success"}]` |
| `last_context.prompt_chain_summary` | String          | A summary of the ongoing conversation or prompt sequence.                                                      | Cond.    | "User asked to refactor X, current step is Y..."                        |
| `bible_refs_active`                 | Array\<Object>  | List of Bible documents currently considered active or highly relevant by this CK instance.                    | No       | `[{"bible_id": "B5.1", "last_accessed": Timestamp}]`                 |
| `bible_refs_active[].bible_id`      | String          | Identifier of the Bible document (e.g., "B5.1", "B7.2").                                                    | Yes      | "B5.1"                                                                  |
| `bible_refs_active[].last_accessed` | Timestamp       | When this Bible reference was last significantly used or confirmed relevant.                                   | Yes      | `serverTimestamp()`                                                     |
| `bible_refs_active[].relevance_score`| Number          | (Optional) A score indicating the current relevance (0.0-1.0).                                               | No       | `0.85`                                                                  |
| `milestone_progress`                | Object          | Tracks progress against larger, named milestones. Keys are milestone_ids.                                      | No       | `{"Phase1_Docs": {"status": "in-progress", "progress": 60}}`         |
| `milestone_progress.{milestone_id}.status` | String        | Status of the milestone (e.g., "not-started", "in-progress", "completed").                               | Yes      | "in-progress"                                                         |
| `milestone_progress.{milestone_id}.notes` | String        | (Optional) Brief notes about the milestone's progress.                                                       | No       | "Schema section done, data flow next."                                  |
| `milestone_progress.{milestone_id}.percentage` | Number      | (Optional) Estimated percentage completion (0-100).                                                          | No       | `75`                                                                    |
| `handoff_patterns`                  | Array\<Object>  | Learned patterns or templates for generating effective handoffs.                                               | No       | `[{"name": "DocTaskHandoff", "usage_count": 5}]`                     |
| `handoff_patterns[].name`           | String          | Name of the handoff pattern/template.                                                                          | Yes      | "StandardDocumentationHandoff"                                          |
| `handoff_patterns[].structure`      | Object          | (Conceptual) The structure or key elements of this handoff type.                                               | Yes      | `{"sections": ["Objective", "Deliverables"]}`                          |
| `handoff_patterns[].usage_count`    | Number          | How many times this pattern has been successfully used.                                                        | No       | `15`                                                                    |
| `handoff_patterns[].effectiveness`  | Number          | (Optional) Rating of effectiveness (0.0-1.0).                                                                | No       | `0.9`                                                                   |
| `preferences`                       | Object          | CK-specific operational preferences.                                                                           | No       | `{"verbosity": "concise"}`                                             |
| `preferences.default_token_model`   | String          | Preferred AI model for its operations if choices are available.                                                | No       | "claude-3-opus"                                                         |
| `preferences.verbosity_level`       | String          | Desired verbosity for CK's responses (e.g., "concise", "normal", "detailed").                               | No       | "normal"                                                                |
| `createdAt`                         | Timestamp       | Firestore server timestamp when this CK instance continuity record was created.                                | Yes      | `serverTimestamp()`                                                     |
| `updatedAt`                         | Timestamp       | Firestore server timestamp of the last update to this CK instance's continuity data.                           | Yes      | `serverTimestamp()`                                                     |

*(Detailed schema to be added here)*

### 2.3. `templates` Collection (Enhancements)

**Purpose**: Extends the existing `templates` collection (used for handoffs, summaries, research) to store new types of structured data critical for the revolutionary workflow. The existing `type` field will be used to differentiate these new structures.

**Path**: `templates/{templateId}`

**Common Fields Reminder**: All documents in the `templates` collection typically include fields like `sessionId` (contextual unique ID for the specific template instance, potentially incorporating AI instance ID, Task ID, and a timestamp or UUID), `type` (String, see below), `source` (String, e.g., "claude-desktop-ck", "cursor-ai-cg"), `status` (String, e.g., "active", "draft", "archived"), `metadata` (Object), `createdAt` (Timestamp), `updatedAt` (Timestamp). The specific structure of `metadata` may vary per type.

#### New Document Types and their `content` (Object) Structure:

**1. Type: `session_context_snapshot`**

   - **Purpose**: Stores a shareable or archivable snapshot of a `sessions` document's key information, for context transfer or logging.
   - **`content` Structure**:

     | Field                               | Type            | Description                                                                                      | Required | Example                                                    |
     | :---------------------------------- | :-------------- | :----------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------------- |
     | `source_session_id`                 | String          | The ID of the session from the `sessions` collection this snapshot is derived from.            | Yes      | "M.WF-MCP.S1"                                              |
     | `milestone_active`                  | String          | Copied from `sessions/{source_session_id}`.                                                      | Yes      | "TM_Milestone_Phase1"                                      |
     | `tasks_selected`                    | Array\<String>  | Copied from `sessions/{source_session_id}`.                                                      | No       | `["301", "302"]`                                         |
     | `context_summary`                   | String          | Copied or a refined version from `sessions/{source_session_id}.context_summary`.                 | Yes      | "Finalizing schema for revolutionary workflow."            |
     | `key_decisions_snapshot`            | Array\<Object>  | A selection or summary of `decisions_made` from `sessions/{source_session_id}`.                  | No       | `[{"decision": "Use Firestore direct write"}]`             |
     | `relevant_next_session_ideas`       | Array\<String>  | A selection of `next_session_ideas` from `sessions/{source_session_id}`.                         | No       | `["Draft security rules"]`                                 |
     | `snapshot_reason`                   | String          | Purpose of this snapshot.                                                                        | Yes      | "CK to CG handoff prep for TM312 implementation details" |
     | `generated_by_ai_instance_id`       | String          | ID of the AI instance (CK or CG) that created this snapshot.                                   | Yes      | "claude-desktop-ck-instance-001"                           |

**2. Type: `milestone_progress_report`**

   - **Purpose**: Stores periodic or specific reports on the progress of a defined milestone.
   - **`content` Structure**:

     | Field                               | Type            | Description                                                                                      | Required | Example                                                    |
     | :---------------------------------- | :-------------- | :----------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------------- |
     | `milestone_id`                      | String          | The identifier of the milestone this report pertains to.                                         | Yes      | "RevolutionaryWorkflow_Phase1_SchemaDesign"                |
     | `milestone_title`                   | String          | (Denormalized) Human-readable title of the milestone.                                            | Yes      | "Revolutionary Workflow - Phase 1 Schema Design"           |
     | `reporting_period_start`            | Timestamp       | (Nullable) Start of the period this report covers.                                               | No       | `Timestamp`                                                |
     | `reporting_period_end`              | Timestamp       | (Nullable) End of the period this report covers.                                                 | No       | `Timestamp`                                                |
     | `status_at_report_time`             | String          | Status of the milestone at the time of this report.                                              | Yes      | "on-track", "at-risk", "delayed", "completed"            |
     | `percentage_complete_estimate`      | Number          | Estimated percentage completion (0-100) of the milestone.                                        | No       | `80`                                                       |
     | `summary_of_achievements`           | String          | Markdown text summarizing what was achieved during the period or towards the milestone.          | Yes      | "- Sessions schema defined.\n- CK Continuity drafted."      |
     | `blockers_or_challenges`            | Array\<String>  | Any identified impediments or challenges.                                                        | No       | `["Real-time sync strategy needs more detail"]`            |
     | `next_steps_planned`                | Array\<String>  | Planned next actions for this milestone.                                                         | No       | `["Finalize templates collection enhancements"]`           |
     | `reported_by_ai_instance_id`        | String          | ID of the AI instance (CK or CG) that generated this report.                                   | Yes      | "cursor-ai-cg-instance-105"                              |

**3. Type: `bible_update_proposal`**

   - **Purpose**: Facilitates proposals for changes, additions, or clarifications to Bible documents, allowing AIs to contribute to knowledge base improvements.
   - **`content` Structure**:

     | Field                               | Type            | Description                                                                                      | Required | Example                                                                      |
     | :---------------------------------- | :-------------- | :----------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------------------------------- |
     | `target_bible_id`                   | String          | The Bible document ID this proposal pertains to (e.g., "B5.1", "B7.1").                          | Yes      | "B5.2"                                                                       |
     | `proposal_type`                     | String          | Nature of the proposal.                                                                          | Yes      | "correction", "addition", "clarification", "new_section", "schema_update" |
     | `summary_of_proposal`               | String          | Brief overview of the suggested change.                                                          | Yes      | "Add `lastUpdatedByAiInstanceId` to `sessions` collection."                  |
     | `detailed_proposal`                 | String          | Markdown content detailing the proposed changes (e.g., diff, specific text to add/remove/modify). | Yes      | "In section 2.1, under `sessions/{sessionId}` add a new row for..."        |
     | `rationale`                         | String          | Justification for the proposed update.                                                           | Yes      | "Helps track which AI last touched a session for better debugging."          |
     | `source_of_information`             | String          | (Nullable) Origin of the information leading to this proposal.                                   | No       | "Observation from Task TM312 schema design session."                         |
     | `proposed_by_ai_instance_id`        | String          | ID of the AI instance (CK or CG) making the proposal.                                            | Yes      | "claude-desktop-ck-instance-001"                                           |
     | `review_status`                     | String          | Current review state of the proposal.                                                            | Yes      | "pending_review", "approved", "rejected", "implemented"                  |
     | `review_notes`                      | String          | (Nullable) Notes from the review process.                                                        | No       | "Approved. Good suggestion for auditability."                                |

## 3. Real-Time Sync Strategy

This section outlines how Claude Desktop (CK) and Cursor AI (CG) will interact with the new Firestore collections (`sessions`, `ck_continuity`, and enhanced `templates`) for real-time or near real-time data exchange.

-   **Core Principle**: Firestore's real-time listeners (`onSnapshot`) will be the primary mechanism for AI agents to stay updated on relevant data changes.
-   **CK Responsibilities**:
    -   Writes to its `ck_continuity/{ck_instance_id}` document periodically or on significant context changes (e.g., new Bible references identified, handoff patterns learned).
    -   Creates/updates `sessions/{sessionId}` at the start, during critical state changes, and at the end of its work sessions.
    -   Generates `session_context_snapshot` type documents in the `templates` collection when preparing for handoff to CG or for session archival.
    -   May propose `bible_update_proposal` type documents in the `templates` collection.
    -   Listens to relevant `sessions` documents if another AI (e.g., a supervisory AI or a collaborating CG instance) modifies them during an active shared session.
-   **CG Responsibilities**:
    -   Reads `session_context_snapshot` documents from `templates` upon receiving a handoff to initialize its context.
    -   May read directly from `sessions/{sessionId}` if ongoing, near real-time collaboration with CK is implemented for a specific task and if the session status indicates active collaboration.
    -   Writes `summary` type documents to `templates` upon task completion.
    -   May propose `bible_update_proposal` type documents in `templates`.
    -   Updates `sessions/{sessionId}` if it takes over session control or significantly alters the shared session state (e.g., marking tasks as complete within `tasks_selected`).
-   **Data Flow for Handoff (CK to CG Example)**:
    1.  CK finalizes its work on a task or sub-task.
    2.  CK updates its `ck_continuity/{ck_instance_id}` document with any learned patterns or context shifts.
    3.  CK updates the current `sessions/{sessionId}` document (e.g., updates `context_summary`, sets `status` to "handoff_to_cg_pending").
    4.  CK creates a `session_context_snapshot` document in `templates`, referencing the `source_session_id`.
    5.  CK generates a "handoff" (existing type) document in `templates`. This handoff should reference the newly created `session_context_snapshot` document's ID within its `content` or `metadata`.
    6.  A notification mechanism (TBD, could be a simple Firestore-triggered Cloud Function creating a lightweight task in a shared queue, or CG periodically polling `templates` for handoffs assigned to it) alerts CG.
    7.  CG fetches the "handoff" document and, from it, the linked `session_context_snapshot` to initialize its operational context.
-   **Timestamping**: Consistent use of `serverTimestamp()` for `createdAt` and `updatedAt` fields across all collections is crucial for resolving potential conflicts, understanding data freshness, and ordering events.
-   **Conflict Resolution**: For this initial schema, a "last write wins" strategy is implicit for most shared documents. If direct concurrent writes by multiple AIs to the same document field become frequent, field-level CRDTs, optimistic locking with retry, or more structured state transition fields might be explored in future iterations. For now, clear delineation of write responsibilities per session state (e.g., CK owns session context during its active phase, CG updates specific parts upon its activation) should minimize direct conflicts.

## 4. Context Optimization Recommendations

This section provides strategies for keeping the context stored in Firestore concise, relevant, and efficient for AI processing, especially considering token limits and retrieval performance.

-   **Summarization**: 
    -   AI agents should be prompted to generate concise summaries for fields like `context_summary` in `sessions` and `last_context.prompt_chain_summary` in `ck_continuity`. Emphasize extracting key entities, decisions, and next steps rather than verbose transcripts.
    -   For array fields like `decisions_made` or `last_context.recent_tool_usage`, AIs should log only significant items. Consider a cap on array length for `recent_tool_usage`, with older items being summarized or dropped if not critical for immediate continuity.
-   **Selective Storage & Tiered Context**: 
    -   Prioritize storing context essential for direct continuity and cross-AI understanding. Avoid dumping raw, unprocessed data unless specifically required for a detailed log or snapshot.
    -   For `bible_refs_active` in `ck_continuity`, implement a mechanism (possibly within CK's logic) to use `relevance_score` and `last_accessed` to periodically prune or downgrade less relevant Bible references, keeping the active set focused.
    -   Think of context in tiers: immediate working context (highly active, might be partly in AI memory), short-term session context (`sessions` document), long-term continuity context (`ck_continuity`), and archival (snapshots in `templates` or cold storage).
-   **Structured Data for Clarity**: 
    -   Adhere to the defined object structures. This aids programmatic access by other AIs or tools and allows for more targeted updates and queries.
    -   For `decisions_made`, a consistent structure (`timestamp`, `decision`, `rationale`) is better than free-form text.
-   **Reference vs. Duplication Balance**: 
    -   Favor storing references (IDs) to other documents (e.g., `source_session_id` in `session_context_snapshot`) to avoid data redundancy and ensure a single source of truth for mutable entities.
    -   Denormalize small, frequently co-accessed data points where the performance gain outweighs the complexity of ensuring consistency (e.g., `milestone_title` in `milestone_progress_report`). Document denormalization choices and update strategies.
-   **AI Prompting for Conciseness**: 
    -   Prompts used to instruct AIs to populate these Firestore documents must explicitly guide them towards brevity, relevance, and adherence to schema, mentioning token efficiency as a goal.
-   **Regular Review & Archival Strategy**: 
    -   Define (manual or semi-automated) processes to review and archive old `sessions` (e.g., those "completed" or "archived" for over X days). Archival could mean exporting to cold storage and deleting from Firestore, or simply updating a status to "deep_archive" with restricted querying.
    -   `ck_continuity` data is valuable but should also be subject to review, ensuring it doesn't grow indefinitely with outdated or irrelevant patterns.

## 5. Security Considerations

This section covers access control and data protection measures for the workflow context stored in Firestore.

-   **Firestore Security Rules**: 
    -   Define granular security rules for read/write access to each collection. Rules should ideally leverage Firebase Authentication UIDs or custom claims if AI agents can be distinctly authenticated.
    -   **`sessions`**: 
        -   `create`: Allow authenticated AIs (CK, CG based on their role/task).
        -   `read`: Allow AI that is `createdByAiInstanceId` or `lastUpdatedByAiInstanceId`, or based on a shared `sessionId` if in a collaborative phase. Supervisory AIs might have broader read access.
        -   `update`: Typically restricted to `lastUpdatedByAiInstanceId` or the currently active AI for that session. Specific fields might have different update rules (e.g., CG updating `tasks_selected` status).
    -   **`ck_continuity`**: 
        -   `read/write`: Should be strictly limited to the specific CK instance identified by `{ck_instance_id}`. This implies CK authenticates with an ID that can be matched in rules.
    -   **`templates`**: 
        -   `create`: Allow authenticated AIs to create types relevant to their role (CK: handoffs, snapshots; CG: summaries, proposals).
        -   `read`: Based on `type` and `status`. E.g., CG can read active handoffs; CK might read summaries related to its tasks.
        -   `update`: Generally, updates should be restricted (e.g., only creator can update a `draft` status). `bible_update_proposal.review_status` should only be updatable by a human reviewer or a designated supervisory AI role.
-   **Authentication**: 
    -   AI agents (CK, CG) must authenticate with Firebase. Service accounts are suitable for backend CK processes. For CG (if running client-side or as a user-delegated agent), standard Firebase client auth might be used, potentially with custom claims to identify it as a CG instance.
    -   Service account keys must be stored securely (e.g., GCP Secret Manager) and adhere to the principle of least privilege.
-   **Data Validation in Rules**: 
    -   Implement basic data validation within security rules (e.g., checking for required fields, data types, string lengths, valid enum values for `status` or `type` fields) as a secondary layer to client-side validation by AIs.
-   **Audit Trails & Immutability**: 
    -   Fields like `createdAt`, `updatedAt`, `createdByAiInstanceId`, `lastUpdatedByAiInstanceId` provide essential audit trails. For critical data or decisions, consider writing to an immutable log collection in append-only mode.
-   **Data Minimization & Sensitivity**: 
    -   Only store data essential for the workflow. Avoid including sensitive user data, credentials, or excessively detailed logs in these operational context stores unless explicitly justified and secured.
    -   Regularly review if all stored fields are actively used and providing value.
-   **No PII Focus**: These schemas are designed for AI operational context, not for storing user PII. If any user-related identifiers are needed beyond functional AI instance IDs, they must be handled with extreme care and be justifiable for the workflow.

## 6. Performance Optimization

This section details choices for indexing and data structuring to ensure efficient data retrieval and updates for the AI workflow.

-   **Indexing Strategy (Preliminary)**:
    -   **`sessions`**:
        -   Composite: `(status ASC, updatedAt DESC)` - For querying active or recently updated sessions.
        -   Single-field: `createdByAiInstanceId` - If needing to list sessions by a specific AI creator.
        -   Single-field: `milestone_active` - If needing to find sessions related to a milestone.
    -   **`ck_continuity`**:
        -   Primary access is by document ID (`{ck_instance_id}`), typically not requiring complex query indexes beyond default Firestore capabilities for direct lookups.
    -   **`templates`**:
        -   Composite: `(type ASC, status ASC, createdAt DESC)` - For finding active handoffs, pending proposals, etc.
        -   Composite: `(type ASC, metadata.taskMasterId ASC)` - If Task Master IDs are stored in `metadata` and frequently queried for specific template types.
        -   Composite: `(type ASC, source_session_id ASC)` - For `session_context_snapshot` lookup.
        -   Composite: `(type ASC, target_bible_id ASC, review_status ASC)` - For `bible_update_proposal` management.
    -   *Action*: These indexes should be explicitly defined in `firestore.indexes.json` and tested.
-   **Data Structure Choices**: 
    -   **Maps vs. Subcollections**: The current design uses maps (e.g., `last_context` in `ck_continuity`, `content` in `templates`) where child data is intrinsically part of the parent document and usually accessed together. If any map grows excessively large (approaching Firestore document size limits) or its individual keys need to be queried independently and paginated, converting that part to a subcollection would be necessary.
    -   **Document Size Management**: Monitor document sizes, especially for fields that can accumulate data (e.g., `decisions_made`, `next_session_ideas`, `detailed_proposal`). Implement strategies (summarization, truncation, linking to external storage for very large blobs) if they risk exceeding Firestore's 1 MiB limit.
-   **Efficient Query Design**: 
    -   Queries should be highly selective, using indexed fields in `where` clauses.
    -   Fetch only necessary fields using `select()` if supported by the MCP tools and if document sizes are large and only partial data is needed (though often client SDKs fetch the full document).
    -   Use `limit()` to cap query results, especially for lists displayed in UI or processed by AIs.
-   **Real-time Listener Management**: 
    -   AIs should attach `onSnapshot` listeners only to the specific documents or queries they actively need.
    -   Listeners must be detached when the AI no longer needs real-time updates for that data (e.g., on session end, context switch) to conserve client and server resources.
    -   Avoid overly broad queries for listeners. If listening to a collection, ensure filters are narrow enough.
-   **Batched Writes**: 
    -   Utilize `WriteBatch` for any operation requiring atomic updates across multiple documents (e.g., updating a `session` document and creating a related `session_context_snapshot` in `templates`). This ensures data consistency and is more performant than individual writes.
-   **Strategic Denormalization**: 
    -   Denormalization (e.g., `milestone_title` in `milestone_progress_report`) is used sparingly to improve read performance for co-accessed data. Each instance of denormalization requires a clear strategy for keeping data consistent (e.g., update denormalized fields when the source changes, or accept a small degree of potential staleness for non-critical display data). 