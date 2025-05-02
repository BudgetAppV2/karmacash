# B7.1 AI Workflow & SHIP

This document outlines the collaborative AI workflow for KarmaCash development, centered around the Session Handoff & Initialization Plan (SHIP) methodology. This structured approach enables efficient collaboration between the Human Developer (HD) and AI assistants (CK and CG).

## 1. AI Workflow Overview

KarmaCash development leverages a structured AI workflow involving three primary roles:

### 1.1 Core Roles

1. **Context Keeper (CK)**: An AI instance (e.g., Claude 3.5 Sonnet) responsible for maintaining project knowledge, context, and continuity between sessions, **primarily** using the SHIP document as its source of truth. Critically, the CK must understand the HD is *not* a professional developer and tailor support accordingly.
2. **Human Developer (HD)**: The human team member (non-developer background) who guides development direction, defines requirements, makes key decisions, validates results, and manages the interaction with AI tools.
3. **Code Generator (CG)**: An AI instance specialized in code implementation (e.g., Cursor AI), acting on specific, context-rich prompts structured via the SHIP's Handoff Template.

### 1.2 Workflow Diagram

```
+-----------------------+  +----------------------+  +--------------------+
| Context Keeper (CK)   |<-----| Human Developer (HD) |----->| Code Generator (CG)|
| (Project Memory/SHIP) |  | (Vision/Validate)    |  | (Implement Code)   |
| Supports Non-Dev HD   |  | Non-Developer        |  | Needs SHIP Handoff |
+-----------Λ-----------+  +---------Λ------------+  +---------Λ----------+
            |                        |                         |
| Reviews/Updates SHIP  |  | Session Control      |  | Executes Handoffs  |
| Provides Context      |  | Validates Output     |  | Provides Summaries |
+------------------------------V---------------------------+
                        +---------------------+
                        | Session Handoff/Plan|
                        | (SHIP Doc)          |
                        | Includes CK Priming |
                        +---------------------+
```

## 2. Session Handoff & Initialization Plan (SHIP)

The SHIP is a structured document template that facilitates knowledge transfer between development sessions and between participants. It serves as the primary source of context for the CK and guides the HD and CG throughout a session.

### 2.1 SHIP Template Standard (Current Version)

*(Filename Convention: `SHIP-M[Milestone#]-S[Session#]-[YYYY-MM-DD].md`)*

```markdown
# Session Handoff & Initialization Plan (SHIP)

**Session:** M#.S#  
**Date:** YYYY-MM-DD

---
**(CK START BLOCK) Attention Context Keeper (CK):**

- **Your Role:** You are the CK for this KarmaCash session. Your primary function is to maintain context using this SHIP document as the main source. Refer to Bible sections ([BX.Y]) only when needed for deeper detail.
- **HD Context:** Remember, the Human Developer (HD) is *not* a professional developer and relies heavily on your contextual support and planning assistance alongside the Code Generator (CG - Cursor).
- **Action Required:**
  1. Review this entire SHIP document thoroughly.
  2. Confirm understanding of your role and the HD's context.
  3. Provide a concise summary of the **Plan for This Session (Section 5)**, including the **Goal (5.1)** and **Tasks (5.3)**.
---

**Purpose:** To structure our development session, maintain context, track tasks, and effectively collaborate with Cursor AI, following the workflow outlined in [B7.1].

## 1. Core Project Context (The Big Picture)

*Stable, foundational information about the project. For full structure, see [B0_README_TOC.md].*

- **Project Vision:** `[Your concise statement]`
- **Guiding Principles:** `[List key principles or link to Bible: B1.1]`
- **Architecture Overview:** `[Brief summary, e.g., React PWA + Firebase. Link to Bible: B2]`
- **Key Standards:** `[e.g., TypeScript, ESLint config, UTC Dates [B2.3]. Link to Bible: B2.2]`
- **Code Structure:** `[Brief overview or link to Bible: B2.5]`
- **Primary "Bible" Sections:** `[e.g., B1, B2, B3, B5 - Most frequently used]`

## 2. Milestone & Project History (Where We Are Now)

*Tracks our progress through the project roadmap and summarizes key past events.*

- **2.1. Project Roadmap:**
  - `✅ COMPLETED:` M0, M1, M2, M3
  - `▶️ ACTIVE:` **M4a - Architectural Refactor for Shared Budgets** `[Bible: B1.3]`
  - ` M4b - Core Budgeting Logic & UI `[Bible: B1.3]`
  - ` M5 - Analysis/Polish`
  - *(Add/update as needed)*
- **2.2. Current Milestone Status:** `[e.g., Implementing Firestore rules and adapting services for shared context.]`
- **2.3. Recent Session Highlights (Last 1-3 Sessions):**
  - *(Example)* Session M4.1: Implemented `sharedBudgets` schema, drafted initial rules, started refactoring `budgetService.ts`.
  - *(Add key decisions, achievements, blockers)*
- **2.4. Previous Milestone Outcomes & Key Historical Points:**
  - *(Expand this section over time to build history)*
  - M3: Enhanced Tx Views, UI-triggered recurring functions.
  - M2: Core Tx/Category CRUD (user-centric). Fixed default category init.
  - M1: Auth & Layout setup. Firebase project initialized.
  - M0: Project setup, Vite, Initial dependencies.

## 3. Our Collaboration Workflow

- **Your Role (HD):** Lead development (non-dev perspective), define vision & priorities, validate functionality, manage AI interaction.
- **My Role (CK/AI):** Assist with planning (SHIP), context management (Bible refs), prompt generation (Handoffs), task tracking, SHIP updates, debugging analysis. Acknowledge HD's non-dev background.
- **Cursor's Role (CG):** Execute coding tasks based on Handoffs, provide implementation summaries.
- **Flow:** Plan (Review SHIP) → Execute (Planned Tasks + Emergent Tasks using Handoffs) → Summarize (Cursor Summary) → Debug (Sec 6 if needed) → Wrap-up & Plan Next (Update SHIP, Git Actions).
- **Keys to Success:** Clear Handoffs, use `@file`/`@symbol`, verify AI output, confirm completions, keep SHIP updated, regular commits.
- **Branching Strategy:** *(Optional: Briefly describe, e.g., Develop on feature branches `feature/M#-task-name`, merge to `main` via PR after session/feature completion.)*

## 4. Previous Session Recap (Filled at End of *Last* Session)

*Summarizes the session that just finished.*

- **Achievements:** `[...]`
- **Implementation Details:** `[Key code snippets, logic changes]`
- **Challenges & Solutions:** `[...]`
- **Visuals (If any):** `[Link to screenshots or description]`

## 5. Plan for *This* Session: M[#].S[#]

*Our focus and action plan for today.*

- **5.1. Session Goal:** `[...]`
  - **Connects to Milestone:** `[How this helps achieve the ACTIVE milestone (Sec 2.2)]`
- **5.2. Primary Area(s) of Focus:** `[e.g., Firestore Security Rules, Budget Service Logic, Specific UI Component]`

- **5.3. Planned Tasks for Today:**
  *(For each task, define objective, identify relevant context, and list steps for the Handoff)*

  - **Task 1: [Brief Name]**
    - **Objective:** `[...]`
    - **Relevant Files/Symbols:** `[📄 paths, @symbols]`
    - **Key Bible Ref(s):** `[BX.Y]`
    - **Steps / Instructions:** `[1. ..., 2. ...]`

  - **Task 2: [Brief Name]**
    - **Objective:** `[...]`
    - **Relevant Files/Symbols:** `[📄 paths, @symbols]`
    - **Key Bible Ref(s):** `[BX.Y]`
    - **Steps / Instructions:** `[1. ..., 2. ...]`

  - *(Add more planned tasks as needed)*

- **5.4. Required Resources:** `[Any specific docs, API keys, test data needed]`
- **5.5. Expected Outcome:** `[What should be demonstrably working or completed by the end?]`
- **5.6. Session Constraints:** `[Time limit, specific focus areas to exclude, etc.]`

- **5.0 Emergent Task Management (During the Session)**
  - **Purpose:** To capture unexpected tasks that arise during our work.
  - **Process:**
    1. **HD says:** "CK, add emergent task: [Description] (Reason: [brief context])"
    2. **CK action:** Add to log below, confirm.
    3. **HD says:** "CK, mark emergent task '[Description]' as done."
    4. **CK action:** Update log below, confirm.
  - **5.0.1 Emergent Task Log (CK Updates This):**
    - `[ ]`

- **5.7. Ideas for Next Session (M[Next#].S[Next#]):**
  *(Jot down thoughts as we go. Review Emergent Task Log (5.0.1) at the end.)*
  - **Potential Goal:** `[...]`
  - **Possible Tasks:** `[...]`
  - **Relevant Bible Ref(s):** `[...]`

## 6. Debugging Help

*If we get stuck:* Isolate -> Instrument -> Hypothesize -> Validate -> Consult CK/AI.

## 7. Cursor AI Handoff Template

*Use this format when asking Cursor (CG) to write/modify code for a specific task (from Sec 5.3 or an Emergent Task).*

```
--- START CURSOR HANDOFF ---

* **Task Objective:** [Copy from Sec 5.3 Task Objective or describe Emergent Task goal]
* **Overall Session Goal:** [Copy from Sec 5.1]
* **Key Files/Symbols:** [COPY/PASTE list from Sec 5.3 Task or identify for Emergent Task]
  * @files(...)
  * @symbols(...)
* **Relevant Bible Refs:** [Copy from Sec 5.3 Task or identify]
* **Core Principles/Standards Reminders:** [Optional: e.g., Zen UI [B3.4], UTC Dates [B2.3]]
* **Specific Instructions:** [Copy numbered steps from Sec 5.3 Task, or provide clear steps]
  1. ...
  2. ...

**(Cursor: IMPORTANT - Upon completion of this task, please provide a summary using the exact format specified in SHIP Section 8.)**

--- END CURSOR HANDOFF ---
```

## 8. Cursor AI Implementation Summary Template

*Format for Cursor (CG) to use when providing summaries.*

```
--- START CURSOR SUMMARY ---

* **Task Objective:** [Cursor: Restate objective]
* **Key Changes Made:** [Cursor: Bullets of changes]
* **Files Modified/Created:** [Cursor: List paths, use `📄` prefix]
* **Key Decisions/Assumptions by AI:** [Cursor: Important notes]
* **Potential Issues/Follow-up Needed:** [Cursor: Concerns, TODOs]

--- END CURSOR SUMMARY ---
```

## End of Session Checklist

Standard steps before we wrap up:

- [ ] Review Emergent Tasks: Go through Sec 5.0.1. Mark completed, discuss pending.
- [ ] Fill Session Recap: Update Section 4 with today's activities.
- [ ] Update Milestone Context: Update Section 2 (Roadmap, Status, History).
- [ ] Plan Next Session: Refine Section 5.7.
- [ ] Git Actions:
  - [ ] Commit all changes with clear messages. (git commit -m "M#.S#: Description")
  - [ ] Push the current branch. (git push origin <branch-name>)
  - [ ] (If applicable) Create/Review Pull Request.
- [ ] Update Persistent Notes: Add any new follow-up items to the external notes doc (if used).
- [ ] Generate Next SHIP: Ask me (CK) to create the draft for the next session.
- [ ] Review & Save: You (HD) review the next SHIP draft for accuracy and save it.
```

### 2.2 SHIP Usage Workflow

1. **Session End**: At the conclusion of a development session, the HD collaborates with the CK to generate the *next* SHIP document using the standard template (Sec 2.1). Key inputs are the current session's recap (Sec 4), emergent task status (Sec 5.0.1), Cursor summaries (Sec 8), and thoughts for the next session (Sec 5.7). The HD performs Git actions (commit, push) as per the checklist.

2. **Information Storage**: The SHIP document (`SHIP-M#-S#-Date.md`) is saved in a designated project folder (e.g., `/handoffs/`). Any persistent notes are updated in their separate location (e.g., Google Doc linked in [B0]).

3. **Session Start**: At the beginning of the next session:
   - The HD provides the latest SHIP document to the CK.
   - The CK reads the **"(CK START BLOCK)"** and the entire SHIP.
   - The CK confirms understanding and provides the summary of Section 5 as requested in the start block.
   - The HD and CK briefly review the Plan (Sec 5) to ensure alignment.

4. **Continuous Update (During Session)**: The CK maintains awareness of changes, decisions, and outputs during the session, using this context (plus Emergent Task Log updates and Cursor Summaries) to inform discussions and prepare for generating the *next* SHIP. Major deviations from the plan should be noted.

## 3. Role-Specific Responsibilities

### 3.1 Context Keeper (CK) Responsibilities

- **Knowledge Repository**: Maintain comprehensive understanding based *primarily on the current SHIP document*. Reference linked Bible sections ([BX.Y]) for deep details only when necessary or prompted.
- **Priming & Contextualization**: Understand and action the "(CK START BLOCK)" at the beginning of each session. Actively provide context relevant to the HD's non-developer background.
- **Session Continuity**: Use current SHIP (Sec 4 Recap) to understand previous state; Use Sec 5 (Plan) to guide current session context.
- **Decision & Task Tracking**: Note key decisions and manage the Emergent Task Log (Sec 5.0.1) during the session.
- **Bible Maintenance Support**: Note discrepancies between SHIP context and Bible sections; Flag areas needing Bible updates based on session outcomes.
- **SHIP Management**: Co-author the *next* SHIP document with the HD at the end of each session, incorporating all updates and planning elements.
- **Task Prep Support**: Assist HD in filling out the CURSOR AI HANDOFF TEMPLATE (Sec 7) by identifying relevant context (files, Bible refs) from the SHIP and Bible.

### 3.2 Human Developer (HD) Responsibilities

- **Leadership**: Define session goals (Sec 5.1), guide development direction, make final decisions. Acknowledge reliance on AI due to non-dev background.
- **Quality Control**: **Validate** AI (CG) output against requirements, mockups, user stories, and functional tests. Review implementation summaries (Sec 8).
- **Integration & Environment**: Feed prompts (derived from Sec 7) to CG, integrate generated code, perform manual testing, manage project environment, perform Git actions.
- **Problem Solving**: Work with CK/CG to address challenges using Debugging Strategy (Sec 6); Adapt plan if needed.
- **Context Provision**: Provide necessary context *not* already in SHIP (e.g., specific runtime observations, visual clarifications).
- **Task Prioritization**: Define the task list and order in the SHIP Plan (Sec 5.3).
- **SHIP Generation Leadership**: Initiate and guide the creation of the next SHIP with CK, ensuring accuracy.

### 3.3 Code Generator (CG - Cursor AI) Responsibilities

- **Code Creation**: Generate implementation code based on specific, structured prompts (Handoffs from SHIP Sec 7).
- **Best Practices Adherence**: Follow project standards ([B2.2], [B2.3], [B2.5]), style guides ([B3.8]), and instructions within the Handoff.
- **Problem Analysis & Alternatives**: Analyze technical challenges within task scope; propose solutions or alternative approaches if requested.
- **Implementation Summary**: Provide a concise summary of work done using the **CURSOR AI IMPLEMENTATION SUMMARY TEMPLATE (Sec 8)** *when requested in the Handoff*.
- **Debugging Assistance**: Help debug based on provided error messages/logs following Debugging Strategy (Sec 6) when prompted by HD.

## 4. Practical Implementation

### 4.1 Session Initialization Sequence (Revised)

1. **Provide SHIP**: HD gives the latest SHIP document to CK.
2. **CK Reads & Primes**: CK processes the entire SHIP, paying special attention to the "(CK START BLOCK)".
3. **CK Confirms & Summarizes**: CK confirms understanding of role/HD context and summarizes the Plan (Section 5) as requested.
4. **HD/CK Align**: HD & CK briefly discuss the summarized plan to ensure shared understanding.
5. **Environment Check**: HD ensures local dev environment, emulators, etc., are ready.
6. **First Task Prep**: HD & CK prepare the first Cursor AI Handoff (Sec 7) based on Task 1 in Sec 5.3.

### 4.2 Context Management Strategies

- **SHIP is Primary**: Rely **heavily** on the SHIP for session-to-session context continuity. Avoid relying on chat history alone.
- **Bible for Depth**: Use `[BX.Y]` references in SHIP to point to detailed rules/specs. The Bible Table of Contents ([B0]) is the entry point.
- **Progressive Summarization (in SHIP)**: Section 2.4 (History) should be updated concisely over time. Old session details (Sec 2.3) naturally fade.
- **AI_CONTEXT Logs:** Use `logger.ai_context()` ([B4.4]) for crucial runtime state snapshots when needed for debugging complex issues.
- **Decision Log:** Use [B7.3] for major, *persistent* architectural or strategic decisions not suitable for session recaps alone.
- **Persistent Notes:** Use the external document (linked in [B0] or similar) for tracking minor bugs, tech debt, and follow-up items identified during sessions (Ref: SHIP Checklist).

## 5. Development Session Types

### 5.1 Feature Development Sessions
- **SHIP Emphasis**: Clear feature specs (objectives, steps in Sec 5.3) and integration points (relevant files).

### 5.2 Bug Fix Sessions
- **SHIP Emphasis**: Detailed description of the issue (recap in Sec 4, objective in Sec 5.3), reproduction steps (if known), verification steps.

### 5.3 Refactoring Sessions
- **SHIP Emphasis**: Rationale for refactoring (goal in Sec 5.1), specific areas/patterns to change (Sec 5.3), testing approach.

### 5.4 Design Sessions
- **SHIP Emphasis**: Design problem/goal (Sec 5.1), options considered (Sec 4 if prior discussion), documented decisions (Sec 4 of *next* SHIP or [B7.3]).

## 6. AI Tool Integration

### 6.1 Claude Integration (Context Keeper)
- **Best Practices**:
  - **Provide SHIP**: Always start by providing the latest SHIP.
  - **Structured Communication**: Use clear requests, reference SHIP sections.
  - **Acknowledge HD Context**: CK should tailor explanations and support appropriately.
  - **Regular Updates**: Inform CK of task completion or major changes during the session.

- **Conversation Management**:
  - Focus on the current SHIP context.
  - Use Bible references ([BX.Y]) for deeper dives.
  - Explicitly confirm task status ("CK, mark Task 1 as done").

### 6.2 Cursor AI Integration (Code Generator)
- **Best Practices**:
  - **Use Handoff Template**: Provide context via the structured SHIP Section 7 template.
  - **Include `@files`/`@symbols`**: Help Cursor locate relevant code.
  - **Reference Bible**: Include relevant standard/logic refs ([BX.Y]).
  - **Request Summary**: The template now includes this request explicitly.

- **Code Generation Guidance**: *(Remains the same - specify files, interfaces, imports, etc.)*

### 6.3 Context Window Management
*(Remains the same - Prioritize SHIP, use Bible refs, structured info, progressive detail.)*

## 7. Continuous Improvement

### 7.1 Session Retrospectives
*(Remains the same - Review effectiveness, identify improvements, update docs if needed.)*

### 7.2 SHIP Template Evolution
- The template presented in Section 2.1 is the **current standard**, resulting from iterative refinement (including the integration of CK priming and Git steps). Future adjustments should follow the retrospective process.

## 8. Conclusion

The KarmaCash AI workflow, centered around the **standard SHIP template documented in Section 2.1**, provides a robust and optimized approach for collaboration between a non-developer HD and AI assistants (CK, CG). By integrating CK priming, clarifying roles, standardizing handoffs (including summary requests), and incorporating Git practices, this workflow aims to maximize efficiency, maintain context effectively, and ensure project consistency and quality. Reference this document ([B7.1]) for operational details.