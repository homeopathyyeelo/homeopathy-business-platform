#!/usr/bin/env bash
# Smoke Test Script for Homeopathy Business Platform
# Tests all services and infrastructure

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Smoke Test - Homeopathy Business Platform            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    if response=$(curl -fsS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_code" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ WARN${NC} (HTTP $response, expected $expected_code)"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Not responding)"
        ((FAILED++))
    fi
}

# Test TCP port
test_port() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "Testing $name... "
    
    if nc -z -w2 "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} (Port $port open)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Port $port closed)"
        ((FAILED++))
    fi
}

echo -e "${YELLOW}━━━ Infrastructure Services ━━━${NC}"
test_endpoint "Kafka UI" "http://localhost:8080"
test_endpoint "MinIO Console" "http://localhost:9001"
test_port "PostgreSQL" "localhost" "5433"
test_port "Redis" "localhost" "6380"
test_port "Kafka" "localhost" "9092"
echo ""

echo -e "${YELLOW}━━━ Backend APIs ━━━${NC}"
test_endpoint "Golang API" "http://localhost:3005/health"
test_endpoint "Express API" "http://localhost:3003/health"
test_endpoint "NestJS API" "http://localhost:3001/health"
test_endpoint "Fastify API" "http://localhost:3002/health"
test_endpoint "Python AI" "http://localhost:8001/health"
echo ""

echo -e "${YELLOW}━━━ Gateways ━━━${NC}"
test_endpoint "GraphQL Gateway" "http://localhost:4000"
test_endpoint "API Gateway" "http://localhost:5000/health"
echo ""

echo -e "${YELLOW}━━━ Authentication Test ━━━${NC}"
echo -n "Testing Auth Login... "
if response=$(curl -fsS -X POST "http://localhost:3005/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@yeelo.com","password":"admin123"}' 2>/dev/null); then
    
    if echo "$response" | grep -q "access_token"; then
        echo -e "${GREEN}✓ PASS${NC} (JWT token received)"
        ((PASSED++))
        TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    else
        echo -e "${RED}✗ FAIL${NC} (No token in response)"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Auth endpoint not responding)"
    ((FAILED++))
fi
echo ""

echo -e "${YELLOW}━━━ API Endpoints Test ━━━${NC}"
test_endpoint "Get Products" "http://localhost:3005/api/products"
test_endpoint "Get Customers (Auth)" "http://localhost:3005/api/customers" 401
echo ""

echo -e "${YELLOW}━━━ Swagger Documentation ━━━${NC}"
test_endpoint "Golang Swagger" "http://localhost:3005/swagger"
test_endpoint "Express Swagger" "http://localhost:3003/api-docs"
test_endpoint "NestJS Swagger" "http://localhost:3001/api"
test_endpoint "Python AI Swagger" "http://localhost:8001/docs"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi
