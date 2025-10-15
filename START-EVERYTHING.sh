#!/bin/bash

# Yeelo Homeopathy Platform - Complete Startup Script
echo "🚀 Starting Yeelo Homeopathy Platform..."
cd "$(dirname "$0")"

# Set environment variables
export KAFKAJS_NO_PARTITIONER_WARNING=1
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export REDIS_URL="redis://localhost:6380"
export KAFKA_BROKERS="localhost:9092"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready at $url${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Stop any existing processes
echo "🛑 Stopping any existing services..."
pkill -f "go run" || true
pkill -f "node.*api" || true
pkill -f "npm run dev" || true
pkill -f "npm start" || true
sleep 2

# Start Docker infrastructure
echo "🐳 Starting Docker infrastructure..."
./START-INFRA.sh
sleep 10

# Clear old logs
rm -f /tmp/*-api.log

# Store PIDs
declare -a PIDS=()

echo ""
echo "🌐 Starting Backend Services..."
echo "================================"

# 1. Auth Service (Port 3001)
echo -e "${YELLOW}Starting Auth Service on port 3001...${NC}"
cd services/auth-service
PORT=3001 npm start > /tmp/auth-api.log 2>&1 &
AUTH_PID=$!
PIDS+=($AUTH_PID)
cd ../..
sleep 2

# 2. NestJS API (Port 3002)
echo -e "${YELLOW}Starting NestJS API on port 3002...${NC}"
cd services/api-nest
PORT=3002 npm run start:prod > /tmp/nestjs-api.log 2>&1 &
NESTJS_PID=$!
PIDS+=($NESTJS_PID)
cd ../..
sleep 2

# 3. Express API (Port 3003)
echo -e "${YELLOW}Starting Express API on port 3003...${NC}"
cd services/api-express
PORT=3003 node src/index-complete.js > /tmp/express-api.log 2>&1 &
EXPRESS_PID=$!
PIDS+=($EXPRESS_PID)
cd ../..
sleep 2

# 4. Golang API (Port 3004)
echo -e "${YELLOW}Starting Golang API on port 3004...${NC}"
cd services/api-golang
PORT=3004 go run . > /tmp/golang-api.log 2>&1 &
GOLANG_PID=$!
PIDS+=($GOLANG_PID)
cd ../..
sleep 2

# 5. AI Service already running in Docker (Port 8001)
echo -e "${GREEN}✅ AI Service running in Docker on port 8001${NC}"

echo ""
echo "🎨 Starting Frontend..."
echo "======================"

# 6. Next.js Frontend (Port 3000)
echo -e "${YELLOW}Starting Next.js Frontend on port 3000...${NC}"
npm run dev:app > /tmp/nextjs-frontend.log 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
sleep 5

echo ""
echo "🔍 Checking Service Health..."
echo "=============================="

# Wait for services to be ready
wait_for_service "http://localhost:3001/health" "Auth Service"
wait_for_service "http://localhost:3002/health" "NestJS API"
wait_for_service "http://localhost:3003/health" "Express API"
wait_for_service "http://localhost:3004/health" "Golang API"
wait_for_service "http://localhost:8001/health" "AI Service"
wait_for_service "http://localhost:3000" "Next.js Frontend"

# Display status
echo ""
echo "🎉 Yeelo Homeopathy Platform Started!"
echo "=========================================="
echo -e "${GREEN}🌐 Frontend:${NC}           http://localhost:3000"
echo ""
echo -e "${GREEN}📡 Backend APIs:${NC}"
echo "  🔐 Auth Service:       http://localhost:3001"
echo "     Docs:              http://localhost:3001/docs"
echo "     JWKS:              http://localhost:3001/.well-known/jwks.json"
echo ""
echo "  🏗️  NestJS API:         http://localhost:3002"
echo "     Docs:              http://localhost:3002/docs"
echo "     Features:          Orders, Inventory, Purchase, Finance, B2B, AI"
echo ""
echo "  ⚡ Express API:        http://localhost:3003"
echo "     Docs:              http://localhost:3003/api-docs"
echo ""
echo "  🔧 Golang API:         http://localhost:3004"
echo "     Swagger:           http://localhost:3004/swagger"
echo ""
echo "  🤖 AI Service:         http://localhost:8001"
echo "     Docs:              http://localhost:8001/docs"
echo ""
echo -e "${GREEN}🔧 Infrastructure:${NC}"
echo "  📋 Kafka UI:           http://localhost:8080"
echo "  💾 MinIO Console:      http://localhost:9001 (minio/minio123)"
echo "  🗄️  PostgreSQL:         localhost:5433 (postgres/postgres)"
echo "  📦 Redis:              localhost:6380"
echo "  📨 Kafka:              localhost:9092"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "  tail -f /tmp/auth-api.log"
echo "  tail -f /tmp/nestjs-api.log"
echo "  tail -f /tmp/express-api.log"
echo "  tail -f /tmp/golang-api.log"
echo "  tail -f /tmp/nextjs-frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC} Press Ctrl+C"
echo ""

# Store PIDs for cleanup
echo "${PIDS[@]}" > /tmp/yeelo-pids.txt

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    if [ -f /tmp/yeelo-pids.txt ]; then
        for pid in $(cat /tmp/yeelo-pids.txt); do
            kill $pid 2>/dev/null || true
        done
        rm /tmp/yeelo-pids.txt
    fi
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running and monitor services
echo "✨ All services are running! Monitoring..."
echo ""
echo "Press Ctrl+C to stop all services"

# Just wait for Ctrl+C
wait
