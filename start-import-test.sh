#!/bin/bash

# Quick start script for testing import feature
# Starts: Postgres + Import API + Frontend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🧪 Quick Start: Import Feature Test             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Start Postgres
log "🐘 Starting PostgreSQL..."
docker-compose up -d postgres
sleep 5

# Check Postgres
info "Checking PostgreSQL..."
for i in {1..10}; do
    if docker-compose exec -T postgres pg_isready -U postgres -d yeelo_homeopathy >/dev/null 2>&1; then
        log "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
    sleep 2
done

# 2. Start Import API
log "🚀 Starting Import API (Port 3005)..."
cd services/api-golang-v2
./bin/api > ../../logs/import-api.log 2>&1 &
echo $! > ../../logs/import-api.pid
cd ../..
log "✅ Import API started (PID: $(cat logs/import-api.pid))"

# Wait for API to start
sleep 3

# 3. Start Frontend
log "🌐 Starting Frontend (Port 3000)..."
npm run dev > logs/frontend.log 2>&1 &
echo $! > logs/frontend.pid
log "✅ Frontend started (PID: $(cat logs/frontend.pid))"

# Wait for frontend to compile
log "⏳ Waiting for frontend to compile (30s)..."
sleep 30

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Services Started Successfully!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

log "🐘 PostgreSQL:  localhost:5432"
log "🚀 Import API:  http://localhost:3005"
log "🌐 Frontend:    http://localhost:3000"
echo ""

log "📋 Test Import:"
info "   1. Open: http://localhost:3000/products/import-export"
info "   2. Upload: Template_File_Medicine_Product_List.csv"
info "   3. Watch live logs!"
echo ""

log "📊 Monitor Logs:"
info "   Frontend:   tail -f logs/frontend.log"
info "   Import API: tail -f logs/import-api.log"
echo ""

log "🛑 Stop Services:"
info "   kill $(cat logs/import-api.pid) $(cat logs/frontend.pid)"
info "   docker-compose down"
echo ""

log "🎉 Ready to test! Open http://localhost:3000/products/import-export"
echo ""
