#!/bin/bash

# MCP Server Information Script
# Note: MCP servers are managed by Claude Desktop and cannot be manually stopped

echo "ℹ️  MCP Server Information"
echo "========================="
echo ""
echo "⚠️  IMPORTANT: MCP servers are child processes of Claude Desktop"
echo "   They cannot be stopped independently without closing Claude Desktop."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Show current MCP server status"
echo "2) Close Claude Desktop (this will stop all MCP servers)"
echo "3) Clean up old log files"
echo "4) Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        ./scripts/verify-mcp-setup.sh
        ;;
    2)
        echo ""
        if pgrep -x "Claude" > /dev/null; then
            echo "🛑 Closing Claude Desktop..."
            osascript -e 'quit app "Claude"'
            sleep 2
            echo -e "${GREEN}✅ Claude Desktop closed${NC}"
            echo "   All MCP servers have been stopped."
        else
            echo -e "${YELLOW}Claude Desktop is not running${NC}"
        fi
        ;;
    3)
        echo ""
        echo "🧹 Cleaning up old files..."
        if [ -d ~/Desktop/KarmaCash/logs/mcp ]; then
            # Clean up old log files
            rm -f ~/Desktop/KarmaCash/logs/mcp/*.log
            rm -f ~/Desktop/KarmaCash/logs/mcp/*.pid
            rm -f ~/Desktop/KarmaCash/logs/mcp/*_launcher.sh
            echo -e "${GREEN}✅ Cleaned up log directory${NC}"
        else
            echo "No log directory found"
        fi
        ;;
    4)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        ;;
esac

echo ""
echo "💡 Tips:"
echo "• MCP servers start automatically when Claude Desktop launches"
echo "• Use ./scripts/mcp-server-manager.sh for detailed management"
echo "• Check ~/Library/Application Support/Claude/claude_desktop_config.json for configuration"
echo ""