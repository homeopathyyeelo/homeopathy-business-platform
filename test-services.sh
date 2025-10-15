#!/bin/bash

# test-services.sh
# Test all services are running and responding

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing All Services${NC}"
echo "========================================"
echo ""

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response, expected $expected_code)"
        return 1
    fi
}

# Function to test TCP port
test_port() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "Testing $name... "
    
    if nc -z -w5 "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC} (Port $port open)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Port $port closed)"
        return 1
    fi
}

# Track failures
FAILED=0

echo -e "${YELLOW}Frontend Services:${NC}"
test_endpoint "Next.js App" "http://localhost:3000" || ((FAILED++))
echo ""

echo -e "${YELLOW}Backend APIs:${NC}"
test_endpoint "NestJS API" "http://localhost:3001/health" || ((FAILED++))
test_endpoint "Fastify API" "http://localhost:3002/health" || ((FAILED++))
test_endpoint "Express API" "http://localhost:3003/health" || ((FAILED++))
test_endpoint "Golang API" "http://localhost:3004/health" || ((FAILED++))
test_endpoint "Python AI Service" "http://localhost:8001/health" || ((FAILED++))
echo ""

echo -e "${YELLOW}Gateways:${NC}"
test_endpoint "GraphQL Gateway" "http://localhost:4000" || ((FAILED++))
test_endpoint "API Gateway" "http://localhost:5000/health" || ((FAILED++))
echo ""

echo -e "${YELLOW}Swagger Documentation:${NC}"
test_endpoint "NestJS Swagger" "http://localhost:3001/api" || ((FAILED++))
test_endpoint "Fastify Swagger" "http://localhost:3002/documentation" || ((FAILED++))
test_endpoint "Express Swagger" "http://localhost:3003/api-docs" || ((FAILED++))
test_endpoint "Python AI Swagger" "http://localhost:8001/docs" || ((FAILED++))
echo ""

echo -e "${YELLOW}Infrastructure:${NC}"
test_port "PostgreSQL" "localhost" "5433" || ((FAILED++))
test_port "Redis" "localhost" "6380" || ((FAILED++))
test_port "Kafka" "localhost" "9092" || ((FAILED++))
test_port "Zookeeper" "localhost" "2181" || ((FAILED++))
test_port "MinIO" "localhost" "9000" || ((FAILED++))
echo ""

echo -e "${YELLOW}Monitoring:${NC}"
test_endpoint "Kafka UI" "http://localhost:8080" || ((FAILED++))
test_endpoint "Schema Registry" "http://localhost:8081" || ((FAILED++))
test_endpoint "MinIO Console" "http://localhost:9001" || ((FAILED++))
echo ""

# Summary
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Platform is fully operational!${NC}"
    echo ""
    echo "Access points:"
    echo "  • Frontend:    http://localhost:3000"
    echo "  • GraphQL:     http://localhost:4000"
    echo "  • Kafka UI:    http://localhost:8080"
    echo "  • API Docs:    http://localhost:3001/api"
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if all services are running:"
    echo "     docker-compose -f docker-compose.master.yml ps"
    echo ""
    echo "  2. View logs for failed services:"
    echo "     docker-compose -f docker-compose.master.yml logs [service-name]"
    echo ""
    echo "  3. Restart services:"
    echo "     ./START-ALL-SERVICES.sh"
    exit 1
fi
