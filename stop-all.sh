#!/bin/bash

# ============================================================================
# Stop All Services Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Stopping All Services                                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop frontend
echo -e "${YELLOW}[1/3]${NC} Stopping frontend..."
if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null || true
    rm .frontend.pid
fi
pkill -f "next dev" 2>/dev/null || true
echo -e "${GREEN}✓${NC} Frontend stopped"

# Stop backend
echo -e "${YELLOW}[2/3]${NC} Stopping backend..."
if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null || true
    rm .backend.pid
fi
pkill -f "api-golang" 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓${NC} Backend stopped"

# Stop Docker services
echo -e "${YELLOW}[3/3]${NC} Stopping Docker services..."
docker-compose -f docker-compose.dev.yml down
echo -e "${GREEN}✓${NC} Docker services stopped"

echo ""
echo -e "${GREEN}✅ All services stopped successfully!${NC}"
