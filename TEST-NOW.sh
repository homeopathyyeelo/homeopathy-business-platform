#!/bin/bash

# Quick test command - checks if services are running and runs tests

clear
echo "════════════════════════════════════════════════════════════════"
echo "🧪 QUICK SYSTEM TEST"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if services are running
echo "Checking if services are running..."
echo ""

services_running=true

if ! lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${RED}❌ Golang v1 (8080) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ Golang v1 (8080)${NC}"
fi

if ! lsof -i:3005 > /dev/null 2>&1; then
    echo -e "${RED}❌ Golang v2 (3005) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ Golang v2 (3005)${NC}"
fi

if ! lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${RED}❌ NestJS (3001) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ NestJS (3001)${NC}"
fi

if ! lsof -i:3002 > /dev/null 2>&1; then
    echo -e "${RED}❌ Fastify (3002) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ Fastify (3002)${NC}"
fi

if ! lsof -i:3004 > /dev/null 2>&1; then
    echo -e "${RED}❌ Express (3004) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ Express (3004)${NC}"
fi

if ! lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend (3000) not running${NC}"
    services_running=false
else
    echo -e "${GREEN}✅ Frontend (3000)${NC}"
fi

echo ""

if [ "$services_running" = false ]; then
    echo -e "${YELLOW}⚠️  Some services are not running${NC}"
    echo ""
    echo "Start services with:"
    echo "  ./START-EVERYTHING.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ All services are running!${NC}"
echo ""
echo "Running comprehensive tests..."
echo ""
sleep 2

# Run the master test
./RUN-ALL-TESTS.sh
