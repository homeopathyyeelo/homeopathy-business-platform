#!/bin/bash

echo "🧪 TESTING ALL API ENDPOINTS"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo -e "${BLUE}Testing: $name${NC}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "201" ]; then
        echo -e "${GREEN}✅ $name - OK (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ $name - FAILED (HTTP $response)${NC}"
    fi
    echo ""
}

echo "Testing Golang v2 APIs (Port 3005)..."
test_endpoint "Products API" "http://localhost:3005/api/products"
test_endpoint "Customers API" "http://localhost:3005/api/customers"
test_endpoint "Vendors API" "http://localhost:3005/api/vendors"
test_endpoint "Sales API" "http://localhost:3005/api/sales"
test_endpoint "Inventory API" "http://localhost:3005/api/inventory"

echo "Testing NestJS APIs (Port 3001)..."
test_endpoint "Purchase Vendors API" "http://localhost:3001/purchase/vendors"
test_endpoint "Purchase Orders API" "http://localhost:3001/purchase/orders"
test_endpoint "Purchase GRN API" "http://localhost:3001/purchase/grn"

echo "Testing Fastify APIs (Port 3002)..."
test_endpoint "Marketing Campaigns API" "http://localhost:3002/api/campaigns"
test_endpoint "Marketing Templates API" "http://localhost:3002/api/templates"
test_endpoint "Marketing Coupons API" "http://localhost:3002/api/coupons"

echo "Testing Express APIs (Port 3004)..."
test_endpoint "Orders API" "http://localhost:3004/api/orders"

echo ""
echo "=============================="
echo "✅ API Testing Complete!"
echo "=============================="
