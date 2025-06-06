# CK 2.1: HD Validation Protocol

**Module ID**: CK2.1  
**Category**: Validation  
**Version**: 1.0  
**Dependencies**: None  

---

## Overview

The HD Validation Protocol module ensures proper HD consultation before proceeding with major workflow decisions. This module loads when CK reaches decision points requiring HD guidance and provides structured approaches for HD consultation and workflow validation.

## Core Validation Protocol

### When to Consult HD

- **After initialization completion** - Before proceeding with any actions
- **Before creating new sessions** - Never automatically create continuity documents  
- **Before session transitions** - HD decides milestone/session progression
- **When multiple options exist** - Let HD choose priorities and direction
- **Before major workflow changes** - Task generation, scope changes, etc.

### HD Consultation Protocol

#### Step 1: Present Context Summary
**Always provide HD with:**
- Current session status (M#.S#)
- Recent accomplishments (previous session summary)
- TaskMaster state (pending tasks, next task, completion status)
- Current priorities and focus areas
- Available next actions/options

#### Step 2: Ask for Direction
**Use phrases like:**
- "Based on this context, what would you like to focus on next?"
- "Should I create a handoff for [specific task]?"
- "Do you want to continue with [current objective] or adjust priorities?"
- "How would you like to proceed with the session?"
- "What's the priority for today's work?"

#### Step 3: Wait for HD Response
- **NEVER assume or proceed automatically**
- **NEVER create documents without explicit HD approval**
- **NEVER increment session numbers without HD direction**
- Wait for clear HD guidance before taking any action

#### Step 4: Confirm Understanding
- Repeat back HD's direction to ensure clarity
- Confirm specific actions before proceeding
- Ask for clarification if direction is unclear

## Session Transition Guidelines

### Current Session Updates
**Allowed with HD validation:**
- Update existing continuity with progress
- Update TaskMaster task statuses  
- Create handoffs for current session tasks
- Document session accomplishments

### New Session Creation
**REQUIRES explicit HD approval:**
- Creating new M#.S# continuity documents
- Updating continuity pointer to new session
- Incrementing session numbers
- Milestone transitions
- Major scope changes

### Decision Framework
**When HD says:**
- "Continue with current session" → Update existing continuity only
- "Move to next session" → Create new continuity + update pointer
- "Focus on [specific task]" → Create handoff for that task
- "Plan next phase" → Discuss options, don't create documents yet

## Workflow Integration Points

### After Initialization (Step 9)
```
**HD CONSULTATION CHECKPOINT**
Load hd_validation_protocol module and present context summary.
Ask HD for direction before proceeding with any actions.
```

### Before Document Creation
```
**HD VALIDATION REQUIRED**
Before creating ANY Firestore document:
1. Present content in artifact
2. Announce exact destination
3. Request HD confirmation
4. Wait for approval
```

### End of Session
```
**SESSION TRANSITION CHECKPOINT**
Load hd_validation_protocol module to discuss:
- Session completion status
- Next session planning
- Continuity document needs
- Priority adjustments
```

## Common Scenarios

### Scenario 1: Initialization Complete
**CK Action**: Present context, ask "What would you like to focus on next?"
**Wait for**: HD direction on immediate priorities
**Then**: Proceed with HD-approved action

### Scenario 2: Task Completed
**CK Action**: Update task status, present remaining work
**Ask**: "Should I continue with the next task or adjust focus?"
**Wait for**: HD decision on continuation vs. new priorities

### Scenario 3: Session Appears Complete
**CK Action**: Summarize accomplishments
**Ask**: "Should we continue in this session or plan for the next one?"
**Wait for**: HD decision on session transition

### Scenario 4: Multiple Options Available
**CK Action**: Present all available options clearly
**Ask**: "Which of these would you like to prioritize?"
**Wait for**: HD selection of preferred approach

## Quality Assurance

### HD Consultation Checklist
- [ ] Context clearly presented
- [ ] Multiple options offered when applicable
- [ ] HD direction explicitly requested
- [ ] CK waited for HD response
- [ ] HD direction confirmed and understood
- [ ] Actions aligned with HD priorities

### Session Management Checklist
- [ ] Session updates have HD validation
- [ ] New session creation has explicit HD approval
- [ ] Continuity pointer updates have HD confirmation
- [ ] Session numbering follows HD direction
- [ ] Milestone transitions approved by HD

## Error Prevention

### Never Do Without HD Approval
- Create new M#.S# continuity documents
- Update continuity pointer to new session
- Increment session or milestone numbers
- Make major scope or priority changes
- Assume next steps or priorities

### Always Ask HD When
- Multiple valid options exist
- Session completion status unclear
- Next priorities uncertain
- Major decisions required
- Workflow adjustments needed

## Integration with Existing Workflow

This module supplements but does not replace the existing HD validation protocol for Firestore documents. Both validation layers work together:

1. **HD Consultation Protocol** (this module) - For workflow direction and planning
2. **HD Validation Protocol** (existing) - For specific document creation approval

Both are required for complete HD validation coverage.

---

## Version History

- **v1.0**: Initial HD validation protocol with comprehensive workflow integration
- **Future**: Enhanced validation patterns, automated workflow detection

This module ensures proper HD consultation throughout the CK workflow, preventing unauthorized decisions and maintaining human oversight of all major workflow transitions.