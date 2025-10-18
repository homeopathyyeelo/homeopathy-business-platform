#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SIMPLE START - JUST WHAT WORKS
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")"
mkdir -p logs

echo "════════════════════════════════════════════════════════════════"
echo "🚀 STARTING SERVICES"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Kill old
pkill -9 -f "go run" 2>/dev/null || true
pkill -9 -f "node.*dist" 2>/dev/null || true
pkill -9 -f "next" 2>/dev/null || true
sleep 2

# Env
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export REDIS_URL="redis://localhost:6380"
export KAFKA_BROKERS="localhost:9092"
export KAFKAJS_NO_PARTITIONER_WARNING=1

PIDS=()

# Golang v2
echo "Starting Golang v2..."
cd services/api-golang-v2
PORT=3005 nohup go run cmd/main.go > ../logs/golang-v2.log 2>&1 &
PIDS+=($!)
cd ../..
sleep 3

# NestJS  
echo "Starting NestJS..."
cd services/api-nest
PORT=3001 nohup npm run start:prod > ../logs/nestjs.log 2>&1 &
PIDS+=($!)
cd ../..
sleep 3

# Fastify
echo "Starting Fastify..."
cd services/api-fastify
PORT=3002 nohup npm run start > ../logs/fastify.log 2>&1 &
PIDS+=($!)
cd ../..
sleep 3

# Express
echo "Starting Express..."
cd services/api-express
PORT=3004 nohup npm run start > ../logs/express.log 2>&1 &
PIDS+=($!)
cd ../..
sleep 3

# Frontend
echo "Starting Frontend..."
PORT=3000 nohup npx next start > logs/frontend.log 2>&1 &
PIDS+=($!)

echo ""
echo "Waiting 20 seconds..."
sleep 20

echo ""
echo "Testing..."
curl -sf http://localhost:3005/health && echo -e "${GREEN}✅ Golang v2${NC}" || echo -e "${RED}❌ Golang v2${NC}"
curl -sf http://localhost:3001/health && echo -e "${GREEN}✅ NestJS${NC}" || echo -e "${RED}❌ NestJS${NC}"
curl -sf http://localhost:3002/health && echo -e "${GREEN}✅ Fastify${NC}" || echo -e "${RED}❌ Fastify${NC}"
curl -sf http://localhost:3004/health && echo -e "${GREEN}✅ Express${NC}" || echo -e "${RED}❌ Express${NC}"
curl -sf http://localhost:3000 && echo -e "${GREEN}✅ Frontend${NC}" || echo -e "${RED}❌ Frontend${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}SERVICES STARTED${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Frontend:   http://localhost:3000"
echo "Golang v2:  http://localhost:3005/health"
echo "NestJS:     http://localhost:3001/health"
echo "Fastify:    http://localhost:3002/health"
echo "Express:    http://localhost:3004/health"
echo ""
echo "Logs: tail -f logs/*.log"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "${PIDS[@]}" > /tmp/yeelo-pids.txt

cleanup() {
    echo "Stopping..."
    for pid in $(cat /tmp/yeelo-pids.txt 2>/dev/null); do
        kill -9 $pid 2>/dev/null || true
    done
    rm -f /tmp/yeelo-pids.txt
    exit 0
}

trap cleanup INT TERM

echo "Press Ctrl+C to stop"
wait
