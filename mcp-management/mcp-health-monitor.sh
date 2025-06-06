#!/bin/bash

# MCP Health Monitor
# Advanced health checking and recovery system for MCP servers
# Detects failed servers, memory leaks, and automatically recovers

set -eo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs/mcp"
HEALTH_LOG="$LOG_DIR/health-monitor.log"

# Health check thresholds
MAX_MEMORY_MB=512
MAX_CPU_PERCENT=80
MAX_RESTART_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Logging function with health-specific formatting
health_log() {
    local level=$1
    local server=$2
    shift 2
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] [$server] $message" | tee -a "$HEALTH_LOG"
}

# Server definitions (compatible with bash 3.2)
# Format: "key:process_pattern:server_name"
SERVERS=(
    "taskmaster-ai:task-master-ai:TaskMaster AI"
    "firebase-original:firebase-mcp:Original Firebase MCP"
    "firebase:enhanced-index-fixed.cjs:Custom Firebase MCP"
    "context7:context7-mcp:Context7"
    "desktop-commander:desktop-commander:Desktop Commander"
    "memory:mcp-server-memory:Memory Server"
    "browser-tools-server:browser-tools-server:Browser Tools Server"
    "browser-tools:browser-tools-mcp:Browser Tools MCP"
)

# Track restart attempts in a simple way
RESTART_ATTEMPTS=""

# Function to parse server info
get_server_info() {
    local server_line=$1
    local field=$2
    
    local key=$(echo "$server_line" | cut -d: -f1)
    local process=$(echo "$server_line" | cut -d: -f2)
    local name=$(echo "$server_line" | cut -d: -f3)
    
    case "$field" in
        "key") echo "$key" ;;
        "process") echo "$process" ;;
        "name") echo "$name" ;;
    esac
}

# Function to get/set restart attempts
get_restart_attempts() {
    local server_key=$1
    echo "$RESTART_ATTEMPTS" | grep "^$server_key:" | cut -d: -f2 2>/dev/null || echo "0"
}

set_restart_attempts() {
    local server_key=$1
    local count=$2
    RESTART_ATTEMPTS=$(echo "$RESTART_ATTEMPTS" | grep -v "^$server_key:" 2>/dev/null || true)
    RESTART_ATTEMPTS="$RESTART_ATTEMPTS
$server_key:$count"
}

# Function to get process info
get_process_info() {
    local pattern=$1
    local pids=($(pgrep -f "$pattern" 2>/dev/null || true))
    
    if [ ${#pids[@]} -eq 0 ]; then
        echo ""
        return 1
    fi
    
    # Return info for the first (or only) matching process
    local pid=${pids[0]}
    
    # Get memory usage in MB and CPU percentage
    local ps_output=$(ps -p "$pid" -o pid,pcpu,rss,etime,comm 2>/dev/null || echo "")
    
    if [ -n "$ps_output" ]; then
        echo "$ps_output" | tail -n 1
        return 0
    else
        return 1
    fi
}

# Function to check if a process is responsive
check_process_responsiveness() {
    local pattern=$1
    local server_name=$2
    
    # For Node.js processes, we can check if they're responding to signals
    local pids=($(pgrep -f "$pattern" 2>/dev/null || true))
    
    if [ ${#pids[@]} -eq 0 ]; then
        return 1  # Process not running
    fi
    
    local pid=${pids[0]}
    
    # Send a harmless signal (0) to check if process exists and is responsive
    if ! kill -0 "$pid" 2>/dev/null; then
        health_log "ERROR" "$server_name" "Process $pid is not responsive to signals"
        return 1
    fi
    
    # Check if process is in a good state (not zombie)
    local state=$(ps -p "$pid" -o state= 2>/dev/null | tr -d ' ')
    if [ "$state" = "Z" ]; then
        health_log "ERROR" "$server_name" "Process $pid is a zombie"
        return 1
    fi
    
    return 0
}

# Function to perform health check on a single server
health_check_server() {
    local server_line=$1
    local server_key=$(get_server_info "$server_line" "key")
    local process_pattern=$(get_server_info "$server_line" "process")
    local server_name=$(get_server_info "$server_line" "name")
    local health_status="HEALTHY"
    local issues=()
    
    # Check if process is running
    local process_info=$(get_process_info "$process_pattern")
    if [ $? -ne 0 ]; then
        health_log "ERROR" "$server_name" "Process not running"
        echo "NOT_RUNNING"
        return 1
    fi
    
    # Parse process information
    local pid=$(echo "$process_info" | awk '{print $1}')
    local cpu=$(echo "$process_info" | awk '{print $2}' | cut -d. -f1)
    local memory_kb=$(echo "$process_info" | awk '{print $3}')
    local runtime=$(echo "$process_info" | awk '{print $4}')
    
    # Convert memory to MB
    local memory_mb=$((memory_kb / 1024))
    
    # Check responsiveness
    if ! check_process_responsiveness "$process_pattern" "$server_name"; then
        health_status="UNRESPONSIVE"
        issues+=("Process unresponsive")
    fi
    
    # Check memory usage
    if [ "$memory_mb" -gt "$MAX_MEMORY_MB" ]; then
        health_status="UNHEALTHY"
        issues+=("High memory usage: ${memory_mb}MB > ${MAX_MEMORY_MB}MB")
        health_log "WARN" "$server_name" "High memory usage: ${memory_mb}MB"
    fi
    
    # Check CPU usage (if not empty/zero)
    if [ -n "$cpu" ] && [ "$cpu" -gt "$MAX_CPU_PERCENT" ]; then
        health_status="UNHEALTHY"
        issues+=("High CPU usage: ${cpu}% > ${MAX_CPU_PERCENT}%")
        health_log "WARN" "$server_name" "High CPU usage: ${cpu}%"
    fi
    
    # Check if process has been running for a suspiciously long time without restart
    local runtime_hours=$(echo "$runtime" | awk -F: '{
        if (NF == 3) {
            split($1, days, "-")
            if (length(days) > 1) print days[1] * 24 + days[2]
            else print $1
        } else print 0
    }')
    
    if [ -n "$runtime_hours" ] && [ "$runtime_hours" -gt 24 ]; then
        health_log "INFO" "$server_name" "Long running process: $runtime (PID: $pid)"
    fi
    
    # Log health status
    if [ "$health_status" = "HEALTHY" ]; then
        health_log "INFO" "$server_name" "Healthy (PID: $pid, Memory: ${memory_mb}MB, CPU: ${cpu}%, Runtime: $runtime)"
    else
        health_log "WARN" "$server_name" "Status: $health_status - Issues: ${issues[*]}"
    fi
    
    echo "$health_status"
    return 0
}

# Function to restart a server
restart_server() {
    local server_line=$1
    local server_key=$(get_server_info "$server_line" "key")
    local process_pattern=$(get_server_info "$server_line" "process")
    local server_name=$(get_server_info "$server_line" "name")
    
    # Increment restart attempt counter
    local current_attempts=$(get_restart_attempts "$server_key")
    current_attempts=$((current_attempts + 1))
    set_restart_attempts "$server_key" "$current_attempts"
    
    if [ "$current_attempts" -gt "$MAX_RESTART_ATTEMPTS" ]; then
        health_log "ERROR" "$server_name" "Max restart attempts ($MAX_RESTART_ATTEMPTS) reached"
        return 1
    fi
    
    health_log "INFO" "$server_name" "Attempting restart (attempt $current_attempts/$MAX_RESTART_ATTEMPTS)"
    
    # Kill existing processes
    local pids=($(pgrep -f "$process_pattern" 2>/dev/null || true))
    for pid in "${pids[@]}"; do
        health_log "INFO" "$server_name" "Killing process $pid"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 2
        if kill -0 "$pid" 2>/dev/null; then
            health_log "WARN" "$server_name" "Force killing process $pid"
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    
    # Clean up PID file
    local pid_file="$LOG_DIR/${server_key}.pid"
    [ -f "$pid_file" ] && rm -f "$pid_file"
    
    # Use auto-launcher to restart the server
    health_log "INFO" "$server_name" "Launching server using auto-launcher"
    if "$SCRIPT_DIR/auto-mcp-launcher.sh" --check >/dev/null 2>&1; then
        health_log "INFO" "$server_name" "Successfully restarted"
        # Reset restart counter on successful restart
        set_restart_attempts "$server_key" "0"
        return 0
    else
        health_log "ERROR" "$server_name" "Failed to restart"
        return 1
    fi
}

# Function to perform comprehensive health check
comprehensive_health_check() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local total_servers=${#SERVER_PROCESSES[@]}
    local healthy_count=0
    local unhealthy_count=0
    local not_running_count=0
    local restarted_count=0
    
    health_log "INFO" "SYSTEM" "Starting comprehensive health check"
    
    echo -e "${BLUE}🏥 MCP Server Health Check${NC}"
    echo "=========================="
    echo "Time: $timestamp"
    echo ""
    
    # Check each server
    for server_line in "${SERVERS[@]}"; do
        local server_name=$(get_server_info "$server_line" "name")
        printf "  %-20s " "$server_name:"
        
        local health_status=$(health_check_server "$server_line")
        
        case "$health_status" in
            "HEALTHY")
                echo -e "${GREEN}Healthy ✓${NC}"
                healthy_count=$((healthy_count + 1))
                ;;
            "UNHEALTHY"|"UNRESPONSIVE")
                echo -e "${YELLOW}Unhealthy - Restarting${NC}"
                unhealthy_count=$((unhealthy_count + 1))
                if restart_server "$server_line"; then
                    echo -e "    ${GREEN}→ Restart successful ✓${NC}"
                    restarted_count=$((restarted_count + 1))
                else
                    echo -e "    ${RED}→ Restart failed ✗${NC}"
                fi
                ;;
            "NOT_RUNNING")
                echo -e "${RED}Not Running - Starting${NC}"
                not_running_count=$((not_running_count + 1))
                if restart_server "$server_line"; then
                    echo -e "    ${GREEN}→ Start successful ✓${NC}"
                    restarted_count=$((restarted_count + 1))
                else
                    echo -e "    ${RED}→ Start failed ✗${NC}"
                fi
                ;;
        esac
    done
    
    # Summary
    echo ""
    echo "📊 Health Check Summary:"
    echo "  Healthy: $healthy_count"
    echo "  Unhealthy: $unhealthy_count"
    echo "  Not Running: $not_running_count"
    echo "  Restarted: $restarted_count"
    echo "  Total: $total_servers"
    
    health_log "INFO" "SYSTEM" "Health check complete - Healthy: $healthy_count, Unhealthy: $unhealthy_count, Not Running: $not_running_count, Restarted: $restarted_count"
    
    # Return non-zero if any issues were found
    if [ $((unhealthy_count + not_running_count)) -gt 0 ]; then
        return 1
    else
        return 0
    fi
}

# Function to show health report
show_health_report() {
    echo -e "${BLUE}📋 MCP Server Health Report${NC}"
    echo "============================"
    echo ""
    
    if [ -f "$HEALTH_LOG" ]; then
        echo "Recent health events (last 20 entries):"
        echo "----------------------------------------"
        tail -20 "$HEALTH_LOG" | while read line; do
            if [[ "$line" =~ ERROR ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ "$line" =~ WARN ]]; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo "$line"
            fi
        done
        echo ""
        
        # Show restart statistics
        echo "Restart Statistics:"
        echo "-------------------"
        for server_line in "${SERVERS[@]}"; do
            local server_name=$(get_server_info "$server_line" "name")
            local count=$(grep "Attempting restart" "$HEALTH_LOG" | grep "$server_name" | wc -l)
            if [ $count -gt 0 ]; then
                echo "  $server_name: $count restarts"
            fi
        done
    else
        echo "No health log found. Run a health check first."
    fi
}

# Function to run continuous monitoring
run_health_daemon() {
    local check_interval=${1:-60}  # Default 1 minute
    
    health_log "INFO" "SYSTEM" "Starting health monitor daemon (interval: ${check_interval}s)"
    echo -e "${BLUE}🏥 Health Monitor Daemon Started${NC}"
    echo "Checking every $check_interval seconds"
    echo "Press Ctrl+C to stop"
    
    # Create daemon PID file
    echo $$ > "$LOG_DIR/health-monitor-daemon.pid"
    
    # Cleanup function
    cleanup_daemon() {
        health_log "INFO" "SYSTEM" "Health monitor daemon shutting down"
        rm -f "$LOG_DIR/health-monitor-daemon.pid"
        exit 0
    }
    
    trap cleanup_daemon SIGTERM SIGINT
    
    # Initial health check
    comprehensive_health_check
    
    # Continuous monitoring loop
    while true; do
        sleep "$check_interval"
        health_log "INFO" "SYSTEM" "Health monitor cycle starting"
        comprehensive_health_check >/dev/null
    done
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "MCP Server Health Monitor"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --check             Perform comprehensive health check"
    echo "  -r, --report            Show health report from logs"
    echo "  -d, --daemon [INTERVAL] Run health monitoring daemon (default: 60s)"
    echo "  --stop-daemon           Stop running health monitor daemon"
    echo "  --clear-logs            Clear health monitor logs"
    echo ""
    echo "Examples:"
    echo "  $0 --check             # Run health check once"
    echo "  $0 --daemon 30         # Monitor every 30 seconds"
    echo "  $0 --report            # Show health report"
    echo ""
}

# Main script logic
main() {
    case "${1:-}" in
        -h|--help)
            usage
            exit 0
            ;;
        -c|--check)
            comprehensive_health_check
            exit $?
            ;;
        -r|--report)
            show_health_report
            exit 0
            ;;
        -d|--daemon)
            local interval=${2:-60}
            run_health_daemon "$interval"
            ;;
        --stop-daemon)
            if [ -f "$LOG_DIR/health-monitor-daemon.pid" ]; then
                local daemon_pid=$(cat "$LOG_DIR/health-monitor-daemon.pid")
                if kill -0 "$daemon_pid" 2>/dev/null; then
                    kill "$daemon_pid"
                    echo -e "${GREEN}✅ Health monitor daemon stopped${NC}"
                else
                    echo -e "${YELLOW}⚠️  Health monitor daemon not running${NC}"
                    rm -f "$LOG_DIR/health-monitor-daemon.pid"
                fi
            else
                echo -e "${YELLOW}⚠️  No health monitor daemon PID file found${NC}"
            fi
            exit 0
            ;;
        --clear-logs)
            rm -f "$HEALTH_LOG"
            echo -e "${GREEN}✅ Health monitor logs cleared${NC}"
            exit 0
            ;;
        "")
            # Default: run health check
            comprehensive_health_check
            exit $?
            ;;
        *)
            echo -e "${RED}Error: Unknown option '$1'${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"