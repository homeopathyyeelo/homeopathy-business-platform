#!/bin/bash

# Complete Frontend-Backend Integration Test
# Tests all Next.js pages with Golang, NestJS, Fastify, and Python AI services

set -e

echo "🧪 Testing Frontend-Backend Integration"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Service URLs
GOLANG_V2_URL="http://localhost:3004"
GOLANG_V1_URL="http://localhost:3005"
NEST_URL="http://localhost:3001"
FASTIFY_URL="http://localhost:3002"
PYTHON_URL="http://localhost:8001"
GRAPHQL_URL="http://localhost:4000/graphql"
NEXTJS_URL="http://localhost:3000"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $response)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test API with data
test_api_data() {
    local name=$1
    local url=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "success\|data\|id" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC} (Data received)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (No data)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo ""
echo "=================================================="
echo "STEP 1: Testing Backend Services Health"
echo "=================================================="
echo ""

test_endpoint "Golang v2 (Gin) Health" "$GOLANG_V2_URL/health"
test_endpoint "Golang v1 (Fiber) Health" "$GOLANG_V1_URL/health"
test_endpoint "NestJS Health" "$NEST_URL/health"
test_endpoint "Fastify Health" "$FASTIFY_URL/health"
test_endpoint "Python AI Health" "$PYTHON_URL/health"

echo ""
echo "=================================================="
echo "STEP 2: Testing Golang v2 API Endpoints (Core ERP)"
echo "=================================================="
echo ""

test_api_data "Products API" "$GOLANG_V2_URL/api/erp/products"
test_api_data "Sales API" "$GOLANG_V2_URL/api/erp/sales"
test_api_data "Inventory API" "$GOLANG_V2_URL/api/erp/inventory"
test_api_data "Customers API" "$GOLANG_V2_URL/api/erp/customers"
test_api_data "Dashboard API" "$GOLANG_V2_URL/api/erp/dashboard"

echo ""
echo "=================================================="
echo "STEP 3: Testing Golang v1 API Endpoints (Workflows)"
echo "=================================================="
echo ""

test_api_data "Workflows API" "$GOLANG_V1_URL/api/workflows"
test_api_data "Offline Status API" "$GOLANG_V1_URL/api/offline/status"
test_api_data "Company Profile API" "$GOLANG_V1_URL/api/company/profile"

echo ""
echo "=================================================="
echo "STEP 4: Testing NestJS API Endpoints (Enterprise)"
echo "=================================================="
echo ""

test_api_data "Vendors API" "$NEST_URL/purchase/vendors"
test_api_data "Purchase Orders API" "$NEST_URL/purchase/orders"
test_api_data "Finance Invoices API" "$NEST_URL/finance/invoices"
test_api_data "HR Employees API" "$NEST_URL/hr/employees"

echo ""
echo "=================================================="
echo "STEP 5: Testing Fastify API Endpoints (Marketing)"
echo "=================================================="
echo ""

test_api_data "Campaigns API" "$FASTIFY_URL/api/campaigns"
test_api_data "Templates API" "$FASTIFY_URL/api/templates"
test_api_data "Coupons API" "$FASTIFY_URL/api/coupons"

echo ""
echo "=================================================="
echo "STEP 6: Testing Python AI API Endpoints"
echo "=================================================="
echo ""

test_api_data "AI Insights API" "$PYTHON_URL/api/insights/daily"
test_api_data "Analytics Dashboard API" "$PYTHON_URL/api/analytics/dashboard"

echo ""
echo "=================================================="
echo "STEP 7: Testing GraphQL Gateway"
echo "=================================================="
echo ""

# Test GraphQL health query
GRAPHQL_QUERY='{"query": "{ health { status } }"}'
echo -n "Testing GraphQL Health Query... "
response=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d "$GRAPHQL_QUERY" 2>/dev/null)

if echo "$response" | grep -q "ok\|health" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "=================================================="
echo "STEP 8: Testing Next.js Frontend Pages"
echo "=================================================="
echo ""

# Test critical Next.js pages
test_endpoint "Dashboard Page" "$NEXTJS_URL/dashboard"
test_endpoint "Products Page" "$NEXTJS_URL/products"
test_endpoint "Sales Page" "$NEXTJS_URL/sales"
test_endpoint "Inventory Page" "$NEXTJS_URL/inventory"
test_endpoint "Customers Page" "$NEXTJS_URL/customers"
test_endpoint "Purchases Page" "$NEXTJS_URL/purchases"
test_endpoint "Finance Page" "$NEXTJS_URL/finance"
test_endpoint "Marketing Page" "$NEXTJS_URL/marketing/campaigns"
test_endpoint "AI Insights Page" "$NEXTJS_URL/ai-insights"
test_endpoint "Analytics Page" "$NEXTJS_URL/analytics"

echo ""
echo "=================================================="
echo "STEP 9: Testing Data Flow (Create → Read)"
echo "=================================================="
echo ""

# Test creating a product
echo -n "Testing Product Creation... "
create_response=$(curl -s -X POST "$GOLANG_V2_URL/api/erp/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "price": 100,
    "stock": 50,
    "category": "Test Category"
  }' 2>/dev/null)

if echo "$create_response" | grep -q "success\|id" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Extract product ID and test retrieval
    product_id=$(echo "$create_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$product_id" ]; then
        echo -n "Testing Product Retrieval... "
        get_response=$(curl -s "$GOLANG_V2_URL/api/erp/products/$product_id" 2>/dev/null)
        
        if echo "$get_response" | grep -q "Test Product" 2>/dev/null; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "=================================================="
echo "STEP 10: Testing API Client Integration"
echo "=================================================="
echo ""

# Check if api-complete.ts exists
if [ -f "lib/api-complete.ts" ]; then
    echo -e "${GREEN}✅ API Client exists${NC} (lib/api-complete.ts)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ API Client missing${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check if hooks are using API client
if grep -r "api-complete" lib/hooks/ 2>/dev/null | grep -q "import"; then
    echo -e "${GREEN}✅ Hooks using API Client${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Hooks may not be using API Client${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Frontend is properly connected to all backend services"
    echo "✅ Data fetching works across all modules"
    echo "✅ API client integration is complete"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the failed tests above and ensure:"
    echo "1. All backend services are running"
    echo "2. Database is accessible"
    echo "3. API endpoints are correctly configured"
    echo "4. Next.js is running on port 3000"
    echo ""
    exit 1
fi
