#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Complete Stop Script
# Stops: All Microservices + Frontend + Docker Services
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

# ============================================================================
# 1. STOP NODE.JS SERVICES
# ============================================================================

log "🛑 Stopping Node.js services..."

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

# Kill any remaining Next.js processes
info "Cleaning up any remaining Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

# Kill any remaining node processes from our services
info "Cleaning up any remaining service processes..."
pkill -f "api-gateway" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

log "✅ All Node.js services stopped"
echo ""

# ============================================================================
# 2. STOP GO SERVICES
# ============================================================================

if command -v go &> /dev/null; then
    log "🛑 Stopping Go services..."
    
    # Kill Go processes
    pkill -f "product-service" 2>/dev/null || true
    pkill -f "inventory-service" 2>/dev/null || true
    pkill -f "sales-service" 2>/dev/null || true
    
    log "✅ Go services stopped"
    echo ""
fi

# ============================================================================
# 3. STOP PYTHON SERVICES
# ============================================================================

if command -v python3 &> /dev/null; then
    log "🛑 Stopping Python services..."
    
    # Kill Python/uvicorn processes
    pkill -f "uvicorn" 2>/dev/null || true
    pkill -f "ai-service" 2>/dev/null || true
    
    log "✅ Python services stopped"
    echo ""
fi

# ============================================================================
# 4. STOP DOCKER SERVICES
# ============================================================================

log "🐳 Stopping Docker services..."

if command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.yml" ]; then
        info "Stopping Docker containers..."
        docker-compose stop 2>&1 | tee logs/docker-stop.log
        log "✅ Docker services stopped"
    else
        warn "⚠️  docker-compose.yml not found"
    fi
else
    warn "⚠️  Docker Compose not installed"
fi

echo ""

# ============================================================================
# 5. CLEANUP
# ============================================================================

log "🧹 Cleaning up..."

# Remove PID files
rm -f logs/*.pid 2>/dev/null || true

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

# ============================================================================
# 6. SUMMARY
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  All Services Stopped Successfully!                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "📋 To start again: ./start-complete.sh"
log "📊 To remove Docker volumes: docker-compose down -v"
log "🗑️  To clean everything: docker-compose down -v && rm -rf .next node_modules"
echo ""
