#!/bin/bash

# MCP Server Startup Script for Background Agents
# SECURE VERSION - Uses environment variables only

echo "🚀 Starting MCP Servers for KarmaCash Background Agents..."
echo "=================================================="

# Check for required environment variables
if [ -z "$SERVICE_ACCOUNT_KEY_PATH" ]; then
    echo "❌ SERVICE_ACCOUNT_KEY_PATH environment variable not set"
    echo "   Set it to: /Users/benoitarchambault/Documents/firebase credential_Karmacash/karmacash-6e8f5-firebase-adminsdk-fbsvc-c1e711941b.json"
    exit 1
fi

if [ -z "$FIREBASE_STORAGE_BUCKET" ]; then
    echo "❌ FIREBASE_STORAGE_BUCKET environment variable not set"
    echo "   Set it to: karmacash-6e8f5.firebasestorage.app"
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY environment variable not set"
    echo "   Set it to your Anthropic API key starting with sk-ant-api03-"
    exit 1
fi

# Navigate to project root
cd /Users/benoitarchambault/Desktop/KarmaCash

echo "📁 Current directory: $(pwd)"
echo "🔧 Environment variables loaded from system"

# Test Firebase credentials
if [ -f "$SERVICE_ACCOUNT_KEY_PATH" ]; then
    echo "✅ Firebase credentials found"
else
    echo "❌ Firebase credentials missing at: $SERVICE_ACCOUNT_KEY_PATH"
    exit 1
fi

# Test custom Firebase MCP
if [ -f "custom-firebase-mcp/enhanced-index-fixed.cjs" ]; then
    echo "✅ Custom Firebase MCP found"
else
    echo "❌ Custom Firebase MCP missing"
    exit 1
fi

echo ""
echo "🔄 Starting MCP Servers..."
echo "=========================="

# Start Firebase MCP in background
echo "📊 Starting Firebase MCP server..."
node custom-firebase-mcp/enhanced-index-fixed.cjs &
FIREBASE_PID=$!
echo "   └─ PID: $FIREBASE_PID"

# Wait a moment for startup
sleep 2

# Start TaskMaster MCP in background  
echo "📋 Starting TaskMaster MCP server..."
npx -y --package=task-master-ai task-master-ai &
TASKMASTER_PID=$!
echo "   └─ PID: $TASKMASTER_PID"

# Wait a moment for startup
sleep 2

# Start Browser Tools MCP in background
echo "🌐 Starting Browser Tools MCP server..."
npx -y @agentdeskai/browser-tools-mcp@latest &
BROWSER_PID=$!
echo "   └─ PID: $BROWSER_PID"

echo ""
echo "✅ All MCP servers started!"
echo "=========================="
echo "Firebase MCP:     PID $FIREBASE_PID"
echo "TaskMaster MCP:   PID $TASKMASTER_PID"
echo "Browser Tools:    PID $BROWSER_PID"
echo ""
echo "🔍 To test connectivity, run:"
echo "   node test-mcp-connectivity.js"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $FIREBASE_PID $TASKMASTER_PID $BROWSER_PID"
echo ""
echo "📝 Servers will run until manually stopped or terminal closed."

# Keep script running to maintain background processes
echo "💡 Press Ctrl+C to stop all MCP servers"
wait
