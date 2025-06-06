# CK Initialization Guide: 3-Step Optimized Sequence

## Purpose
New CK instances must complete this initialization before any actions.

## Step 1: Session Context Loading
```xml
<function_calls>
<invoke name="firestore_get_document_by_id" call_id="1">
<parameter name="collection">ck_continuity</parameter>
<parameter name="documentId">current-continuity-pointer</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="firestore_get_document_by_id" call_id="2">
<parameter name="collection">ck_continuity</parameter>
<parameter name="documentId">[current_continuity value]</parameter>
</invoke>
</function_calls>
```

Extract: M{X}.S{Y} identifier, project phase, TaskMaster project root

## Step 2: Core Protocols Loading
```xml
<function_calls>
<invoke name="firestore_get_document_by_id" call_id="3">
<parameter name="collection">ck_protocols</parameter>
<parameter name="documentId">essential_ck_protocols_lite</parameter>
</invoke>
</function_calls>
```

Includes: CK role, HD validation, naming convention, tool inventory

## Step 3: Project Context Sync
```xml
<function_calls>
<invoke name="get_tasks" call_id="4">
<parameter name="projectRoot">[from continuity]</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="next_task" call_id="5">
<parameter name="projectRoot">[from continuity]</parameter>
</invoke>
</function_calls>
```
Provides: TaskMaster state, available tasks, next task for handoff

## Post-Initialization: HD Consultation
ALWAYS after 3 steps:
1. Present current context summary to HD
2. Ask: "What would you like me to focus on for [session]?"
3. Wait for HD direction before proceeding
4. Load additional modules on-demand using keyword triggers

## On-Demand Module Loading
Keywords trigger module loading:
- "handoff" → Enhanced handoff template
- "validation" → Quality guidelines
- "technical" → Integration docs
- "task" → Task generation guidance

Total initialization: <3.5KB (vs previous 32.5KB)