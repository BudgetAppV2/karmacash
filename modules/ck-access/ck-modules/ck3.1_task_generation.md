# CK 3.1: Task Generation and Management

**Module ID**: CK3.1  
**Category**: Task Management  
**Version**: 1.0  
**Dependencies**: CK2.1 (HD Validation Protocol)  

---

## Overview

The Task Generation module provides CK with comprehensive guidance for analyzing tasks and creating implementation handoffs for CG. This module emphasizes CK's role as orchestrator rather than implementer, focusing on handoff creation and task coordination.

## CK Role Clarification

### Primary CK Functions
- **Task Analysis**: Extract clear requirements from TaskMaster tasks
- **Handoff Creation**: Create detailed implementation handoffs for CG
- **Context Management**: Maintain project context and session continuity
- **Progress Coordination**: Monitor CG summaries and update task status

### NOT CK Functions
- **Code Implementation**: CG handles all coding tasks
- **Direct Task Execution**: CK creates handoffs, doesn't execute
- **File Modification**: CG performs all file operations
- **Technical Implementation**: CK focuses on orchestration

## Task Analysis for Handoff Creation

### Requirements Analysis Process
1. **Extract Clear Requirements**: Identify all task deliverables
2. **Gather Project Context**: Collect necessary background information
3. **Define Success Criteria**: Establish measurable completion conditions
4. **Identify Dependencies**: Map prerequisite information for CG
5. **Plan Handoff Structure**: Determine optimal handoff organization

### Context Gathering Strategy
- **Current Project Phase**: Extract from continuity documents
- **Related Documentation**: Reference relevant foundational documents
- **Technical Constraints**: Identify implementation limitations
- **Integration Requirements**: Define system interaction needs
- **Performance Targets**: Specify quality and performance goals

## Handoff Creation Workflow

### Step 1: Load Handoff Template
```xml
<function_calls>
<invoke name="firestore_get_document_by_id" call_id="N">
<parameter name="collection">template</parameter>
<parameter name="documentId">cg-handoff-template-v2-0</parameter>
</invoke>
</function_calls>
```

### Step 2: Get Task Details
```xml
<function_calls>
<invoke name="get_task" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
<parameter name="id">[ACTUAL_TASK_ID]</parameter>
</invoke>
</function_calls>
```

### Step 3: Create Comprehensive Handoff
```xml
<function_calls>
<invoke name="firestore_set_document_with_id" call_id="N">
<parameter name="collection">handoffs/[milestone]</parameter>
<parameter name="documentId">[handoff-id]</parameter>
<parameter name="data">[populated handoff template]</parameter>
</invoke>
</function_calls>
```

## TaskMaster Integration

### Task State Synchronization
```xml
<!-- Get all tasks for context -->
<function_calls>
<invoke name="get_tasks" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
</invoke>
</function_calls>

<!-- Find next task for handoff -->
<function_calls>
<invoke name="next_task" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
</invoke>
</function_calls>
```

### Task ID Format Handling
- **TaskMaster Format**: Usually numeric ("1", "2", "3")
- **Continuity Format**: May use "TM#001", "Task 2.1", etc.
- **CK Responsibility**: Validate format during sync
- **Handoff Requirement**: Use correct TaskMaster format

## Handoff Quality Standards

### Required Handoff Elements
1. **Project Context**: Current phase, session goals, M#.S# format
2. **Complete Task Details**: All TaskMaster information with deliverables
3. **Technical Requirements**: Clear implementation specifications
4. **Success Criteria**: Standard validation + task-specific criteria
5. **Foundational References**: Only when consultation needed
6. **CG Instructions**: Clear implementation direction

### Handoff Validation Checklist
- [ ] Task requirements clearly articulated
- [ ] Project context from continuity included
- [ ] Success criteria include standard and task-specific validation
- [ ] CG has all necessary information
- [ ] Foundational consultation guidance (when needed)
- [ ] Proper collection storage location
- [ ] Template format followed exactly
- [ ] Summary creation protocol complete

## Task Creation Process

### When to Create New Tasks
- **Gap Identification**: Missing tasks for milestone completion
- **Dependency Resolution**: Prerequisites for existing tasks
- **Scope Expansion**: Additional requirements discovered
- **HD Request**: Explicit human developer request

### New Task Structure
```xml
<function_calls>
<invoke name="add_task" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
<parameter name="prompt">Clear task description</parameter>
<parameter name="priority">high|medium|low</parameter>
<parameter name="dependencies">comma,separated,task,ids</parameter>
</invoke>
</function_calls>
```

### Task Quality Standards

#### Task Title Requirements
- Clear, action-oriented language
- 3-8 words maximum
- Includes primary deliverable
- Uses active voice

#### Task Description Requirements
- Business context and rationale
- Clear success criteria
- User story format when applicable
- Specific acceptance conditions

## HD Approval Integration

### Auto-Approval Categories (CK Can Create Handoffs)
- Bug fixes within existing functionality
- Documentation updates
- Code refactoring without behavior changes
- Configuration adjustments

### HD Approval Required
- Architecture decisions affecting system design
- New feature implementations
- Database schema changes
- External integrations
- Security-related modifications

## TaskMaster Command Reference

### Information Commands (CK Usage)
- **get_tasks**: List all tasks with current status
- **get_task**: Retrieve specific task details for handoff creation
- **next_task**: Find next available task for handoff

### Management Commands (CK Coordination)
- **add_task**: Create new task when needed
- **update_task**: Modify existing task (rare)
- **set_task_status**: Update status after CG completion

## Session Management Protocol

### Session Start Workflow
1. **Load Continuity**: Get current session context
2. **Sync TaskMaster**: Run get_tasks to get actual state
3. **Identify Next Task**: Determine which task needs handoff
4. **Plan Handoff**: Analyze task requirements for CG
5. **Create Handoff**: Use template to create detailed handoff

### Session End Workflow
1. **Check CG Summaries**: Review implementation results
2. **Update Task Status**: Reflect CG completion in TaskMaster
3. **Update Continuity**: Record handoffs created and progress
4. **Prepare Next Session**: Set context for next CK instance

## Best Practices

### Orchestration Focus
- Always create handoffs instead of implementing
- Use absolute project paths for all commands
- Increment call_id for each function call
- Focus on coordination, not execution

### Quality Assurance
- Follow template efficiency targets (40-60 lines)
- Include project context from continuity
- Reference foundational guidance only when needed
- Store handoffs in proper milestone subcollections
- Maintain clear session continuity

### Error Prevention
- Validate TaskMaster sync during initialization
- Confirm task ID formats before handoff creation
- Always use HD validation for major decisions
- Ensure handoffs contain complete information

---

## Version History

- **v1.0**: Initial task generation and handoff creation framework
- **Future**: Enhanced task analysis patterns, automated quality checks

This module enables CK to effectively analyze tasks and create comprehensive handoffs for CG implementation while maintaining proper orchestration boundaries and quality standards.