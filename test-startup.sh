#!/bin/bash

# Quick test to verify all services start correctly
echo "🧪 Testing Service Startup..."
cd "$(dirname "$0")"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if infrastructure is running
echo "Checking infrastructure..."
if ! docker ps | grep -q "yeelo-postgres"; then
    echo -e "${RED}❌ Infrastructure not running. Run ./START-INFRA.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure running${NC}"

# Test each service port
echo ""
echo "Testing service ports..."

test_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port is in use ($name)${NC}"
        
        # Try to get health check
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            echo -e "${GREEN}   Health check OK${NC}"
        else
            echo -e "${RED}   No health endpoint${NC}"
        fi
    else
        echo -e "${RED}❌ Port $port is free ($name not running)${NC}"
    fi
}

test_port 3001 "Auth Service"
test_port 3002 "NestJS API"
test_port 3003 "Express API"
test_port 3004 "Golang API"
test_port 8001 "AI Service"
test_port 3000 "Frontend"

echo ""
echo "Testing infrastructure ports..."
test_port 5433 "PostgreSQL"
test_port 6380 "Redis"
test_port 9092 "Kafka"
test_port 8080 "Kafka UI"

echo ""
echo "✅ Startup test complete!"
