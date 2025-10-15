#!/bin/bash

echo "🧪 Quick Health Check for Yeelo Platform"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "Infrastructure:"
echo "---------------"

# PostgreSQL
if pg_isready -h localhost -p 5433 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL (Port 5433)"
else
    echo -e "${RED}✗${NC} PostgreSQL (Port 5433)"
fi

# Redis
if redis-cli -p 6380 ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis (Port 6380)"
else
    echo -e "${RED}✗${NC} Redis (Port 6380)"
fi

# Kafka
if docker ps | grep -q "yeelo.*kafka"; then
    echo -e "${GREEN}✓${NC} Kafka (Docker)"
else
    echo -e "${RED}✗${NC} Kafka (Docker)"
fi

echo ""
echo "Backend Services:"
echo "-----------------"

# Golang API
if curl -s --connect-timeout 2 http://localhost:3004/health | grep -q "status"; then
    echo -e "${GREEN}✓${NC} Golang API (Port 3004)"
else
    echo -e "${RED}✗${NC} Golang API (Port 3004)"
fi

# Express API
if curl -s --connect-timeout 2 http://localhost:3003/health | grep -q "status"; then
    echo -e "${GREEN}✓${NC} Express API (Port 3003)"
else
    echo -e "${RED}✗${NC} Express API (Port 3003)"
fi

# AI Service
if curl -s --connect-timeout 2 http://localhost:8001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} AI Service (Port 8001)"
else
    echo -e "${RED}✗${NC} AI Service (Port 8001)"
fi

echo ""
echo "Services NOT Running:"
echo "---------------------"
echo "⚠  NestJS API (Port 3001) - Has compilation errors"
echo "⚠  Fastify API (Port 3002) - Not started"
echo "⚠  Auth Service (Port 3001) - Not implemented"
echo "⚠  GraphQL Gateway (Port 4000) - Not started"
echo "⚠  API Gateway (Port 5000) - Not started"
echo ""
echo "✅ Quick check complete!"
