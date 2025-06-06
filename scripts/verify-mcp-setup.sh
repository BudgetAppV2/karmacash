#!/bin/bash

# MCP Setup Verification Script
# Checks if MCP servers are properly configured and running with Claude Desktop

echo "🔍 MCP Setup Verification"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Claude Desktop is running
echo -n "1. Checking Claude Desktop... "
if pgrep -x "Claude" > /dev/null; then
    echo -e "${GREEN}Running ✓${NC}"
    claude_running=true
else
    echo -e "${RED}Not Running ✗${NC}"
    claude_running=false
fi

# Check configuration file
echo -n "2. Checking configuration file... "
config_file="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$config_file" ]; then
    echo -e "${GREEN}Found ✓${NC}"
    config_exists=true
else
    echo -e "${RED}Not Found ✗${NC}"
    config_exists=false
fi

# Validate JSON syntax
if [ "$config_exists" = true ]; then
    echo -n "3. Validating JSON syntax... "
    if command -v jq &> /dev/null; then
        if jq . "$config_file" > /dev/null 2>&1; then
            echo -e "${GREEN}Valid ✓${NC}"
            json_valid=true
        else
            echo -e "${RED}Invalid ✗${NC}"
            json_valid=false
            echo "   Error: $(jq . "$config_file" 2>&1 | head -1)"
        fi
    else
        echo -e "${YELLOW}jq not installed (can't validate)${NC}"
        json_valid=unknown
    fi
fi

# Check MCP servers if Claude is running
if [ "$claude_running" = true ] && [ "$json_valid" = true ]; then
    echo ""
    echo "4. Checking MCP server processes:"
    echo "   (Note: Servers may take 10-30s to start after Claude launches)"
    echo ""
    
    # Define expected servers and their process patterns
    declare -A servers=(
        ["TaskMaster AI"]="task-master-ai"
        ["Firebase Custom"]="enhanced-index-fixed.cjs"
        ["Context7"]="context7-mcp"
        ["Desktop Commander"]="desktop-commander"
        ["Memory Server"]="mcp-server-memory"
        ["Browser Tools"]="browser-tools-mcp"
    )
    
    running_count=0
    total_count=${#servers[@]}
    
    for name in "${!servers[@]}"; do
        pattern="${servers[$name]}"
        printf "   %-20s " "$name:"
        
        if pgrep -f "$pattern" > /dev/null 2>&1; then
            echo -e "${GREEN}Running ✓${NC}"
            ((running_count++))
        else
            echo -e "${RED}Not Running ✗${NC}"
        fi
    done
    
    echo ""
    echo "   Summary: $running_count/$total_count servers running"
fi

# Check environment variables from config
if [ "$json_valid" = true ] && command -v jq &> /dev/null; then
    echo ""
    echo "5. Checking required files:"
    
    # Check Firebase service account key
    firebase_key=$(jq -r '.mcpServers.firebase.env.SERVICE_ACCOUNT_KEY_PATH // empty' "$config_file")
    if [ -n "$firebase_key" ]; then
        echo -n "   Firebase key: "
        if [ -f "$firebase_key" ]; then
            echo -e "${GREEN}Found ✓${NC}"
        else
            echo -e "${RED}Not Found ✗${NC}"
            echo "     Expected at: $firebase_key"
        fi
    fi
    
    # Check custom Firebase script
    firebase_script=$(jq -r '.mcpServers.firebase.args[0] // empty' "$config_file")
    if [ -n "$firebase_script" ]; then
        echo -n "   Firebase script: "
        if [ -f "$firebase_script" ]; then
            echo -e "${GREEN}Found ✓${NC}"
        else
            echo -e "${RED}Not Found ✗${NC}"
            echo "     Expected at: $firebase_script"
        fi
    fi
fi

# Provide recommendations
echo ""
echo "📋 Recommendations:"
echo "=================="

if [ "$claude_running" = false ]; then
    echo "• Start Claude Desktop to use MCP servers"
    echo "  Run: open -a Claude"
elif [ "$config_exists" = false ]; then
    echo "• Configuration file is missing!"
    echo "  The file should be at: $config_file"
elif [ "$json_valid" = false ]; then
    echo "• Fix JSON syntax errors in configuration"
    echo "  Use 'jq' or an online JSON validator"
elif [ "$running_count" -lt "$total_count" ] 2>/dev/null; then
    echo "• Some servers aren't running. Try:"
    echo "  1. Wait 30 seconds (servers may still be starting)"
    echo "  2. Restart Claude Desktop"
    echo "  3. Check Console.app for error logs"
else
    echo -e "• ${GREEN}Everything looks good! ✓${NC}"
fi

echo ""
echo "For detailed management, run: ./scripts/mcp-server-manager.sh"
echo ""