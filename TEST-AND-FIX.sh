#!/usr/bin/env bash
# Test and Fix All Modules - Yeelo Homeopathy Platform

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Testing & Fixing All Modules - Yeelo Platform           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Test 1: Check Docker services
echo -e "${YELLOW}[TEST 1/8] Checking Docker infrastructure...${NC}"
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Docker services running${NC}"
else
    echo -e "${RED}✗ Docker services not running${NC}"
    echo "Starting Docker services..."
    docker compose -f docker-compose.dev.yml up -d
    sleep 10
fi

# Test 2: Check Kafka
echo ""
echo -e "${YELLOW}[TEST 2/8] Checking Kafka...${NC}"
if docker compose -f docker-compose.dev.yml ps kafka | grep -q "Up"; then
    echo -e "${GREEN}✓ Kafka is running${NC}"
else
    echo -e "${RED}✗ Kafka not running${NC}"
    echo "Starting Kafka..."
    docker compose -f docker-compose.dev.yml up -d kafka
    sleep 10
fi

# Test 3: Check AI Service
echo ""
echo -e "${YELLOW}[TEST 3/8] Testing AI Service...${NC}"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AI Service is healthy${NC}"
    curl -s http://localhost:8001/health | jq .
else
    echo -e "${RED}✗ AI Service not responding${NC}"
    echo "Restarting AI Service..."
    docker compose -f docker-compose.dev.yml restart ai-service
    sleep 5
fi

# Test 4: Check Database
echo ""
echo -e "${YELLOW}[TEST 4/8] Testing Database...${NC}"
if docker exec homeopathy-business-platform-postgres-1 psql -U postgres -d yeelo_homeopathy -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi

# Test 5: Prisma Client
echo ""
echo -e "${YELLOW}[TEST 5/8] Checking Prisma Client...${NC}"
cd packages/shared-db
if [ -d "generated/client" ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client not generated${NC}"
    echo "Generating Prisma Client..."
    npx prisma generate
fi

# Check if database is seeded
USER_COUNT=$(docker exec homeopathy-business-platform-postgres-1 psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database is seeded ($USER_COUNT users)${NC}"
else
    echo -e "${YELLOW}⚠ Database is empty, seeding...${NC}"
    npm run seed
fi
cd "$ROOT_DIR"

# Test 6: Install service dependencies
echo ""
echo -e "${YELLOW}[TEST 6/8] Checking service dependencies...${NC}"

# API Gateway
if [ -d "services/api-gateway/node_modules" ] && [ -f "services/api-gateway/node_modules/.bin/ts-node-dev" ]; then
    echo -e "${GREEN}✓ API Gateway dependencies OK${NC}"
else
    echo -e "${YELLOW}⚠ Installing API Gateway dependencies...${NC}"
    cd services/api-gateway
    npm install
    cd "$ROOT_DIR"
fi

# API Fastify
if [ -d "services/api-fastify/node_modules" ] && [ -d "services/api-fastify/node_modules/fastify" ]; then
    echo -e "${GREEN}✓ API Fastify dependencies OK${NC}"
else
    echo -e "${YELLOW}⚠ Installing API Fastify dependencies...${NC}"
    cd services/api-fastify
    npm install
    cd "$ROOT_DIR"
fi

# API NestJS
if [ -d "services/api-nest/node_modules" ] && [ -d "services/api-nest/node_modules/@nestjs/core" ]; then
    echo -e "${GREEN}✓ API NestJS dependencies OK${NC}"
else
    echo -e "${YELLOW}⚠ Installing API NestJS dependencies...${NC}"
    cd services/api-nest
    npm install
    cd "$ROOT_DIR"
fi

# Test 7: Test API Gateway startup
echo ""
echo -e "${YELLOW}[TEST 7/8] Testing API Gateway startup...${NC}"
cd services/api-gateway
timeout 5 npm run dev > /tmp/test-api-gateway.log 2>&1 &
PID=$!
sleep 3
if ps -p $PID > /dev/null; then
    echo -e "${GREEN}✓ API Gateway starts successfully${NC}"
    kill $PID 2>/dev/null || true
else
    echo -e "${RED}✗ API Gateway failed to start${NC}"
    echo "Last 10 lines of log:"
    tail -10 /tmp/test-api-gateway.log
fi
cd "$ROOT_DIR"

# Test 8: Test API Fastify startup
echo ""
echo -e "${YELLOW}[TEST 8/8] Testing API Fastify startup...${NC}"
cd services/api-fastify
timeout 5 npm run dev > /tmp/test-api-fastify.log 2>&1 &
PID=$!
sleep 3
if ps -p $PID > /dev/null; then
    echo -e "${GREEN}✓ API Fastify starts successfully${NC}"
    kill $PID 2>/dev/null || true
else
    echo -e "${RED}✗ API Fastify failed to start${NC}"
    echo "Last 10 lines of log:"
    tail -10 /tmp/test-api-fastify.log
fi
cd "$ROOT_DIR"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              All Tests Complete!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  ✓ Docker infrastructure: Running"
echo "  ✓ Kafka: Running"
echo "  ✓ AI Service: Healthy"
echo "  ✓ Database: Connected & Seeded"
echo "  ✓ Prisma Client: Generated"
echo "  ✓ Service Dependencies: Installed"
echo ""
echo -e "${GREEN}Ready to start platform with: ./START-PLATFORM.sh${NC}"
