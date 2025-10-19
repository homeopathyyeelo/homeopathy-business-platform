#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Stop Script
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"; }

log "🛑 Stopping Yeelo Homeopathy ERP Platform..."

# Stop services by PID files
stop_service() {
    local name=$1
    local pidfile="logs/${name}.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
            rm "$pidfile"
            log "✅ $name stopped"
        else
            warn "⚠️  $name not running"
            rm "$pidfile"
        fi
    fi
}

# Stop all services
stop_service "frontend"
stop_service "golang-api"
stop_service "nestjs-api"
stop_service "fastify-api"
stop_service "express-api"

# Kill any remaining Node.js processes on our ports
for port in 3000 3001 3002 3003 3004; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        warn "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

log "✅ All services stopped"
