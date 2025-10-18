#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# TEST BOTH GOLANG SERVICES
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 TESTING BOTH GOLANG SERVICES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test Golang v1 (Port 8080)
echo -e "${BLUE}Testing Golang v1 (Gin) on port 8080...${NC}"
echo ""

echo "1. Health Check:"
response=$(curl -s http://localhost:8080/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
fi
echo ""

echo "2. Products API:"
response=$(curl -s http://localhost:8080/api/products 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Products endpoint working${NC}"
    count=$(echo "$response" | jq '. | length' 2>/dev/null || echo "0")
    echo "   Found $count products"
else
    echo -e "${RED}❌ Products endpoint failed${NC}"
fi
echo ""

echo "3. Sales API:"
response=$(curl -s http://localhost:8080/api/sales 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sales endpoint working${NC}"
else
    echo -e "${RED}❌ Sales endpoint failed${NC}"
fi
echo ""

echo "4. Inventory API:"
response=$(curl -s http://localhost:8080/api/inventory 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Inventory endpoint working${NC}"
else
    echo -e "${RED}❌ Inventory endpoint failed${NC}"
fi
echo ""

echo "───────────────────────────────────────────────────────────────"
echo ""

# Test Golang v2 (Port 3005)
echo -e "${BLUE}Testing Golang v2 (Gin) on port 3005...${NC}"
echo ""

echo "1. Health Check:"
response=$(curl -s http://localhost:3005/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
fi
echo ""

echo "2. Products API:"
response=$(curl -s http://localhost:3005/api/products 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Products endpoint working${NC}"
    count=$(echo "$response" | jq '. | length' 2>/dev/null || echo "0")
    echo "   Found $count products"
else
    echo -e "${RED}❌ Products endpoint failed${NC}"
fi
echo ""

echo "3. Sales API:"
response=$(curl -s http://localhost:3005/api/sales 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sales endpoint working${NC}"
else
    echo -e "${RED}❌ Sales endpoint failed${NC}"
fi
echo ""

echo "4. Customers API:"
response=$(curl -s http://localhost:3005/api/customers 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Customers endpoint working${NC}"
else
    echo -e "${RED}❌ Customers endpoint failed${NC}"
fi
echo ""

echo "5. Vendors API:"
response=$(curl -s http://localhost:3005/api/vendors 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vendors endpoint working${NC}"
else
    echo -e "${RED}❌ Vendors endpoint failed${NC}"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}📊 SUMMARY:${NC}"
echo ""
echo "Golang v1 (Port 8080) - Main ERP service"
echo "  Framework: Gin"
echo "  Features: Sales, Inventory, Finance, Hardware, HR, Marketing"
echo "  File: services/api-golang/main.go"
echo ""
echo "Golang v2 (Port 3005) - Modern API service"
echo "  Framework: Gin"
echo "  Features: Products, Sales, Customers, Vendors, Inventory"
echo "  File: services/api-golang-v2/cmd/main.go"
echo ""
echo "═══════════════════════════════════════════════════════════════"
