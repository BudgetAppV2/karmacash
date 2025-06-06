#!/bin/bash

# Smart Dev Environment Launcher
# Checks what's running and only starts what's needed
# Prevents duplicate processes

set -eo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs/dev-services"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Services configuration
# Format: "name:process_pattern:port:start_command"
DEV_SERVICES=(
    "Vite Dev Server:vite:5173:npm run dev"
    "Firebase Emulators:firebase emulators:9099:npm run emulators"
)

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_DIR/dev-launcher.log"
}

# Function to check if a process is running
is_process_running() {
    local pattern="$1"
    pgrep -f "$pattern" > /dev/null 2>&1
}

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    lsof -i ":$port" > /dev/null 2>&1
}

# Function to get process PIDs
get_process_pids() {
    local pattern="$1"
    pgrep -f "$pattern" 2>/dev/null || echo ""
}

# Function to kill duplicate processes
kill_duplicates() {
    local pattern="$1"
    local service_name="$2"
    
    local pids=$(get_process_pids "$pattern")
    local pid_count=$(echo "$pids" | grep -c . || echo 0)
    
    if [ $pid_count -gt 1 ]; then
        echo -e "${YELLOW}⚠️  Found $pid_count instances of $service_name${NC}"
        log "WARN" "Found $pid_count instances of $service_name"
        
        # Keep only the first (oldest) process
        echo "$pids" | tail -n +2 | while read pid; do
            echo -e "${YELLOW}   Killing duplicate process: PID $pid${NC}"
            log "INFO" "Killing duplicate $service_name process: $pid"
            kill -9 "$pid" 2>/dev/null || true
        done
        
        sleep 1  # Give time for processes to die
        return 0
    fi
    
    return 1
}

# Function to check service status
check_service_status() {
    local service_line="$1"
    local name=$(echo "$service_line" | cut -d: -f1)
    local pattern=$(echo "$service_line" | cut -d: -f2)
    local port=$(echo "$service_line" | cut -d: -f3)
    
    local status="stopped"
    local pid=""
    local port_status="available"
    
    # Check process
    if is_process_running "$pattern"; then
        status="running"
        pid=$(get_process_pids "$pattern" | head -1)
    fi
    
    # Check port
    if [ -n "$port" ] && is_port_in_use "$port"; then
        port_status="in use"
    fi
    
    echo "$status|$pid|$port_status"
}

# Function to start a service
start_service() {
    local service_line="$1"
    local name=$(echo "$service_line" | cut -d: -f1)
    local pattern=$(echo "$service_line" | cut -d: -f2)
    local port=$(echo "$service_line" | cut -d: -f3)
    local command=$(echo "$service_line" | cut -d: -f4)
    
    echo -e "${BLUE}Starting $name...${NC}"
    log "INFO" "Starting $name with command: $command"
    
    # Create a launcher script
    local launcher_script="$LOG_DIR/${name// /_}_launcher.sh"
    cat > "$launcher_script" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
exec $command
EOF
    chmod +x "$launcher_script"
    
    # Launch in background
    nohup "$launcher_script" > "$LOG_DIR/${name// /_}.log" 2>&1 &
    local pid=$!
    
    # Store PID
    echo $pid > "$LOG_DIR/${name// /_}.pid"
    
    # Wait a bit and check if it started
    sleep 3
    
    if kill -0 $pid 2>/dev/null; then
        # For services with ports, wait for port to be ready
        if [ -n "$port" ]; then
            local attempts=0
            while [ $attempts -lt 15 ] && ! is_port_in_use "$port"; do
                sleep 2
                attempts=$((attempts + 1))
            done
            
            if is_port_in_use "$port"; then
                echo -e "${GREEN}✅ $name started successfully (PID: $pid, Port: $port)${NC}"
                log "INFO" "$name started successfully (PID: $pid, Port: $port)"
                return 0
            else
                echo -e "${RED}❌ $name started but port $port is not responding${NC}"
                log "ERROR" "$name started but port $port is not responding"
                return 1
            fi
        else
            echo -e "${GREEN}✅ $name started successfully (PID: $pid)${NC}"
            log "INFO" "$name started successfully (PID: $pid)"
            return 0
        fi
    else
        echo -e "${RED}❌ Failed to start $name${NC}"
        log "ERROR" "Failed to start $name"
        
        # Show last few lines of log
        if [ -f "$LOG_DIR/${name// /_}.log" ]; then
            echo -e "${YELLOW}Last log entries:${NC}"
            tail -5 "$LOG_DIR/${name// /_}.log"
        fi
        return 1
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Development Services Status${NC}"
    echo "================================"
    echo ""
    
    local all_running=true
    
    for service_line in "${DEV_SERVICES[@]}"; do
        local name=$(echo "$service_line" | cut -d: -f1)
        local pattern=$(echo "$service_line" | cut -d: -f2)
        local port=$(echo "$service_line" | cut -d: -f3)
        
        local status_info=$(check_service_status "$service_line")
        local status=$(echo "$status_info" | cut -d'|' -f1)
        local pid=$(echo "$status_info" | cut -d'|' -f2)
        local port_status=$(echo "$status_info" | cut -d'|' -f3)
        
        printf "%-20s " "$name:"
        
        if [ "$status" = "running" ]; then
            if [ -n "$port" ]; then
                echo -e "${GREEN}Running ✓${NC} (PID: $pid, Port: $port)"
            else
                echo -e "${GREEN}Running ✓${NC} (PID: $pid)"
            fi
        else
            echo -e "${RED}Not Running ✗${NC}"
            all_running=false
            
            # Check if port is blocked
            if [ -n "$port" ] && [ "$port_status" = "in use" ]; then
                echo -e "  ${YELLOW}⚠️  Port $port is in use by another process${NC}"
            fi
        fi
    done
    
    echo ""
    if [ "$all_running" = true ]; then
        echo -e "${GREEN}✅ All development services are running${NC}"
    else
        echo -e "${YELLOW}⚠️  Some services are not running${NC}"
        echo -e "${CYAN}Run '$0 start' to start missing services${NC}"
    fi
}

# Function to check and start services
check_and_start() {
    echo -e "${BLUE}🔍 Checking development services...${NC}"
    echo ""
    
    local started=0
    local already_running=0
    local failed=0
    
    for service_line in "${DEV_SERVICES[@]}"; do
        local name=$(echo "$service_line" | cut -d: -f1)
        local pattern=$(echo "$service_line" | cut -d: -f2)
        local port=$(echo "$service_line" | cut -d: -f3)
        
        # First, kill any duplicates
        if kill_duplicates "$pattern" "$name"; then
            echo ""  # Add spacing after duplicate cleanup
        fi
        
        # Check current status
        local status_info=$(check_service_status "$service_line")
        local status=$(echo "$status_info" | cut -d'|' -f1)
        local port_status=$(echo "$status_info" | cut -d'|' -f3)
        
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✓ $name is already running${NC}"
            already_running=$((already_running + 1))
        else
            # Check if port is blocked
            if [ -n "$port" ] && [ "$port_status" = "in use" ]; then
                echo -e "${RED}✗ Cannot start $name - port $port is in use${NC}"
                echo -e "  ${YELLOW}Try: lsof -i :$port${NC} to see what's using it"
                failed=$((failed + 1))
            else
                # Try to start the service
                if start_service "$service_line"; then
                    started=$((started + 1))
                else
                    failed=$((failed + 1))
                fi
            fi
        fi
        echo ""
    done
    
    # Summary
    echo -e "${BLUE}Summary:${NC}"
    echo "  Already running: $already_running"
    echo "  Started: $started"
    echo "  Failed: $failed"
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✅ All services are now running!${NC}"
        echo ""
        echo -e "${CYAN}Access your dev environment:${NC}"
        echo "  - Vite Dev Server: http://localhost:5173"
        echo "  - Firebase Emulator UI: http://localhost:4000"
    else
        echo -e "${RED}❌ Some services failed to start${NC}"
    fi
}

# Function to stop services
stop_services() {
    echo -e "${BLUE}🛑 Stopping development services...${NC}"
    echo ""
    
    for service_line in "${DEV_SERVICES[@]}"; do
        local name=$(echo "$service_line" | cut -d: -f1)
        local pattern=$(echo "$service_line" | cut -d: -f2)
        
        local pids=$(get_process_pids "$pattern")
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}Stopping $name...${NC}"
            echo "$pids" | while read pid; do
                echo "  Killing PID: $pid"
                kill -TERM "$pid" 2>/dev/null || true
            done
            
            # Give it a moment, then force kill if needed
            sleep 2
            echo "$pids" | while read pid; do
                if kill -0 "$pid" 2>/dev/null; then
                    echo "  Force killing PID: $pid"
                    kill -9 "$pid" 2>/dev/null || true
                fi
            done
            
            echo -e "${GREEN}✓ $name stopped${NC}"
        else
            echo -e "${CYAN}$name was not running${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting development services...${NC}"
    echo ""
    
    stop_services
    echo ""
    sleep 2
    check_and_start
}

# Usage function
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Smart Development Environment Launcher"
    echo ""
    echo "Commands:"
    echo "  status    Show status of all dev services (default)"
    echo "  start     Start services that aren't running"
    echo "  stop      Stop all running dev services"
    echo "  restart   Restart all dev services"
    echo "  logs      Show recent logs for all services"
    echo ""
    echo "Examples:"
    echo "  $0              # Show status"
    echo "  $0 start        # Start missing services"
    echo "  $0 stop         # Stop everything"
    echo "  $0 restart      # Restart everything"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Recent Service Logs${NC}"
    echo "======================="
    echo ""
    
    for service_line in "${DEV_SERVICES[@]}"; do
        local name=$(echo "$service_line" | cut -d: -f1)
        local log_file="$LOG_DIR/${name// /_}.log"
        
        if [ -f "$log_file" ]; then
            echo -e "${CYAN}--- $name ---${NC}"
            tail -10 "$log_file"
            echo ""
        fi
    done
}

# Main script logic
main() {
    case "${1:-status}" in
        status)
            show_status
            ;;
        start)
            check_and_start
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        -h|--help|help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"