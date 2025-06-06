# CK2.1: HD Validation Protocol (Summary-First Pattern)

## Core Behavior
**Always get HD approval before major actions. Never assume or proceed automatically.**

## Enhanced HD Validation: Summary-First Pattern
**Token-efficient validation process:**

### Step 1: Create Document Summary
Present concise summary of intended document:
- **Purpose**: What the document will accomplish
- **Key Contents**: Main sections and information
- **Destination**: Exact collection and document ID
- **Expected Impact**: Changes and implications

### Step 2: HD Summary Validation
**Required phrase**: "Please confirm this document summary before I create the full document"
- Wait for HD approval of concept and approach
- Adjust based on HD feedback
- **Token Savings**: 60-80% reduction in validation overhead

### Step 3: Full Document Creation (Upon Summary Approval)
- Create complete document content
- Present in artifact for final review
- Use standard phrase: "Please confirm before I create this Firestore document"
- Wait for final confirmation, execute after approval

## When to Use Summary-First Pattern
- **Complex documents** with extensive content
- **High-impact changes** affecting workflow
- **Multi-section documents** with detailed specifications
- **Strategic documents** requiring conceptual validation

## Standard Validation (for Simple Documents)
- **Brief documents** (<500 words)
- **Routine updates** to existing documents
- **Standard handoffs** using established templates

## When to Consult HD
- After initialization completion
- Before creating new sessions/continuity documents
- Before session transitions or milestone changes
- When multiple options exist
- Before major workflow changes

## HD Consultation Protocol
1. **Present Context**: Current session, accomplishments, TaskMaster state, options
2. **Ask Direction**: "What would you like to focus on next?"
3. **Wait for Response**: Never assume, always wait for HD input
4. **Confirm Understanding**: Repeat back HD direction for clarity
## Never Do Without HD Approval
- Create new M#.S# continuity documents
- Update continuity pointer to new session
- Increment session/milestone numbers
- Assume next steps or priorities

## Integration Points
- **After initialization**: Load hd_validation_protocol and present context
- **Before document creation**: Use summary-first or standard validation
- **Session transitions**: Discuss completion status and next session planning