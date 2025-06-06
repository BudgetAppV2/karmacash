# CG MCP Initialization Guide

## Overview
The CG initialization process now includes MCP server health checks to ensure all required tools are available before implementation begins.

## Step 0: MCP Server Health Check

### Automated Check
During CG initialization, run:
```bash
/Users/benoitarchambault/Desktop/KarmaCash/scripts/cg-mcp-init.sh
```

This script will:
1. Check which MCP servers are running
2. Clean up any stale processes
3. Attempt automated launch (if tmux is installed)
4. Report health status: HEALTHY, WARNING, or CRITICAL

### Health Status Meanings

#### ✅ HEALTHY
- All 6 MCP servers are running
- Full tool availability
- Proceed with normal implementation

#### ⚠️ WARNING  
- 4-5 servers running
- Core functionality available
- Some tools may be limited
- Continue with caution

#### 🚨 CRITICAL
- Less than 4 servers running
- Major tool limitations
- Manual intervention required
- Block implementation until resolved

## MCP Server Launch Methods

### Option 1: Automated with tmux (Recommended)
```bash
# Install tmux first
brew install tmux

# Then run
/Users/benoitarchambault/Desktop/KarmaCash/scripts/launch-mcp-tmux.sh
```

### Option 2: Terminal Tabs (Manual)
```bash
/Users/benoitarchambault/Desktop/KarmaCash/scripts/launch-mcp-terminal.sh
```
This opens 6 Terminal tabs, each running a server.

### Option 3: Fully Manual
```bash
/Users/benoitarchambault/Desktop/KarmaCash/scripts/launch-mcp-manual.sh
```
Shows all commands to run manually.

## Required MCP Servers

1. **taskmaster-ai** - Task management and project state
2. **firebase-custom** - Enhanced Firebase operations  
3. **context7** - Context management
4. **desktop-commander** - File system operations
5. **memory** - Session memory and state
6. **browser-tools** - Browser debugging and monitoring

## Integration with CG Initialization

The complete CG initialization sequence is now:

```
0. MCP Server Health Check (cg-mcp-init.sh)
1. Get Current Continuity Pointer
2. Load Current Session Continuity
3. Load CG Protocol Essentials
4. Access Protocol Essentials Content
5. Load CG Priming
6. Comprehensive System Health Check
```

## Troubleshooting

### Servers Won't Start
- Check logs in `~/Desktop/KarmaCash/logs/mcp/`
- Ensure environment variables are set
- Try manual launch to see errors

### Claude Desktop Can't Connect
- Restart Claude Desktop after starting servers
- Check `claude_desktop_config.json` has correct server entries
- Verify no firewall blocking

### Stale Processes
- Run `/scripts/check-mcp-health.sh` to clean up
- Use `/scripts/stop-mcp-servers.sh` for full reset

## Best Practices

1. **Always check MCP health first** - Don't assume servers are running
2. **Document health status in summaries** - Include MCP status in implementation summaries
3. **Use tmux for reliability** - Servers persist even if Terminal closes
4. **Monitor during implementation** - Check if servers crash during work
5. **Clean up when done** - Stop servers to free resources

## Exit Codes

The `cg-mcp-init.sh` script returns:
- `0` - All servers running (HEALTHY)
- `1` - Some servers missing (WARNING)
- `2` - Critical failure (CRITICAL)

Use these in automated workflows to determine if implementation should proceed.