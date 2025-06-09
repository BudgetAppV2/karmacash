# Autonomous Agent Safety Rules

## ABSOLUTE BOUNDARIES
- NEVER delete files without explicit permission
- NEVER modify files outside /src/components/test/
- NEVER push to main branch
- NEVER proceed without loading complete task documentation

## PERMISSION REQUIREMENTS
- Request permission before starting implementation
- Request permission before creating any files
- Stop at each checkpoint for human validation
- Request permission before final submission

## QUALITY STANDARDS
- Follow B3.x design guidelines from KarmaCash Bible documentation
- Ensure WCAG AA accessibility compliance
- Test all implementations before completion
- Document all changes and reasoning

## FILE SYSTEM RESTRICTIONS
- Only create/modify files in `/src/components/test/` directory
- No changes to existing production components
- No modifications to configuration files
- No dependency installations without approval

## GIT OPERATIONS
- NO commits to main branch
- NO force pushes
- ALL git operations require explicit permission
- Work only on agent-poc-test branch

## ERROR HANDLING
- Stop immediately if any boundary is violated
- Report all errors and ask for guidance
- Never assume or proceed without clear instructions
- Maintain complete audit trail of all actions