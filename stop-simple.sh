#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Simple Stop Script
# Stops: All Microservices + Frontend (keeps system PostgreSQL/Redis running)
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║        🛑 Stopping Yeelo Homeopathy ERP Platform 🛑      ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "🛑 Stopping services..."

stop_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            info "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
            fi
            log "✅ $name stopped"
        else
            warn "⚠️  $name not running"
        fi
        rm -f "$pid_file"
    else
        warn "⚠️  No PID file for $name"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "api-gateway"
stop_service "product-service"
stop_service "inventory-service"
stop_service "sales-service"
stop_service "ai-service"

# Kill any remaining processes
info "Cleaning up any remaining processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "api-gateway" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

log "✅ All services stopped"
echo ""

# Update services.json
if [ -f "logs/services.json" ]; then
    cat > logs/services.json << EOF
{
  "stopped_at": "$(date -Iseconds)",
  "status": "stopped"
}
EOF
    log "✅ Service info updated"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  All Services Stopped Successfully!                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "📋 To start again: ./start-simple.sh"
log "💡 System PostgreSQL and Redis are still running"
echo ""
