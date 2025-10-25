#!/bin/bash

# Quick restart script for Import/Export API only
# Useful when you make code changes and want to restart just this service

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
log "🔄 Restarting Import/Export API..."
echo ""

# Stop existing process
if [ -f "logs/api-golang-v2.pid" ]; then
    PID=$(cat logs/api-golang-v2.pid)
    if ps -p $PID > /dev/null 2>&1; then
        info "Stopping existing process (PID: $PID)..."
        kill $PID 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null || true
        fi
        log "✅ Stopped"
    fi
    rm -f logs/api-golang-v2.pid
fi

# Rebuild
info "Rebuilding..."
cd services/api-golang-v2
go build -o bin/api cmd/main.go
if [ $? -eq 0 ]; then
    log "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Start
info "Starting..."
./bin/api > ../../logs/api-golang-v2.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > ../../logs/api-golang-v2.pid
cd - > /dev/null

sleep 2

# Verify
if ps -p $NEW_PID > /dev/null 2>&1; then
    log "✅ Import API restarted successfully!"
    echo ""
    log "📊 Service Info:"
    info "   PID: $NEW_PID"
    info "   Port: 3005"
    info "   URL: http://localhost:3005"
    info "   Logs: tail -f logs/api-golang-v2.log"
    echo ""
else
    echo "❌ Failed to start. Check logs:"
    tail -20 logs/api-golang-v2.log
    exit 1
fi
