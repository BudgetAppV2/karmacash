# CK3.1: Task Generation (Enhanced with PRD Methodology)

## CK Role: Orchestrator NOT Implementer
**CK creates handoffs for CG. CK does NOT implement code or execute tasks directly.**

## Task Analysis for Handoffs
1. **Extract Requirements**: Identify clear deliverables from TaskMaster
2. **Gather Context**: Collect project phase, session goals, technical constraints
3. **Define Success**: Establish measurable completion criteria
4. **Plan Handoff**: Structure implementation guidance for CG

## Enhanced Task Generation: Session-Scoped PRD Methodology
**Proven method for creating properly scoped TaskMaster tasks:**

### When to Use PRD Methodology
- **Complex projects** requiring multiple structured tasks
- **Milestone objectives** needing systematic breakdown
- **Process optimization** projects with documentation focus
- **System implementations** requiring coordinated dependencies

### TaskMaster Integration: Parse-PRD Command
**Convert PRD to structured tasks:**
```xml
<function_calls>
<invoke name="parse_prd" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
<parameter name="input">.taskmaster/docs/prd.txt</parameter>
<parameter name="numTasks">8</parameter>
<parameter name="output">.taskmaster/tasks/tasks.json</parameter>
<parameter name="force">true</parameter>
</invoke>
</function_calls>
```

### CARE Framework for Task Scoping
**Context + Ask + Rules + Examples prevents over-engineering:**

**Context**: Describe current situation and project needs
**Ask**: Request specific, focused deliverables
**Rules**: Apply explicit constraints to prevent scope creep
- NO performance optimization unless essential
- NO complex error handling for documentation work
- NO testing frameworks for simple implementations
- Time limit: 1-2 hours maximum per task

**Examples**: Reference successful similar tasks for scoping model
### Task Quality Patterns (from Memory Graph)
**Proven successful patterns:**
- **Foundation tasks**: Complexity 3-4, high priority, enable subsequent work
- **Implementation tasks**: Complexity 4-7, focused deliverables
- **Integration tasks**: Complexity 5-6, connect components
- **Optimization tasks**: Complexity 6-8, enhancement and polish

**Dependency Chains**: Linear progression with parallel tracks
**Session Boundaries**: 3-4 tasks per CG implementation session
**Time Constraints**: All tasks scoped for 1-2 hour implementation windows

## Standard TaskMaster Integration
```xml
<!-- Get task details -->
<function_calls>
<invoke name="get_task" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
<parameter name="id">[task_id]</parameter>
</invoke>
</function_calls>

<!-- Update status after CG completion -->
<function_calls>
<invoke name="set_task_status" call_id="N">
<parameter name="projectRoot">/absolute/project/path</parameter>
<parameter name="id">[task_id]</parameter>
<parameter name="status">done</parameter>
</invoke>
</function_calls>
```

## Handoff Creation Workflow
1. **Load Template**: Get enhanced handoff template
2. **Extract M{X}.S{Y}**: Use current continuity prefix
3. **Create Handoff**: Populate with task details, context, success criteria
4. **HD Validation**: Present in artifact, request approval
5. **Store**: Use correct collection path with dynamic naming

## Required Handoff Elements
- Project context (current phase, session goals)
- Complete task details with deliverables
- Technical requirements and specifications
- Success criteria (standard + task-specific)
- Foundational references (only when needed)
- Clear CG implementation instructions

## Dynamic Naming Pattern
**Extract prefix from continuity**: `M{X}.S{Y}_CK_Cont` → use `M{X}.S{Y}` for all handoffs
**Handoff Path**: `handoffs/M{milestone}/items/M{X}.S{Y}_task_{id}_{description}`