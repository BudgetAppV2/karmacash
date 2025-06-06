# 🚀 MCP Management Tools - Working Versions

This folder contains the **proven working versions** of MCP server management tools for the KarmaCash project.

## 📊 **Current Working Configuration (8/8 Servers)**

### **Core MCP Servers:**
1. ✅ **TaskMaster AI** - Task management and AI workflows
2. ✅ **Original Firebase MCP** - Standard Firebase operations (`@gannonh/firebase-mcp`)
3. ✅ **Custom Firebase MCP** - Enhanced Bible Access Module (`enhanced-index-fixed.cjs`)
4. ✅ **Context7** - Documentation and context management
5. ✅ **Desktop Commander** - Desktop automation tools
6. ✅ **Memory Server** - Persistent memory for conversations

### **Browser Tools (Working Setup):**
7. ✅ **Browser Tools Server** - Backend automation (`@agentdeskai/browser-tools-server@latest`)
8. ✅ **Browser Tools MCP** - MCP interface (`@agentdeskai/browser-tools-mcp@1.2.0`) ⚠️ **VERSION CRITICAL**

## 🛠️ **Management Scripts**

### **1. auto-mcp-launcher.sh**
**Automated MCP server launcher with intelligent monitoring**

**Features:**
- ✅ Checks if servers are running before launching
- ✅ Launches only servers that aren't running
- ✅ Supports daemon mode for continuous monitoring  
- ✅ Environment variable setup (Firebase, Anthropic API)
- ✅ PID tracking and log management
- ✅ Cleanup of stale processes

**Usage:**
```bash
# Check and launch servers once
./auto-mcp-launcher.sh --check

# Show current status
./auto-mcp-launcher.sh --status

# Run as daemon (check every 5 minutes)
./auto-mcp-launcher.sh --daemon

# Clean up stale processes
./auto-mcp-launcher.sh --cleanup
```

### **2. mcp-health-monitor.sh**
**Advanced health monitoring and recovery system**

**Features:**
- ✅ Memory usage monitoring (alerts >512MB)
- ✅ CPU usage monitoring (alerts >80%)
- ✅ Process responsiveness checks
- ✅ Automatic restart of failed servers
- ✅ Restart attempt limits (max 3 attempts)
- ✅ Health statistics and reporting

**Usage:**
```bash
# Run health check once
./mcp-health-monitor.sh --check

# Show health report
./mcp-health-monitor.sh --report

# Run health monitoring daemon
./mcp-health-monitor.sh --daemon

# Clear health logs
./mcp-health-monitor.sh --clear-logs
```

## 🎯 **Critical Browser Tools Configuration**

### **⚠️ VERSION REQUIREMENTS:**
- **Browser Tools Server**: `@agentdeskai/browser-tools-server@latest` ✅
- **Browser Tools MCP**: `@agentdeskai/browser-tools-mcp@1.2.0` ⚠️ **MUST USE 1.2.0**

### **🚨 Important Notes:**
1. **Version 1.2.0 ONLY**: Do NOT use `@latest` for browser-tools-mcp (1.2.1+ have MCP protocol violations)
2. **Launch Order**: Browser tools server MUST start before browser tools MCP
3. **External Server**: Browser tools server runs outside Claude Desktop
4. **Port 3025**: Browser tools server uses port 3025 for communication

## 📋 **Claude Desktop Configuration**

### **Working claude_desktop_config.json:**
```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key"
      }
    },
    "firebase-original": {
      "command": "npx",
      "args": ["-y", "@gannonh/firebase-mcp"],
      "env": {
        "SERVICE_ACCOUNT_KEY_PATH": "path-to-service-account.json",
        "FIREBASE_STORAGE_BUCKET": "your-bucket.firebasestorage.app"
      }
    },
    "firebase": {
      "command": "node",
      "args": ["path/to/custom-firebase-mcp/enhanced-index-fixed.cjs"],
      "env": {
        "SERVICE_ACCOUNT_KEY_PATH": "path-to-service-account.json",
        "FIREBASE_STORAGE_BUCKET": "your-bucket.firebasestorage.app"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "browser-tools": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@1.2.0"]
    }
  }
}
```

## 🚀 **Quick Setup for Future CGs**

### **1. Initial Setup:**
```bash
# Copy management scripts to project
cp mcp-management/* scripts/

# Make scripts executable
chmod +x scripts/auto-mcp-launcher.sh
chmod +x scripts/mcp-health-monitor.sh
```

### **2. Start Browser Tools (Required Order):**
```bash
# 1. Start browser tools server first
npx @agentdeskai/browser-tools-server@latest &

# 2. Wait for server to initialize
sleep 5

# 3. Configure Claude Desktop with version 1.2.0
# (Update claude_desktop_config.json as shown above)
```

### **3. Launch All MCP Servers:**
```bash
# Check and launch all servers
./scripts/auto-mcp-launcher.sh --check

# Verify all 8 servers are running
./scripts/auto-mcp-launcher.sh --status
```

### **4. Set Up Monitoring:**
```bash
# Start continuous monitoring daemon
./scripts/auto-mcp-launcher.sh --daemon &

# Start health monitoring
./scripts/mcp-health-monitor.sh --daemon &
```

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Browser Tools Not Working**: Ensure browser-tools-server is running on port 3025 first
2. **Claude Desktop Crashes**: Check you're using browser-tools-mcp@1.2.0 (not latest)
3. **JSON-RPC Errors**: Usually indicates version mismatch - revert to 1.2.0
4. **Servers Not Starting**: Check environment variables and file paths

### **Emergency Recovery:**
```bash
# Stop all problematic servers
pkill -f "browser-tools"

# Clean up
./scripts/auto-mcp-launcher.sh --cleanup

# Restart Claude Desktop
osascript -e 'quit app "Claude"' && sleep 3 && open -a "Claude"
```

## 📈 **Success Metrics**

✅ **Perfect Status**: 8/8 servers running  
✅ **Browser Tools**: Functional in Claude Desktop  
✅ **No Crashes**: Claude Desktop stable  
✅ **Auto-Recovery**: Failed servers restart automatically  
✅ **Monitoring**: Continuous health checks active  

---

**Last Updated**: Successfully configured and tested with all 8 MCP servers running including browser tools v1.2.0

**Status**: ✅ PRODUCTION READY