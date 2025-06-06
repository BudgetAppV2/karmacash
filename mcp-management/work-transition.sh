#!/bin/bash

# Work Transition Helper
# Safely stop/start development environment when moving between locations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

case "${1:-}" in
    "leaving"|"stop")
        echo -e "${BLUE}🏠 Preparing to leave - stopping development services...${NC}"
        echo ""
        ./dev-launcher.sh stop
        echo ""
        echo -e "${GREEN}✅ Safe to close laptop and travel!${NC}"
        echo -e "${YELLOW}💡 MCP servers left running (they'll reconnect automatically)${NC}"
        ;;
    
    "arriving"|"start")
        echo -e "${BLUE}🏢 Arrived at work - starting development environment...${NC}"
        echo ""
        ./dev-launcher.sh start
        echo ""
        echo -e "${GREEN}✅ Development environment ready!${NC}"
        echo ""
        echo -e "${BLUE}Access URLs:${NC}"
        echo "  - Your App: http://localhost:5173"
        echo "  - Firebase UI: http://localhost:4055"
        ;;
    
    "status")
        echo -e "${BLUE}📊 Current Status${NC}"
        echo "=================="
        echo ""
        echo -e "${BLUE}Development Services:${NC}"
        ./dev-launcher.sh status
        echo ""
        echo -e "${BLUE}MCP Servers:${NC}"
        ./auto-mcp-launcher.sh --status
        ;;
    
    *)
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Work Transition Helper"
        echo ""
        echo "Commands:"
        echo "  leaving   Stop development services before travel"
        echo "  arriving  Start development services after arrival"
        echo "  status    Show status of all services"
        echo ""
        echo "Examples:"
        echo "  $0 leaving    # Before closing laptop"
        echo "  $0 arriving   # When you arrive at work"
        echo "  $0 status     # Check what's running"
        ;;
esac