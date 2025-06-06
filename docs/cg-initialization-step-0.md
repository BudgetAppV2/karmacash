# CG Initialization - Step 0: MCP Server Health Check

## For CG Implementation

When you (CG) initialize, add this as Step 0:

```xml
<!-- Step 0 - MCP Server Health Check -->
<function_calls>
<invoke name="execute_command" call_id="0">
<parameter name="command">/Users/benoitarchambault/Desktop/KarmaCash/scripts/cg-mcp-init.sh</parameter>
</invoke>
</function_calls>
```

## Interpreting Results

### Exit Code 0 (HEALTHY)
```
✅ MCP HEALTHY: All servers are running
```
- All 6 MCP servers operational
- Full tool availability
- Proceed with normal initialization

### Exit Code 1 (WARNING)
```
⚠️ MCP WARNING: Some servers not running
```
- 4-5 servers running
- Core tools available
- Document in health check which servers are missing
- Proceed with caution

### Exit Code 2 (CRITICAL)
```
🚨 MCP CRITICAL: No/few servers running
```
- Less than 4 servers running
- Major tool limitations
- Include in summary: "MCP servers not running - manual intervention required"
- Consider blocking implementation

## What the Script Does

1. **Checks Running Servers**
   - taskmaster-ai
   - firebase-custom
   - context7
   - desktop-commander
   - memory
   - browser-tools

2. **Cleans Stale Processes**
   - Removes processes older than 1 day
   - Cleans duplicate instances

3. **Attempts Auto-Launch** (if tmux installed)
   - Creates tmux session
   - Launches missing servers
   - Verifies startup

4. **Reports Status**
   - Server count
   - Health assessment
   - Recommendations

## Including in Health Check Summary

Add to your environment_health_check section:

```json
"mcp_server_status": {
  "check_timestamp": "[timestamp]",
  "servers_running": "[count]/6",
  "health_status": "HEALTHY|WARNING|CRITICAL",
  "missing_servers": ["list of not running servers"],
  "automated_launch": "success|failed|not_attempted",
  "manual_intervention_required": true|false
}
```

## Fallback Instructions

If CRITICAL status and automated launch fails:

1. Report in summary: "MCP servers require manual launch"
2. Specify which servers are missing
3. Include command: `/scripts/launch-mcp-terminal.sh`
4. Note: "HD intervention required for MCP server startup"