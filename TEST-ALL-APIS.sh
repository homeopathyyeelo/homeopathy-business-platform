#!/bin/bash

# Test All Microservices Connectivity

echo "🧪 Testing All Microservices..."
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

test_endpoint() {
    local name=$1
    local url=$2
    
    echo -e "${BLUE}Testing $name...${NC}"
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ $response -eq 200 ]; then
        echo -e "${GREEN}✅ $name: OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAILED (HTTP $response)${NC}"
        return 1
    fi
}

echo ""
echo "📡 Testing Service Health Endpoints..."
echo ""

test_endpoint "Golang API v2 (Gin)" "http://localhost:3004/health"
test_endpoint "Express API" "http://localhost:3003/health"
test_endpoint "Fastify API" "http://localhost:3002/health"
test_endpoint "NestJS API" "http://localhost:3001/health"
test_endpoint "Python AI Service" "http://localhost:8001/health"

echo ""
echo "📦 Testing Data Endpoints..."
echo ""

test_endpoint "Golang Products" "http://localhost:3004/api/erp/products"
test_endpoint "Express Products" "http://localhost:3003/api/products"
test_endpoint "Fastify Products" "http://localhost:3002/api/products"

echo ""
echo "================================"
echo "✅ API Testing Complete!"
echo ""
