#!/usr/bin/env bash
# Yeelo Homeopathy Business Platform - Complete Startup Script
# This script starts your complete homeopathy business platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Yeelo Homeopathy Business Platform - Startup Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Step 1: Install dependencies
echo -e "${YELLOW}[1/6] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
else
    echo "✓ Root dependencies already installed"
fi

# Step 2: Start infrastructure (Postgres, Redis, Kafka, MinIO, AI Service)
echo ""
echo -e "${YELLOW}[2/6] Starting infrastructure services (Docker)...${NC}"
echo "  - PostgreSQL (port 5433)"
echo "  - Redis (port 6380)"
echo "  - Kafka (port 9092)"
echo "  - MinIO (port 9000, 9001)"
echo "  - AI Service (port 8001)"
echo ""

docker compose -f docker-compose.dev.yml up -d --remove-orphans

echo "Waiting for services to be ready..."
sleep 5

# Step 3: Setup database
echo ""
echo -e "${YELLOW}[3/6] Setting up database...${NC}"
cd packages/shared-db

if [ ! -d "node_modules" ]; then
    echo "Installing database package dependencies..."
    npm install
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database with initial data..."
npm run seed

cd "$ROOT_DIR"

# Step 4: Check AI Service health
echo ""
echo -e "${YELLOW}[4/6] Verifying AI Service...${NC}"
sleep 2
if curl -fsS http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AI Service is healthy${NC}"
else
    echo -e "${RED}✗ AI Service not responding (will continue anyway)${NC}"
fi

# Step 5: Start backend services
echo ""
echo -e "${YELLOW}[5/6] Starting backend services...${NC}"

# Start API Gateway (port 3000)
if ! nc -z localhost 3000 > /dev/null 2>&1; then
    echo "Starting API Gateway on port 3000..."
    cd services/api-gateway
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run dev > /tmp/api-gateway.log 2>&1 &
    cd "$ROOT_DIR"
    sleep 3
else
    echo "✓ API Gateway already running on port 3000"
fi

# Start API Fastify (port 3001)
if ! nc -z localhost 3001 > /dev/null 2>&1; then
    echo "Starting Campaigns API (Fastify) on port 3001..."
    cd services/api-fastify
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run dev > /tmp/api-fastify.log 2>&1 &
    cd "$ROOT_DIR"
    sleep 3
else
    echo "✓ Campaigns API already running on port 3001"
fi

# Start API NestJS (port 3002)
if ! nc -z localhost 3002 > /dev/null 2>&1; then
    echo "Starting Main API (NestJS) on port 3002..."
    cd services/api-nest
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run dev > /tmp/api-nest.log 2>&1 &
    cd "$ROOT_DIR"
    sleep 3
else
    echo "✓ Main API already running on port 3002"
fi

# Step 6: Start Next.js frontend
echo ""
echo -e "${YELLOW}[6/6] Starting Next.js frontend...${NC}"
if ! nc -z localhost 4000 > /dev/null 2>&1; then
    echo "Starting Next.js on port 4000..."
    PORT=4000 npm run dev:app > /tmp/nextjs.log 2>&1 &
    sleep 5
else
    echo "✓ Next.js already running on port 4000"
fi

# Final status check
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Platform Started Successfully! ✓              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access your platform:${NC}"
echo ""
echo "  🌐 Frontend (Next.js):        http://localhost:4000"
echo "  🔌 API Gateway:               http://localhost:3000"
echo "  📦 Main API (NestJS):         http://localhost:3002"
echo "  📢 Campaigns API (Fastify):   http://localhost:3001"
echo "  🤖 AI Service:                http://localhost:8001"
echo "  📊 Kafka UI:                  http://localhost:8080"
echo "  💾 MinIO Console:             http://localhost:9001"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  PostgreSQL: localhost:5433"
echo "  Database: yeelo_homeopathy"
echo "  User: postgres / Password: postgres"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  API Gateway:  tail -f /tmp/api-gateway.log"
echo "  Campaigns:    tail -f /tmp/api-fastify.log"
echo "  Main API:     tail -f /tmp/api-nest.log"
echo "  Frontend:     tail -f /tmp/nextjs.log"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "  docker compose -f docker-compose.dev.yml down"
echo "  pkill -f 'node.*next'"
echo "  pkill -f 'node.*nest'"
echo "  pkill -f 'ts-node-dev'"
echo ""
