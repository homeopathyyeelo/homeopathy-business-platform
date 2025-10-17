#!/bin/bash

# Start All Microservices for Homeopathy ERP Platform
# This script starts all backend services with proper configuration

set -e

echo "🚀 Starting Homeopathy ERP Platform - All Microservices"
echo "========================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}📊 Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Starting infrastructure...${NC}"
    ./START-INFRA.sh
    sleep 5
fi

# Export environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export REDIS_URL="redis://localhost:6380"
export KAFKA_BROKERS="localhost:9092"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"

echo -e "${GREEN}✅ Infrastructure ready${NC}"
echo ""

# Start Golang API v2 (Gin) - Port 3004
echo -e "${BLUE}🔷 Starting Golang API v2 (Gin) on port 3004...${NC}"
cd services/api-golang-v2
export PORT=3004
go run cmd/main.go &
GOLANG_PID=$!
echo -e "${GREEN}✅ Golang API v2 started (PID: $GOLANG_PID)${NC}"
cd ../..

sleep 2

# Start Express API - Port 3003
echo -e "${BLUE}🟢 Starting Express API on port 3003...${NC}"
cd services/api-express
export PORT=3003
node src/index.js &
EXPRESS_PID=$!
echo -e "${GREEN}✅ Express API started (PID: $EXPRESS_PID)${NC}"
cd ../..

sleep 2

# Start Fastify API - Port 3002
echo -e "${BLUE}⚡ Starting Fastify API on port 3002...${NC}"
cd services/api-fastify
export PORT=3002
npm run dev &
FASTIFY_PID=$!
echo -e "${GREEN}✅ Fastify API started (PID: $FASTIFY_PID)${NC}"
cd ../..

sleep 2

# Start NestJS API - Port 3001
echo -e "${BLUE}🔴 Starting NestJS API on port 3001...${NC}"
cd services/api-nest
export PORT=3001
npm run start:dev &
NEST_PID=$!
echo -e "${GREEN}✅ NestJS API started (PID: $NEST_PID)${NC}"
cd ../..

sleep 2

# Start Python AI Service - Port 8001
echo -e "${BLUE}🐍 Starting Python AI Service on port 8001...${NC}"
cd services/ai-service
export PORT=8001
python -m uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload &
PYTHON_PID=$!
echo -e "${GREEN}✅ Python AI Service started (PID: $PYTHON_PID)${NC}"
cd ../..

sleep 3

echo ""
echo "========================================================"
echo -e "${GREEN}🎉 All Microservices Started Successfully!${NC}"
echo "========================================================"
echo ""
echo "📡 Service Endpoints:"
echo "  - Golang API v2 (Gin):     http://localhost:3004"
echo "  - Express API:             http://localhost:3003"
echo "  - Fastify API:             http://localhost:3002"
echo "  - NestJS API:              http://localhost:3001"
echo "  - Python AI Service:       http://localhost:8001"
echo ""
echo "🔍 Health Check URLs:"
echo "  - Golang:  curl http://localhost:3004/health"
echo "  - Express: curl http://localhost:3003/health"
echo "  - Fastify: curl http://localhost:3002/health"
echo "  - NestJS:  curl http://localhost:3001/health"
echo "  - Python:  curl http://localhost:8001/health"
echo ""
echo "📝 Process IDs:"
echo "  - Golang:  $GOLANG_PID"
echo "  - Express: $EXPRESS_PID"
echo "  - Fastify: $FASTIFY_PID"
echo "  - NestJS:  $NEST_PID"
echo "  - Python:  $PYTHON_PID"
echo ""
echo "🛑 To stop all services, run: ./STOP-ALL-APIS.sh"
echo ""

# Save PIDs to file for cleanup
echo "$GOLANG_PID $EXPRESS_PID $FASTIFY_PID $NEST_PID $PYTHON_PID" > .api-pids

# Wait for all background processes
wait
