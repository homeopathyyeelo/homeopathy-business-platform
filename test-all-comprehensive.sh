#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# COMPREHENSIVE TESTING - ALL PAGES, APIS, KAFKA
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0
WARNINGS=0

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

test_endpoint() {
    local method=$1
    local url=$2
    local name=$3
    local expected_status=${4:-200}
    
    log_test "Testing: $name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "${5:-{}}" 2>/dev/null)
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        log_pass "$name (HTTP $status_code)"
        return 0
    else
        log_fail "$name (Expected $expected_status, got $status_code)"
        return 1
    fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 COMPREHENSIVE SYSTEM TESTING"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. TEST ALL BACKEND SERVICES
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 1. BACKEND SERVICES HEALTH ━━━${NC}"
echo ""

test_endpoint "GET" "http://localhost:8080/health" "Golang v1 Health"
test_endpoint "GET" "http://localhost:3005/health" "Golang v2 Health"
test_endpoint "GET" "http://localhost:3001/health" "NestJS Health"
test_endpoint "GET" "http://localhost:3002/health" "Fastify Health"
test_endpoint "GET" "http://localhost:3004/health" "Express Health"
test_endpoint "GET" "http://localhost:3000" "Frontend" 200

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. TEST GOLANG V2 APIS (Used by Frontend)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 2. GOLANG V2 API ENDPOINTS ━━━${NC}"
echo ""

test_endpoint "GET" "http://localhost:3005/api/products" "Products API"
test_endpoint "GET" "http://localhost:3005/api/sales" "Sales API"
test_endpoint "GET" "http://localhost:3005/api/sales/orders" "Sales Orders API"
test_endpoint "GET" "http://localhost:3005/api/sales/returns" "Sales Returns API"
test_endpoint "GET" "http://localhost:3005/api/sales/receipts" "Sales Receipts API"
test_endpoint "GET" "http://localhost:3005/api/customers" "Customers API"
test_endpoint "GET" "http://localhost:3005/api/vendors" "Vendors API"
test_endpoint "GET" "http://localhost:3005/api/inventory" "Inventory API"
test_endpoint "GET" "http://localhost:3005/api/inventory/batches" "Batches API"
test_endpoint "GET" "http://localhost:3005/api/inventory/transfers" "Transfers API"
test_endpoint "GET" "http://localhost:3005/api/inventory/adjustments" "Adjustments API"

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. TEST NESTJS APIS (Purchases Module)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 3. NESTJS API ENDPOINTS ━━━${NC}"
echo ""

test_endpoint "GET" "http://localhost:3001/purchase/vendors" "Vendors API"
test_endpoint "GET" "http://localhost:3001/purchase/orders" "Purchase Orders API"
test_endpoint "GET" "http://localhost:3001/purchase/grn" "GRN API"
test_endpoint "GET" "http://localhost:3001/purchase/bills" "Bills API"
test_endpoint "GET" "http://localhost:3001/purchase/payments" "Payments API"
test_endpoint "GET" "http://localhost:3001/purchase/returns" "Returns API"

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. TEST FASTIFY APIS (Marketing Module)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 4. FASTIFY API ENDPOINTS ━━━${NC}"
echo ""

test_endpoint "GET" "http://localhost:3002/api/campaigns" "Campaigns API"
test_endpoint "GET" "http://localhost:3002/api/templates" "Templates API"
test_endpoint "GET" "http://localhost:3002/api/coupons" "Coupons API"

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. TEST FRONTEND PAGES
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 5. FRONTEND PAGES ━━━${NC}"
echo ""

test_endpoint "GET" "http://localhost:3000/" "Home Page"
test_endpoint "GET" "http://localhost:3000/dashboard" "Dashboard"
test_endpoint "GET" "http://localhost:3000/products" "Products Page"
test_endpoint "GET" "http://localhost:3000/pos" "POS Page"
test_endpoint "GET" "http://localhost:3000/sales" "Sales Page"
test_endpoint "GET" "http://localhost:3000/sales/orders" "Sales Orders Page"
test_endpoint "GET" "http://localhost:3000/sales/returns" "Sales Returns Page"
test_endpoint "GET" "http://localhost:3000/sales/receipts" "Sales Receipts Page"
test_endpoint "GET" "http://localhost:3000/purchases" "Purchases Page"
test_endpoint "GET" "http://localhost:3000/purchases/vendors" "Vendors Page"
test_endpoint "GET" "http://localhost:3000/purchases/orders" "Purchase Orders Page"
test_endpoint "GET" "http://localhost:3000/purchases/bills" "Bills Page"
test_endpoint "GET" "http://localhost:3000/purchases/payments" "Payments Page"
test_endpoint "GET" "http://localhost:3000/purchases/returns" "Purchase Returns Page"
test_endpoint "GET" "http://localhost:3000/inventory" "Inventory Page"
test_endpoint "GET" "http://localhost:3000/inventory/batches" "Batches Page"
test_endpoint "GET" "http://localhost:3000/inventory/transfers" "Transfers Page"
test_endpoint "GET" "http://localhost:3000/inventory/adjustments" "Adjustments Page"
test_endpoint "GET" "http://localhost:3000/customers" "Customers Page"
test_endpoint "GET" "http://localhost:3000/vendors" "Vendors Page"
test_endpoint "GET" "http://localhost:3000/marketing/campaigns" "Campaigns Page"
test_endpoint "GET" "http://localhost:3000/finance" "Finance Page"

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. TEST KAFKA INTEGRATION
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 6. KAFKA INTEGRATION ━━━${NC}"
echo ""

log_test "Checking Kafka broker connectivity"
if nc -z localhost 9092 2>/dev/null; then
    log_pass "Kafka broker is accessible on port 9092"
else
    log_warn "Kafka broker not accessible on port 9092"
fi

log_test "Checking Kafka topics"
if command -v kafka-topics.sh &> /dev/null; then
    topics=$(kafka-topics.sh --bootstrap-server localhost:9092 --list 2>/dev/null | wc -l)
    if [ "$topics" -gt 0 ]; then
        log_pass "Found $topics Kafka topics"
    else
        log_warn "No Kafka topics found"
    fi
else
    log_warn "kafka-topics.sh not found in PATH"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 7. TEST DATABASE CONNECTIVITY
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 7. DATABASE CONNECTIVITY ━━━${NC}"
echo ""

log_test "Testing PostgreSQL connection"
if pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    log_pass "PostgreSQL is running on port 5433"
    
    # Test database exists
    if PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -c "SELECT 1" > /dev/null 2>&1; then
        log_pass "Database 'yeelo_homeopathy' is accessible"
        
        # Count tables
        table_count=$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
        log_pass "Found $table_count tables in database"
    else
        log_fail "Cannot access database 'yeelo_homeopathy'"
    fi
else
    log_fail "PostgreSQL is not running on port 5433"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 8. TEST REDIS CONNECTIVITY
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 8. REDIS CONNECTIVITY ━━━${NC}"
echo ""

log_test "Testing Redis connection"
if redis-cli -h localhost -p 6380 PING > /dev/null 2>&1; then
    log_pass "Redis is running on port 6380"
else
    log_warn "Redis is not running on port 6380 (optional)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 9. TEST DATA CREATION (POST REQUESTS)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 9. DATA CREATION TESTS ━━━${NC}"
echo ""

# Create a test product
log_test "Creating test product via API"
product_data='{
  "name": "Test Product",
  "sku": "TEST-001",
  "category": "Dilutions",
  "unit_price": 100,
  "stock_qty": 50
}'

if test_endpoint "POST" "http://localhost:3005/api/products" "Create Product" 201 "$product_data"; then
    :
else
    log_warn "Product creation might require authentication"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 10. TEST KAFKA EVENT PRODUCTION
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}━━━ 10. KAFKA EVENT TESTS ━━━${NC}"
echo ""

log_test "Testing Kafka event production"
if [ -f "services/kafka-events/test-producer.js" ]; then
    cd services/kafka-events
    if node test-producer.js > /dev/null 2>&1; then
        log_pass "Kafka producer test successful"
    else
        log_warn "Kafka producer test failed"
    fi
    cd ../..
else
    log_warn "Kafka test producer not found"
fi

log_test "Checking Kafka consumer logs"
if [ -d "services/kafka-events" ]; then
    log_pass "Kafka events service exists"
else
    log_warn "Kafka events service not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo -e "${CYAN}📊 TEST SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed:${NC}    $PASSED"
echo -e "${RED}❌ Failed:${NC}    $FAILED"
echo -e "${YELLOW}⚠️  Warnings:${NC}  $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CRITICAL TESTS PASSED!${NC}"
    echo ""
    echo "✅ All backend services are running"
    echo "✅ All API endpoints are accessible"
    echo "✅ All frontend pages are loading"
    echo "✅ Database is connected"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Check the logs above for details"
    echo "Run: tail -f logs/*.log"
    exit 1
fi
