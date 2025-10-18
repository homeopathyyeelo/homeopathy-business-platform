#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONTINUE PRODUCTION STARTUP
# Use this if infrastructure is already running
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "════════════════════════════════════════════════════════════════"
echo -e "${CYAN}🔄 CONTINUING PRODUCTION STARTUP${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════

echo "Checking infrastructure..."
echo ""

echo -n "PostgreSQL: "
if pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    exit 1
fi

echo -n "Redis: "
if nc -z localhost 6380 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo -n "Kafka: "
if nc -z localhost 9092 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# START KAFKA UI IF NEEDED
# ═══════════════════════════════════════════════════════════════

if ! docker ps | grep -q yeelo-kafka-ui; then
    echo "Starting Kafka UI..."
    docker-compose -f docker-compose.production.yml up -d kafka-ui
    sleep 5
fi

# ═══════════════════════════════════════════════════════════════
# CREATE KAFKA TOPICS
# ═══════════════════════════════════════════════════════════════

echo "Creating Kafka topics..."

topics=(
    "product.events"
    "sales.events"
    "purchase.events"
    "inventory.events"
    "customer.events"
    "vendor.events"
    "order.events"
)

for topic in "${topics[@]}"; do
    docker exec yeelo-kafka kafka-topics \
        --bootstrap-server localhost:9092 \
        --create \
        --if-not-exists \
        --topic "$topic" \
        --partitions 3 \
        --replication-factor 1 2>/dev/null || true
done

echo -e "${GREEN}✅ Kafka topics ready${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# SET ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════

export NODE_ENV=production
export KAFKAJS_NO_PARTITIONER_WARNING=1
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export DB_HOST="localhost"
export DB_PORT=5433
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_NAME="yeelo_homeopathy"
export REDIS_URL="redis://localhost:6380"
export REDIS_HOST="localhost"
export REDIS_PORT=6380
export KAFKA_BROKERS="localhost:9092"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Ports
export GOLANG_V1_PORT=8080
export GOLANG_V2_PORT=3005
export NESTJS_PORT=3001
export FASTIFY_PORT=3002
export EXPRESS_PORT=3004
export FRONTEND_PORT=3000

# ═══════════════════════════════════════════════════════════════
# START APPLICATION SERVICES
# ═══════════════════════════════════════════════════════════════

echo "Starting application services..."
echo ""

# Store PIDs
declare -a PIDS=()

# Golang v1
echo "Starting Golang v1 (Port $GOLANG_V1_PORT)..."
cd services/api-golang
export SERVER_PORT=$GOLANG_V1_PORT
export PORT=$GOLANG_V1_PORT
go run main.go > "$LOG_DIR/golang-v1.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
sleep 3

# Golang v2
echo "Starting Golang v2 (Port $GOLANG_V2_PORT)..."
cd services/api-golang-v2
export PORT=$GOLANG_V2_PORT
go run cmd/main.go > "$LOG_DIR/golang-v2.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
sleep 3

# NestJS
echo "Starting NestJS (Port $NESTJS_PORT)..."
cd services/api-nest
export PORT=$NESTJS_PORT
npm run start:prod > "$LOG_DIR/nestjs.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
sleep 3

# Fastify
echo "Starting Fastify (Port $FASTIFY_PORT)..."
cd services/api-fastify
export PORT=$FASTIFY_PORT
npm run start > "$LOG_DIR/fastify.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
sleep 3

# Express
echo "Starting Express (Port $EXPRESS_PORT)..."
cd services/api-express
export PORT=$EXPRESS_PORT
npm run start > "$LOG_DIR/express.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
sleep 3

# Frontend
echo "Starting Frontend (Port $FRONTEND_PORT)..."
export PORT=$FRONTEND_PORT
npm run start > "$LOG_DIR/frontend.log" 2>&1 &
PIDS+=($!)
echo -e "${GREEN}✅ Started (PID: ${PIDS[-1]})${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

echo "Waiting for services to start..."
sleep 15
echo ""

echo "Running health checks..."
for i in {1..10}; do
    if curl -sf http://localhost:$GOLANG_V2_PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Golang v2 healthy${NC}"
        break
    fi
    echo "Waiting for Golang v2... ($i/10)"
    sleep 3
done

echo ""

# ═══════════════════════════════════════════════════════════════
# DISPLAY STATUS
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 PRODUCTION SYSTEM READY!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}🌐 FRONTEND:${NC}"
echo "   http://localhost:$FRONTEND_PORT"
echo ""
echo -e "${CYAN}📡 BACKEND APIs:${NC}"
echo "   Golang v2:  http://localhost:$GOLANG_V2_PORT"
echo "   NestJS:     http://localhost:$NESTJS_PORT"
echo "   Fastify:    http://localhost:$FASTIFY_PORT"
echo "   Express:    http://localhost:$EXPRESS_PORT"
echo ""
echo -e "${CYAN}🔧 INFRASTRUCTURE:${NC}"
echo "   Kafka UI:   http://localhost:8080"
echo "   pgAdmin:    http://localhost:5050"
echo "   MinIO:      http://localhost:9001"
echo ""
echo -e "${CYAN}📝 LOGS:${NC}"
echo "   tail -f $LOG_DIR/*.log"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Store PIDs
echo "${PIDS[@]}" > /tmp/yeelo-production-pids.txt

# Cleanup handler
cleanup() {
    echo ""
    echo "Stopping application services..."
    if [ -f /tmp/yeelo-production-pids.txt ]; then
        for pid in $(cat /tmp/yeelo-production-pids.txt); do
            kill -9 $pid 2>/dev/null || true
        done
        rm /tmp/yeelo-production-pids.txt
    fi
    echo "Services stopped. Infrastructure still running."
    exit 0
}

trap cleanup INT TERM

# Keep running
echo "Press Ctrl+C to stop application services"
echo "(Infrastructure will keep running)"
echo ""
wait
