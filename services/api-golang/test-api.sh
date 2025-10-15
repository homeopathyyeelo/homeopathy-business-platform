#!/bin/bash

# test-api.sh
# Test script for Golang API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3004"

echo -e "${BLUE}🧪 Testing Golang API${NC}"
echo "========================================"
echo ""

# Test 1: Health Check
echo -n "Test 1: Health Check... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
fi

# Test 2: Get Products
echo -n "Test 2: Get Products... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/products")
if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
fi

# Test 3: Login
echo -n "Test 3: Login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yeelo.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test 4: Get Me (with auth)
if [ -n "$TOKEN" ]; then
    echo -n "Test 4: Get Me (authenticated)... "
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/me" \
      -H "Authorization: Bearer $TOKEN")
    if [ "$RESPONSE" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
    fi
fi

# Test 5: Get Customers (with auth)
if [ -n "$TOKEN" ]; then
    echo -n "Test 5: Get Customers (authenticated)... "
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/customers" \
      -H "Authorization: Bearer $TOKEN")
    if [ "$RESPONSE" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
    fi
fi

# Test 6: Get Orders (with auth)
if [ -n "$TOKEN" ]; then
    echo -n "Test 6: Get Orders (authenticated)... "
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/orders" \
      -H "Authorization: Bearer $TOKEN")
    if [ "$RESPONSE" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
    fi
fi

# Test 7: Get Analytics Dashboard (with auth)
if [ -n "$TOKEN" ]; then
    echo -n "Test 7: Get Analytics Dashboard (authenticated)... "
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/analytics/dashboard" \
      -H "Authorization: Bearer $TOKEN")
    if [ "$RESPONSE" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
    fi
fi

# Test 8: Swagger UI
echo -n "Test 8: Swagger UI... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/swagger")
if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $RESPONSE)"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "API Endpoints:"
echo "  Health:    $API_URL/health"
echo "  Swagger:   $API_URL/swagger"
echo "  Products:  $API_URL/api/products"
echo ""
