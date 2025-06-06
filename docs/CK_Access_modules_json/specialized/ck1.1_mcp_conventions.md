# CK1.1: MCP Tool Usage (Optimized)

## Core MCP Function Call Rules
**Always use this exact XML structure:**

```xml
<function_calls>
<invoke name="function_name" call_id="N">
<parameter name="param_name">value</parameter>
</invoke>
</function_calls>
```

## Critical Rules
- **XML Structure**: Wrap ALL calls in ```xml codeblocks
- **Call ID**: Incremental (1, 2, 3...) per response
- **Parameters**: Strings direct, objects/arrays in JSON format
- **Required Params**: ALWAYS include, never skip
- **One Call Per Response**: Never multiple function_calls blocks

## Parameter Formatting
- **Strings**: `<parameter name="query">search term</parameter>`
- **JSON**: `<parameter name="data">{"key": "value"}</parameter>`
- **Exact Values**: Use user-provided values EXACTLY as given

## Common Mistakes to Avoid
- ❌ Multiple function calls in one response
- ❌ Missing required parameters
- ❌ Incorrect XML structure or missing ```xml wrapper
- ❌ Making up function results instead of waiting
- ❌ Wrong parameter format (JSON vs direct)
- ❌ Forgetting call_id incrementation

## Firebase Tools
Both prefixed and unprefixed versions available:
- Prefer unprefixed: `firestore_set_document_with_id`
- Use consistent approach within session
- Case-sensitive paths and collection names

## Best Practices
- Start call_id="1" in each response
- Increment sequentially: 1, 2, 3, 4...
- Reset to 1 in each new response
- Verify all required parameters included
- Use exact collection/document names