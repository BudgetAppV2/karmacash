#!/bin/bash

# Background Agent MCP Setup Script
# Creates mcp.json from template with environment variables

echo "🔧 Setting up MCP configuration for background agent..."

# Check if template exists
if [ ! -f ".cursor/mcp.template.json" ]; then
    echo "❌ mcp.template.json not found"
    exit 1
fi

# Check environment variables
if [ -z "$ANTHROPIC_API_KEY" ] || [ -z "$SERVICE_ACCOUNT_KEY_PATH" ] || [ -z "$FIREBASE_STORAGE_BUCKET" ]; then
    echo "❌ Missing environment variables"
    echo "Required: ANTHROPIC_API_KEY, SERVICE_ACCOUNT_KEY_PATH, FIREBASE_STORAGE_BUCKET"
    exit 1
fi

# Create mcp.json from template
echo "📋 Creating mcp.json from template..."
envsubst < .cursor/mcp.template.json > .cursor/mcp.json

echo "✅ MCP configuration ready for background agent"
echo "🚀 MCP tools should now be accessible"
