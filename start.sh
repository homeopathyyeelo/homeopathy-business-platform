#!/bin/bash

################################################################################
# YEELO HOMEOPATHY PLATFORM - PRODUCTION STARTUP
# One script to rule them all
################################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "════════════════════════════════════════════════════════════════"
echo -e "${CYAN}🚀 YEELO HOMEOPATHY PLATFORM${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

################################################################################
# STEP 1: CHECK INFRASTRUCTURE
################################################################################

echo -e "${CYAN}[1/6] Checking Infrastructure...${NC}"

check_service() {
    local name=$1
    local host=$2
    local port=$3
    
    if nc -z "$host" "$port" 2>/dev/null; then
        echo -e "  ${GREEN}✅ $name ($host:$port)${NC}"
        return 0
    else
        echo -e "  ${RED}❌ $name ($host:$port) - Not running${NC}"
        return 1
    fi
}

check_service "PostgreSQL" "localhost" "5433" || {
    echo ""
    echo -e "${RED}ERROR: PostgreSQL not running. Start it with:${NC}"
    echo "  docker-compose -f docker-compose.production.yml up -d postgres"
    exit 1
}

check_service "Redis" "localhost" "6380" || echo "  Warning: Redis not running (optional)"
check_service "Kafka" "localhost" "9092" || echo "  Warning: Kafka not running (optional)"

echo ""

################################################################################
# STEP 2: STOP OLD SERVICES
################################################################################

echo -e "${CYAN}[2/6] Stopping Old Services...${NC}"

pkill -9 -f "go run" 2>/dev/null || true
pkill -9 -f "node.*dist" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
sleep 2

echo -e "  ${GREEN}✅ Cleaned up${NC}"
echo ""

################################################################################
# STEP 3: SET ENVIRONMENT
################################################################################

echo -e "${CYAN}[3/6] Setting Environment...${NC}"

export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=yeelo_homeopathy
export REDIS_URL="redis://localhost:6380"
export REDIS_HOST=localhost
export REDIS_PORT=6380
export KAFKA_BROKERS="localhost:9092"
export KAFKAJS_NO_PARTITIONER_WARNING=1
export JWT_SECRET="your-secret-key-change-in-production"

echo -e "  ${GREEN}✅ Environment configured${NC}"
echo ""

################################################################################
# STEP 4: START SERVICES
################################################################################

echo -e "${CYAN}[4/6] Starting Services...${NC}"
echo ""

PIDS=()

# Golang v2 (Main API)
echo -n "  Starting Golang v2 (3005)... "
cd "$SCRIPT_DIR/services/api-golang-v2"
PORT=3005 nohup go run cmd/main.go > "$LOG_DIR/golang-v2.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}PID: ${PIDS[-1]}${NC}"
sleep 4

# NestJS
echo -n "  Starting NestJS (3001)... "
cd "$SCRIPT_DIR/services/api-nest"
PORT=3001 nohup npm run start:prod > "$LOG_DIR/nestjs.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}PID: ${PIDS[-1]}${NC}"
sleep 4

# Fastify
echo -n "  Starting Fastify (3002)... "
cd "$SCRIPT_DIR/services/api-fastify"
PORT=3002 nohup npm run start > "$LOG_DIR/fastify.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}PID: ${PIDS[-1]}${NC}"
sleep 4

# Express
echo -n "  Starting Express (3004)... "
cd "$SCRIPT_DIR/services/api-express"
PORT=3004 nohup npm run start > "$LOG_DIR/express.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}PID: ${PIDS[-1]}${NC}"
sleep 4

# Frontend (build if needed)
echo -n "  Starting Frontend (3000)... "
cd "$SCRIPT_DIR"
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Building...${NC}"
    npx next build > "$LOG_DIR/frontend-build.log" 2>&1
fi
PORT=3000 nohup npx next start > "$LOG_DIR/frontend.log" 2>&1 &
PIDS+=($!)
echo -e "${GREEN}PID: ${PIDS[-1]}${NC}"

echo ""
echo -e "${YELLOW}Waiting 15 seconds for services to start...${NC}"
sleep 15
echo ""

################################################################################
# STEP 5: HEALTH CHECKS
################################################################################

echo -e "${CYAN}[5/6] Testing Services...${NC}"
echo ""

test_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "  $name ($port): "
    
    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}❌ NOT RESPONDING${NC}"
        echo -e "    ${YELLOW}Check logs: tail -f $LOG_DIR/${name,,}.log${NC}"
        return 1
    fi
}

HEALTH_OK=0

test_service "Golang-v2" "http://localhost:3005/health" "3005" && ((HEALTH_OK++)) || true
test_service "NestJS" "http://localhost:3001/health" "3001" && ((HEALTH_OK++)) || true
test_service "Fastify" "http://localhost:3002/health" "3002" && ((HEALTH_OK++)) || true
test_service "Express" "http://localhost:3004/health" "3004" && ((HEALTH_OK++)) || true
test_service "Frontend" "http://localhost:3000" "3000" && ((HEALTH_OK++)) || true

echo ""

################################################################################
# STEP 6: FINAL STATUS
################################################################################

echo "════════════════════════════════════════════════════════════════"

if [ $HEALTH_OK -ge 4 ]; then
    echo -e "${GREEN}✅ SUCCESS - $HEALTH_OK/5 SERVICES RUNNING${NC}"
else
    echo -e "${YELLOW}⚠️  PARTIAL - $HEALTH_OK/5 SERVICES RUNNING${NC}"
fi

echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}📱 ACCESS YOUR APPLICATION:${NC}"
echo "   Frontend:     http://localhost:3000"
echo "   API (Main):   http://localhost:3005/health"
echo "   API (Nest):   http://localhost:3001/health"
echo "   API (Fast):   http://localhost:3002/health"
echo "   API (Exp):    http://localhost:3004/health"
echo ""
echo -e "${CYAN}🔧 INFRASTRUCTURE:${NC}"
echo "   Kafka UI:     http://localhost:8080"
echo "   pgAdmin:      http://localhost:5050"
echo "   MinIO:        http://localhost:9001"
echo ""
echo -e "${CYAN}📝 LOGS:${NC}"
echo "   All:          tail -f $LOG_DIR/*.log"
echo "   Golang v2:    tail -f $LOG_DIR/golang-v2.log"
echo "   NestJS:       tail -f $LOG_DIR/nestjs.log"
echo "   Frontend:     tail -f $LOG_DIR/frontend.log"
echo ""
echo -e "${CYAN}🛑 STOP ALL SERVICES:${NC}"
echo "   Press Ctrl+C or run: pkill -9 -f 'go run|node.*dist|next'"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Save PIDs
echo "${PIDS[@]}" > /tmp/yeelo-pids.txt

# Cleanup handler
cleanup() {
    echo ""
    echo "Stopping all services..."
    for pid in $(cat /tmp/yeelo-pids.txt 2>/dev/null); do
        kill -9 $pid 2>/dev/null || true
    done
    pkill -9 -f "go run" 2>/dev/null || true
    pkill -9 -f "node.*dist" 2>/dev/null || true
    pkill -9 -f "next" 2>/dev/null || true
    rm -f /tmp/yeelo-pids.txt
    echo "All services stopped."
    exit 0
}

trap cleanup INT TERM

echo "Press Ctrl+C to stop all services"
echo ""

# Keep running
wait
