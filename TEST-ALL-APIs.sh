#!/bin/bash

echo "🧪 Testing All API Endpoints..."
echo "================================"

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    echo -n "Testing $method $endpoint... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" == "200" ] || [ "$response" == "201" ]; then
        echo -e "${GREEN}✅ $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $response${NC}"
        return 1
    fi
}

echo ""
echo "🔍 Testing Master Data APIs..."
test_endpoint "GET" "/api/master/products"
test_endpoint "GET" "/api/master/customers"
test_endpoint "GET" "/api/master/suppliers"
test_endpoint "GET" "/api/master/categories"
test_endpoint "GET" "/api/master/brands"
test_endpoint "GET" "/api/master/units"
test_endpoint "GET" "/api/master/taxes"

echo ""
echo "📦 Testing Inventory APIs..."
test_endpoint "GET" "/api/inventory/batches"
test_endpoint "GET" "/api/inventory/low-stock"
test_endpoint "GET" "/api/inventory/expiring"

echo ""
echo "💰 Testing Sales APIs..."
test_endpoint "GET" "/api/sales/invoices"

echo ""
echo "🛒 Testing Purchase APIs..."
test_endpoint "GET" "/api/purchases/orders"

echo ""
echo "👥 Testing Customer APIs..."
test_endpoint "GET" "/api/customers"

echo ""
echo "📊 Testing Dashboard API..."
test_endpoint "GET" "/api/dashboard/stats"

echo ""
echo "================================"
echo "✅ API Testing Complete!"
echo "================================"
