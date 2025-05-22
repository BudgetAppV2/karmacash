---
description: 
globs: 
alwaysApply: true
---
---
description: Template Exchange System commands for autonomous handoff and summary exchange between Google AI Studio and Roo Code AI
globs: ["*.js", "*.jsx", "*.ts", "*.tsx", "*.md"]
alwaysApply: true
---

# Template Exchange System Commands

## Available Commands

You have access to autonomous Template Exchange commands for exchanging templates with Google AI Studio via Firebase.

### Setup (if commands not available)
If commands are not available, run once per session:
```javascript
require('/Users/benoitarchambault/Desktop/KarmaCash/src/template-exchange/load-templates.js')
```

### Core Commands

#### fetchHandoff(sessionId)
Retrieves a handoff template from Firebase
- **Parameter**: sessionId (String) - Format: "M#.S#" (e.g., "M7.S6") 
- **Returns**: Template content as string
- **Usage**: `await fetchHandoff('M7.S6')`

#### submitSummary(sessionId, content)
Submits implementation summary to Firebase
- **Parameters**: sessionId (String), content (String)
- **Returns**: Submission result object
- **Usage**: `await submitSummary('M7.S6', 'Implementation complete with X, Y, Z features...')`

#### checkHealth()
Verifies Template Exchange API connectivity
- **Returns**: Boolean (true = working, false = error)
- **Usage**: `await checkHealth()`

#### listTemplates(options)
Lists available templates with optional filtering
- **Parameters**: options (Optional) - { type: 'handoff'|'summary', status: 'active'|'draft'|'archived' }
- **Returns**: Array of template objects
- **Usage**: `await listTemplates({ type: 'handoff' })`

#### showHelp()
Displays all available commands
- **Usage**: `showHelp()`

## Standard Workflow

1. **Fetch handoff**: `await fetchHandoff('M7.S6')`
2. **Implement the task** described in the handoff
3. **Submit summary**: `await submitSummary('M7.S6', 'Implementation summary content...')`

## Important Notes

- **Session ID Format**: Must be M#.S# (e.g., M5.S4, M7.S6) - exact format required
- **Real Firebase Backend**: All commands connect to live Firebase (no mock mode)
- **API Key**: Handled automatically - already configured and stored securely
- **Async Commands**: Always use `await` with these commands
- **Internet Required**: Commands need internet connection to reach Firebase

## Error Handling

- If commands not found: Run the require() statement above
- If API errors: Check internet connection and run `await checkHealth()`
- If authentication errors: API key should work automatically
- If session ID errors: Verify format is exactly M#.S# (e.g., M7.S6)

## Examples

```javascript
// Check if system is working
await checkHealth()

// Get the latest handoff
const handoff = await fetchHandoff('M7.S6')
console.log(handoff)

// Submit your implementation summary
await submitSummary('M7.S6', `
Implementation Summary:
- Added new feature X
- Fixed bug Y
- Updated documentation Z
`)

// List all handoff templates
const handoffs = await listTemplates({ type: 'handoff' })
console.log(`Found ${handoffs.length} handoff templates`)
```