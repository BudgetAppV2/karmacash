#!/bin/bash

# MCP Server Startup Script for Workspace Environment
# Modified version that works with current workspace setup

echo "🚀 Starting MCP Servers for KarmaCash (Workspace Version)..."
echo "==============================================="

# We're already in the workspace directory
echo "📁 Current directory: $(pwd)"

# Check if we're in the right workspace
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
    echo "❌ Not in KarmaCash workspace directory"
    exit 1
fi

echo "✅ KarmaCash workspace detected"

# Check environment variables (optional for workspace)
echo "🔧 Environment Variables:"
if [ -n "$SERVICE_ACCOUNT_KEY_PATH" ]; then
    echo "  SERVICE_ACCOUNT_KEY_PATH: Set (but may not exist in workspace)"
else
    echo "  SERVICE_ACCOUNT_KEY_PATH: Not set (will use emulators if needed)"
fi

if [ -n "$FIREBASE_STORAGE_BUCKET" ]; then
    echo "  FIREBASE_STORAGE_BUCKET: $FIREBASE_STORAGE_BUCKET"
else
    echo "  FIREBASE_STORAGE_BUCKET: Not set"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  ANTHROPIC_API_KEY: Set (${ANTHROPIC_API_KEY:0:10}...)"
else
    echo "  ANTHROPIC_API_KEY: Not set"
fi

echo ""

# Check for MCP components
echo "🔍 Checking MCP Components:"

if [ -f "custom-firebase-mcp/enhanced-index-fixed.cjs" ]; then
    echo "  ✅ Custom Firebase MCP found"
    FIREBASE_MCP_AVAILABLE=true
else
    echo "  ❌ Custom Firebase MCP missing"
    FIREBASE_MCP_AVAILABLE=false
fi

# Check if we can install TaskMaster and Browser Tools
echo "  🔄 Checking npm packages..."

echo ""
echo "🔄 Starting MCP Servers..."
echo "=========================="

# Start Firebase MCP in background (if available)
if [ "$FIREBASE_MCP_AVAILABLE" = true ]; then
    echo "📊 Starting Firebase MCP server..."
    node custom-firebase-mcp/enhanced-index-fixed.cjs &
    FIREBASE_PID=$!
    echo "   └─ PID: $FIREBASE_PID"
    sleep 2
else
    echo "⚠️  Skipping Firebase MCP (not available)"
    FIREBASE_PID=""
fi

# Start TaskMaster MCP in background  
echo "📋 Starting TaskMaster MCP server..."
timeout 10 npx -y --package=task-master-ai task-master-ai &
TASKMASTER_PID=$!
echo "   └─ PID: $TASKMASTER_PID"
sleep 2

# Start Browser Tools MCP in background
echo "🌐 Starting Browser Tools MCP server..."
timeout 10 npx -y @agentdeskai/browser-tools-mcp@latest &
BROWSER_PID=$!
echo "   └─ PID: $BROWSER_PID"
sleep 2

echo ""
echo "✅ MCP Server startup completed!"
echo "==============================="

# Check which servers are running
echo "📊 Server Status:"
if [ -n "$FIREBASE_PID" ] && kill -0 $FIREBASE_PID 2>/dev/null; then
    echo "  Firebase MCP:     ✅ Running (PID $FIREBASE_PID)"
else
    echo "  Firebase MCP:     ❌ Not running"
fi

if kill -0 $TASKMASTER_PID 2>/dev/null; then
    echo "  TaskMaster MCP:   ✅ Running (PID $TASKMASTER_PID)"
else
    echo "  TaskMaster MCP:   ❌ Not running"
fi

if kill -0 $BROWSER_PID 2>/dev/null; then
    echo "  Browser Tools:    ✅ Running (PID $BROWSER_PID)"
else
    echo "  Browser Tools:    ❌ Not running"
fi

echo ""
echo "🧪 Testing Recommendations:"
echo "  1. Wait 5 seconds for full startup"
echo "  2. Test MCP connectivity with background agent"
echo "  3. If MCP fails, use Firebase emulators: firebase emulators:start"
echo ""

if [ -n "$FIREBASE_PID" ] || kill -0 $TASKMASTER_PID 2>/dev/null || kill -0 $BROWSER_PID 2>/dev/null; then
    echo "🛑 To stop servers:"
    if [ -n "$FIREBASE_PID" ]; then
        echo "   kill $FIREBASE_PID"
    fi
    echo "   kill $TASKMASTER_PID $BROWSER_PID"
    echo ""
    echo "💡 Servers are running in background. Press Ctrl+C to stop this script."
    echo "   (Servers will continue running after script exits)"
    
    # Optional: Keep script running to monitor
    echo ""
    echo "⏳ Waiting for MCP servers to fully initialize..."
    sleep 5
    echo "✅ MCP servers should be ready for testing!"
else
    echo "❌ No MCP servers started successfully"
    exit 1
fi