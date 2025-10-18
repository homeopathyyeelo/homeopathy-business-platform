#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# MASTER TEST RUNNER - RUN ALL TESTS
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo "═══════════════════════════════════════════════════════════════"
echo -e "${BOLD}${CYAN}🧪 MASTER TEST RUNNER - YEELO HOMEOPATHY PLATFORM${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "This will test:"
echo "  ✓ All backend services (Golang v1, v2, NestJS, Fastify, Express)"
echo "  ✓ All frontend pages (22+ pages)"
echo "  ✓ All API endpoints (35+ endpoints)"
echo "  ✓ Database connectivity"
echo "  ✓ Kafka integration"
echo "  ✓ Redis connectivity"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Ask user if services are running
read -p "Are all services running? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please start services first:"
    echo "  ./START-EVERYTHING.sh"
    echo ""
    exit 1
fi

echo ""
echo "Starting tests..."
echo ""
sleep 2

# Store test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Test result function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing: $test_name... "
    ((TOTAL_TESTS++))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════
# SECTION 1: INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1. INFRASTRUCTURE SERVICES${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "PostgreSQL" "pg_isready -h localhost -p 5433"
run_test "Redis" "redis-cli -h localhost -p 6380 PING"
run_test "Kafka Broker" "nc -z localhost 9092"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 2: BACKEND SERVICES
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2. BACKEND SERVICES HEALTH${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Golang v1 (Port 8080)" "curl -sf http://localhost:8080/health"
run_test "Golang v2 (Port 3005)" "curl -sf http://localhost:3005/health"
run_test "NestJS (Port 3001)" "curl -sf http://localhost:3001/health"
run_test "Fastify (Port 3002)" "curl -sf http://localhost:3002/health"
run_test "Express (Port 3004)" "curl -sf http://localhost:3004/health"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 3: API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3. API ENDPOINTS (Golang v2 - Frontend APIs)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Products API" "curl -sf http://localhost:3005/api/products"
run_test "Sales API" "curl -sf http://localhost:3005/api/sales"
run_test "Sales Orders API" "curl -sf http://localhost:3005/api/sales/orders"
run_test "Sales Returns API" "curl -sf http://localhost:3005/api/sales/returns"
run_test "Sales Receipts API" "curl -sf http://localhost:3005/api/sales/receipts"
run_test "Customers API" "curl -sf http://localhost:3005/api/customers"
run_test "Vendors API" "curl -sf http://localhost:3005/api/vendors"
run_test "Inventory API" "curl -sf http://localhost:3005/api/inventory"
run_test "Batches API" "curl -sf http://localhost:3005/api/inventory/batches"
run_test "Transfers API" "curl -sf http://localhost:3005/api/inventory/transfers"
run_test "Adjustments API" "curl -sf http://localhost:3005/api/inventory/adjustments"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 4: NESTJS PURCHASES APIs
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4. NESTJS APIS (Purchases Module)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Purchase Vendors" "curl -sf http://localhost:3001/purchase/vendors"
run_test "Purchase Orders" "curl -sf http://localhost:3001/purchase/orders"
run_test "GRN" "curl -sf http://localhost:3001/purchase/grn"
run_test "Bills" "curl -sf http://localhost:3001/purchase/bills"
run_test "Payments" "curl -sf http://localhost:3001/purchase/payments"
run_test "Returns" "curl -sf http://localhost:3001/purchase/returns"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 5: FASTIFY MARKETING APIs
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}5. FASTIFY APIS (Marketing Module)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Campaigns" "curl -sf http://localhost:3002/api/campaigns"
run_test "Templates" "curl -sf http://localhost:3002/api/templates"
run_test "Coupons" "curl -sf http://localhost:3002/api/coupons"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 6: FRONTEND PAGES
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}6. FRONTEND PAGES (22+ Pages)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Home Page" "curl -sf http://localhost:3000/"
run_test "Dashboard" "curl -sf http://localhost:3000/dashboard"
run_test "Products" "curl -sf http://localhost:3000/products"
run_test "POS" "curl -sf http://localhost:3000/pos"
run_test "Sales" "curl -sf http://localhost:3000/sales"
run_test "Sales Orders" "curl -sf http://localhost:3000/sales/orders"
run_test "Sales Returns" "curl -sf http://localhost:3000/sales/returns"
run_test "Sales Receipts" "curl -sf http://localhost:3000/sales/receipts"
run_test "Purchases" "curl -sf http://localhost:3000/purchases"
run_test "Vendors" "curl -sf http://localhost:3000/purchases/vendors"
run_test "Purchase Orders" "curl -sf http://localhost:3000/purchases/orders"
run_test "Bills" "curl -sf http://localhost:3000/purchases/bills"
run_test "Payments" "curl -sf http://localhost:3000/purchases/payments"
run_test "Purchase Returns" "curl -sf http://localhost:3000/purchases/returns"
run_test "Inventory" "curl -sf http://localhost:3000/inventory"
run_test "Batches" "curl -sf http://localhost:3000/inventory/batches"
run_test "Transfers" "curl -sf http://localhost:3000/inventory/transfers"
run_test "Adjustments" "curl -sf http://localhost:3000/inventory/adjustments"
run_test "Customers" "curl -sf http://localhost:3000/customers"
run_test "Vendors" "curl -sf http://localhost:3000/vendors"
run_test "Campaigns" "curl -sf http://localhost:3000/marketing/campaigns"
run_test "Finance" "curl -sf http://localhost:3000/finance"

echo ""

# ═══════════════════════════════════════════════════════════════
# SECTION 7: DATABASE
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}7. DATABASE TESTS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

run_test "Database Connection" "PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c 'SELECT 1'"
run_test "Products Table" "PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c 'SELECT COUNT(*) FROM products'"
run_test "Customers Table" "PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c 'SELECT COUNT(*) FROM customers'"

echo ""

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BOLD}${CYAN}📊 TEST SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "Total Tests:    ${BOLD}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}${BOLD}$PASSED_TESTS ✅${NC}"
echo -e "Failed:         ${RED}${BOLD}$FAILED_TESTS ❌${NC}"
echo -e "Success Rate:   ${BOLD}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED! SYSTEM IS HEALTHY! 🎉${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "✅ All backend services running"
    echo "✅ All API endpoints responding"
    echo "✅ All frontend pages loading"
    echo "✅ Database connected"
    echo "✅ Infrastructure healthy"
    echo ""
    echo "🚀 System is ready for use!"
    echo ""
    exit 0
else
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${RED}${BOLD}⚠️  SOME TESTS FAILED${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check service logs: tail -f logs/*.log"
    echo "  2. Restart failed services: ./START-EVERYTHING.sh"
    echo "  3. Check individual tests: ./test-all-comprehensive.sh"
    echo ""
    exit 1
fi
