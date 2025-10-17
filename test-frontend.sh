#!/bin/bash

# Comprehensive Next.js Frontend Test Suite
# Tests all pages, routes, and functionality

set -e

echo "🚀 Starting Next.js Frontend Test Suite..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:3000"
TIMEOUT=30

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
}

test_page() {
    local page=$1
    local expected_status=${2:-200}

    ((TOTAL_TESTS++))

    local url="$FRONTEND_URL$page"

    print_status "Testing page: $page"

    # Use curl to test the page
    response=$(curl -s -w "%{http_code}" -o /tmp/curl_output --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")

    http_code=$(echo $response | tail -c 4)

    if [ "$http_code" = "$expected_status" ]; then
        print_success "Page $page (HTTP $http_code)"
        return 0
    else
        print_error "Page $page (Expected: $expected_status, Got: $http_code)"
        return 1
    fi
}

test_api_route() {
    local route=$1
    local method=${2:-GET}
    local data=${3:-""}
    local expected_status=${4:-200}

    ((TOTAL_TESTS++))

    local url="$FRONTEND_URL/api$route"

    print_status "Testing API route: $method $route"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/curl_output --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/curl_output -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    fi

    http_code=$(echo $response | tail -c 4)

    if [ "$http_code" = "$expected_status" ]; then
        print_success "API $method $route (HTTP $http_code)"
        return 0
    else
        print_error "API $method $route (Expected: $expected_status, Got: $http_code)"
        return 1
    fi
}

# Test Next.js application health
test_nextjs_health() {
    print_status "🏠 Testing Next.js application health..."

    # Test root page
    if test_page "/" "200"; then
        return 0
    else
        print_warning "Next.js application is not running on port 3000"
        return 1
    fi
}

# Test main pages
test_main_pages() {
    print_status "📄 Testing main application pages..."

    # Dashboard and main pages
    test_page "/dashboard" "200"
    test_page "/pos" "200"
    test_page "/products" "200"
    test_page "/orders" "200"
    test_page "/customers" "200"
    test_page "/inventory" "200"
    test_page "/sales" "200"
    test_page "/purchases" "200"
    test_page "/finance" "200"
    test_page "/reports" "200"
    test_page "/marketing" "200"
    test_page "/hr" "200"
    test_page "/settings" "200"
    test_page "/loyalty" "200"
    test_page "/notifications" "200"

    print_success "Main pages tests completed"
}

# Test ERP modules
test_erp_modules() {
    print_status "🏢 Testing ERP module pages..."

    # Sales module
    test_page "/sales/orders" "200"
    test_page "/sales/invoices" "200"
    test_page "/sales/returns" "200"
    test_page "/sales/quotations" "200"

    # Inventory module
    test_page "/inventory/products" "200"
    test_page "/inventory/stock" "200"
    test_page "/inventory/warehouse" "200"
    test_page "/inventory/transfers" "200"

    # Purchase module
    test_page "/purchases/orders" "200"
    test_page "/purchases/vendors" "200"
    test_page "/purchases/grn" "200"

    # Finance module
    test_page "/finance/ledger" "200"
    test_page "/finance/cashbook" "200"
    test_page "/finance/expenses" "200"
    test_page "/finance/tax" "200"

    # HR module
    test_page "/hr/employees" "200"
    test_page "/hr/attendance" "200"
    test_page "/hr/payroll" "200"

    # Marketing module
    test_page "/marketing/campaigns" "200"
    test_page "/marketing/whatsapp" "200"
    test_page "/marketing/email" "200"

    print_success "ERP module tests completed"
}

# Test AI features
test_ai_features() {
    print_status "🤖 Testing AI feature pages..."

    test_page "/ai/chat" "200"
    test_page "/ai/recommendations" "200"
    test_page "/ai/insights" "200"
    test_page "/ai/analytics" "200"
    test_page "/ai/lab" "200"

    print_success "AI features tests completed"
}

# Test Next.js API routes
test_api_routes() {
    print_status "🔌 Testing Next.js API routes..."

    # Test API proxy routes
    test_api_route "/orders" "GET" "" "200"
    test_api_route "/products" "GET" "" "200"
    test_api_route "/customers" "GET" "" "200"
    test_api_route "/inventory/logs" "GET" "" "200"

    # Test authentication routes
    test_api_route "/auth/login" "POST" '{"username":"test","password":"test"}' "200"
    test_api_route "/auth/register" "POST" '{"email":"test@example.com","username":"testuser","password":"testpass"}' "201"

    print_success "API routes tests completed"
}

# Test static assets and resources
test_static_assets() {
    print_status "📁 Testing static assets..."

    # Test if static files are accessible
    response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$FRONTEND_URL/favicon.ico" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        print_success "Static assets accessible"
    else
        print_warning "Static assets may not be accessible"
    fi
}

# Test responsive design (basic check)
test_responsiveness() {
    print_status "📱 Testing responsive design..."

    # This is a basic check - in a real scenario, you'd use tools like puppeteer
    print_warning "Responsive design testing requires browser automation tools"
    print_warning "Consider using Playwright or Cypress for comprehensive responsive testing"
}

# Test performance (basic check)
test_performance() {
    print_status "⚡ Testing performance..."

    # Measure page load time
    start_time=$(date +%s%N)
    curl -s -o /dev/null --max-time $TIMEOUT "$FRONTEND_URL/" 2>/dev/null || true
    end_time=$(date +%s%N)

    load_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds

    if [ $load_time -lt 5000 ]; then  # Less than 5 seconds
        print_success "Page load time: ${load_time}ms"
    else
        print_warning "Page load time: ${load_time}ms (slower than expected)"
    fi
}

# Test error handling
test_error_handling() {
    print_status "🚨 Testing error handling..."

    # Test 404 page
    test_page "/non-existent-page" "404"

    # Test API error handling
    test_api_route "/non-existent-endpoint" "GET" "" "404"

    print_success "Error handling tests completed"
}

# Main test execution
main() {
    echo "🔧 Starting comprehensive Next.js frontend testing..."
    echo ""

    # Check if Next.js is running
    test_nextjs_health || {
        print_error "Next.js application is not running. Please start it first:"
        echo "  cd /var/www/homeopathy-business-platform"
        echo "  npm run dev"
        exit 1
    }

    echo ""

    # Test all components
    test_main_pages
    echo ""

    test_erp_modules
    echo ""

    test_ai_features
    echo ""

    test_api_routes
    echo ""

    test_static_assets
    echo ""

    test_responsiveness
    echo ""

    test_performance
    echo ""

    test_error_handling
    echo ""

    # Print summary
    echo "================================================"
    echo "📊 FRONTEND TEST SUMMARY"
    echo "================================================"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        print_success "🎉 ALL FRONTEND TESTS PASSED! Next.js application is working correctly."
        return 0
    else
        echo ""
        print_error "❌ $FAILED_TESTS frontend tests failed. Please check the Next.js application."
        return 1
    fi
}

# Execute tests
main
