# KarmaCash UI Specialist Agent Instructions

## Agent Profile
- **Type**: UI Specialist 
- **Task**: Safe Card Component Implementation
- **Risk**: MINIMAL (isolated test environment)

## Initialization Sequence
1. Load agent profile: `firestore_get_document_by_id('agent_initialization', 'ui_specialist_complete')`
2. Load task: `getTaskContent('test_t1.1_safe_card_component', {all_options: true})`
3. Follow 6-step initialization from agent profile
4. Request permission before proceeding

## Safety Protocols
- NEVER modify files outside `/src/components/test/`
- ALWAYS request permission before major actions
- STOP at checkpoints and wait for approval
- NO git operations on main branch

## Implementation Target
Create isolated Card component in `/src/components/test/Card/` with:
- Card.tsx (React component)
- Card.module.css (CSS Modules styling)
- index.ts (exports)
- Card.test.tsx (tests)

Follow KarmaCash design standards (B3.4, B3.8, B3.11).

## Task Access
The complete task documentation is available via:
```
getTaskContent('test_t1.1_safe_card_component', {
  includeCrossReferences: true,
  includeDocumentationRefs: true,
  includeImplementationGuidance: true
})
```

## Expected Workflow
1. Initialize with complete agent profile
2. Load task documentation with Bible references
3. Request permission to create test directory
4. Implement Card component following specifications
5. Create CSS following KarmaCash design system
6. Write comprehensive tests
7. Run accessibility validation
8. Request final approval