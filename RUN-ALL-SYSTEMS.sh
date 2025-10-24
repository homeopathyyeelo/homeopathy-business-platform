#!/bin/bash

echo "============================================"
echo "  HomeoERP Complete System Startup"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Run migrations
echo -e "${BLUE}1. Running database migrations...${NC}"
psql -U postgres -d yeelo_homeopathy -f database/migrations/005_automated_bug_tracking.sql
psql -U postgres -d yeelo_homeopathy -f database/migrations/006_expiry_dashboard.sql
psql -U postgres -d yeelo_homeopathy -f database/migrations/008_cron_and_monitoring.sql
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# 2. Start Go API v2
echo -e "${BLUE}2. Starting Go API v2 (port 3005)...${NC}"
cd services/api-golang-v2
go build -o api-golang-v2 .
./api-golang-v2 &
API_PID=$!
echo -e "${GREEN}✓ Go API v2 started (PID: $API_PID)${NC}"
cd ../..
echo ""

# 3. Start AI Service
echo -e "${BLUE}3. Starting AI Service (port 8007)...${NC}"
cd services/ai-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8007 &
AI_PID=$!
echo -e "${GREEN}✓ AI Service started (PID: $AI_PID)${NC}"
cd ../..
echo ""

# 4. Start Next.js Frontend
echo -e "${BLUE}4. Starting Next.js Frontend (port 3000)...${NC}"
npm run dev &
NEXT_PID=$!
echo -e "${GREEN}✓ Next.js started (PID: $NEXT_PID)${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# 5. Run service audit
echo -e "${BLUE}5. Running service audit...${NC}"
./scripts/service-audit.sh
echo ""

# 6. Test endpoints
echo -e "${BLUE}6. Testing endpoints...${NC}"
./test-endpoints.sh
echo ""

echo "============================================"
echo -e "${GREEN}✓ All systems running!${NC}"
echo "============================================"
echo ""
echo "Access Points:"
echo "  Frontend:    http://localhost:3000"
echo "  Dashboard:   http://localhost:3000/dashboard"
echo "  Bug Tracker: http://localhost:3000/admin/bugs"
echo "  Expiry:      http://localhost:3000/inventory/expiry"
echo "  API v2:      http://localhost:3005"
echo "  AI Service:  http://localhost:8007"
echo ""
echo "Process IDs:"
echo "  Go API:   $API_PID"
echo "  AI:       $AI_PID"
echo "  Next.js:  $NEXT_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "kill $API_PID $AI_PID $NEXT_PID 2>/dev/null; echo 'All services stopped'; exit" INT TERM
wait
