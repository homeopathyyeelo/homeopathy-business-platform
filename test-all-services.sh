#!/bin/bash

# Comprehensive Microservices Test Suite
# Tests all services: user-service, product-service, order-service, payment-service, notification-service, ai-service

set -e

echo "🚀 Starting Comprehensive Microservices Test Suite..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost"
TIMEOUT=30

# Service ports
declare -A SERVICES=(
    ["user-service"]="8001"
    ["product-service"]="8002"
    ["order-service"]="8003"
    ["payment-service"]="8004"
    ["notification-service"]="8005"
    ["ai-service"]="8006"
)

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

test_endpoint() {
    local service=$1
    local port=$2
    local endpoint=$3
    local method=${4:-GET}
    local data=${5:-""}
    local expected_status=${6:-200}

    ((TOTAL_TESTS++))

    local url="$BASE_URL:$port$endpoint"

    print_status "Testing $service - $method $endpoint"

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
        print_success "$service - $method $endpoint (HTTP $http_code)"
        return 0
    else
        print_error "$service - $method $endpoint (Expected: $expected_status, Got: $http_code)"
        return 1
    fi
}

test_service_health() {
    local service=$1
    local port=${SERVICES[$service]}

    print_status "Testing $service health check..."

    # Test health endpoint
    if test_endpoint "$service" "$port" "/health" "GET" "" "200"; then
        return 0
    else
        print_warning "$service is not running on port $port"
        return 1
    fi
}

# Test User Service
test_user_service() {
    print_status "🧑 Testing User Service (Port ${SERVICES["user-service"]})"

    # Health check
    test_service_health "user-service" || return 1

    # Test user registration
    user_data='{
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
        "full_name": "Test User"
    }'

    test_endpoint "user-service" "${SERVICES["user-service"]}" "/auth/register" "POST" "$user_data" "201"

    # Test user login
    login_data='{
        "username": "testuser",
        "password": "testpass123"
    }'

    test_endpoint "user-service" "${SERVICES["user-service"]}" "/auth/login" "POST" "$login_data" "200"

    # Test user profile (requires authentication - we'll test the endpoint exists)
    test_endpoint "user-service" "${SERVICES["user-service"]}" "/users/me" "GET" "" "401"  # Should return 401 without auth

    print_success "User Service tests completed"
}

# Test Product Service
test_product_service() {
    print_status "📦 Testing Product Service (Port ${SERVICES["product-service"]})"

    # Health check
    test_service_health "product-service" || return 1

    # Test categories
    test_endpoint "product-service" "${SERVICES["product-service"]}" "/categories" "GET" "" "200"

    # Test products
    test_endpoint "product-service" "${SERVICES["product-service"]}" "/products" "GET" "" "200"

    # Test search
    test_endpoint "product-service" "${SERVICES["product-service"]}" "/search?q=honey" "GET" "" "200"

    # Test inventory endpoints
    test_endpoint "product-service" "${SERVICES["product-service"]}" "/inventory/logs" "GET" "" "200"

    # Test analytics
    test_endpoint "product-service" "${SERVICES["product-service"]}" "/analytics/low-stock" "GET" "" "200"

    print_success "Product Service tests completed"
}

# Test Order Service
test_order_service() {
    print_status "🛒 Testing Order Service (Port ${SERVICES["order-service"]})"

    # Health check
    test_service_health "order-service" || return 1

    # Test carts
    test_endpoint "order-service" "${SERVICES["order-service"]}" "/carts" "POST" '{"user_id": 1, "items": [{"product_id": 1, "quantity": 2}]}' "200"

    # Test orders
    test_endpoint "order-service" "${SERVICES["order-service"]}" "/orders" "GET" "" "200"

    # Test order creation
    order_data='{
        "cart_id": "test-cart-id",
        "shipping_address": {"street": "123 Main St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "US"},
        "billing_address": {"street": "123 Main St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "US"},
        "shipping_method": "standard",
        "payment_method": "credit_card"
    }'

    test_endpoint "order-service" "${SERVICES["order-service"]}" "/orders" "POST" "$order_data" "200"

    # Test analytics
    test_endpoint "order-service" "${SERVICES["order-service"]}" "/analytics/orders" "GET" "" "200"

    print_success "Order Service tests completed"
}

# Test Payment Service
test_payment_service() {
    print_status "💳 Testing Payment Service (Port ${SERVICES["payment-service"]})"

    # Health check
    test_service_health "payment-service" || return 1

    # Test payment creation
    payment_data='{
        "order_id": "test-order-123",
        "user_id": 1,
        "amount": 100.00,
        "currency": "USD",
        "payment_method": "credit_card",
        "gateway": "stripe"
    }'

    test_endpoint "payment-service" "${SERVICES["payment-service"]}" "/payments" "POST" "$payment_data" "200"

    # Test payment retrieval
    test_endpoint "payment-service" "${SERVICES["payment-service"]}" "/payments/test-payment-id" "GET" "" "404"  # Should be 404 since it's a mock

    # Test Stripe integration
    stripe_data='{"amount": 1000, "currency": "usd", "payment_method_types": ["card"]}'
    test_endpoint "payment-service" "${SERVICES["payment-service"]}" "/stripe/payment-intent" "POST" "$stripe_data" "200"

    # Test analytics
    test_endpoint "payment-service" "${SERVICES["payment-service"]}" "/analytics/payments" "GET" "" "200"

    print_success "Payment Service tests completed"
}

# Test Notification Service
test_notification_service() {
    print_status "📧 Testing Notification Service (Port ${SERVICES["notification-service"]})"

    # Health check
    test_service_health "notification-service" || return 1

    # Test notification creation
    notification_data='{
        "recipient_id": 1,
        "notification_type": "email",
        "subject": "Test Notification",
        "content": "This is a test notification"
    }'

    test_endpoint "notification-service" "${SERVICES["notification-service"]}" "/notifications" "POST" "$notification_data" "200"

    # Test templates
    test_endpoint "notification-service" "${SERVICES["notification-service"]}" "/templates" "GET" "" "200"

    # Test preferences
    test_endpoint "notification-service" "${SERVICES["notification-service"]}" "/preferences/users/1" "GET" "" "200"

    # Test bulk notifications
    bulk_data='[{
        "recipient_id": 1,
        "notification_type": "email",
        "subject": "Bulk Test",
        "content": "Bulk notification test"
    }]'

    test_endpoint "notification-service" "${SERVICES["notification-service"]}" "/notifications/bulk" "POST" "$bulk_data" "200"

    # Test analytics
    test_endpoint "notification-service" "${SERVICES["notification-service"]}" "/analytics/notifications" "GET" "" "200"

    print_success "Notification Service tests completed"
}

# Test AI Service
test_ai_service() {
    print_status "🤖 Testing AI Service (Port ${SERVICES["ai-service"]})"

    # Health check
    test_service_health "ai-service" || return 1

    # Test recommendations
    rec_data='{
        "user_id": 1,
        "user_preferences": {"categories": ["wellness"], "brands": []},
        "limit": 5
    }'

    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/recommendations" "POST" "$rec_data" "200"

    # Test chatbot
    chatbot_data='{
        "user_id": "test-user-123",
        "message": "What products do you recommend for wellness?"
    }'

    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/chatbot" "POST" "$chatbot_data" "200"

    # Test fraud detection
    fraud_data='{
        "user_id": 1,
        "order_id": "test-order-456",
        "amount": 150.00,
        "payment_method": "credit_card",
        "user_behavior": {"new_account_high_value": false, "multiple_failed_attempts": 0}
    }'

    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/fraud-check" "POST" "$fraud_data" "200"

    # Test training endpoints
    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/train-recommendations" "POST" "" "200"
    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/train-fraud-detection" "POST" "" "200"

    # Test analytics
    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/analytics/recommendations" "GET" "" "200"
    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/analytics/chatbot" "GET" "" "200"
    test_endpoint "ai-service" "${SERVICES["ai-service"]}" "/v1/analytics/fraud" "GET" "" "200"

    print_success "AI Service tests completed"
}

# Test API Gateway
test_api_gateway() {
    print_status "🚪 Testing API Gateway (Port 8000)"

    # Test gateway health
    test_endpoint "api-gateway" "8000" "/health" "GET" "" "200"

    # Test gateway routing to services
    test_endpoint "api-gateway" "8000" "/api/health" "GET" "" "200"

    print_success "API Gateway tests completed"
}

# Main test execution
main() {
    echo "🔧 Starting comprehensive testing of all microservices..."
    echo ""

    # Test each service
    test_user_service
    echo ""

    test_product_service
    echo ""

    test_order_service
    echo ""

    test_payment_service
    echo ""

    test_notification_service
    echo ""

    test_ai_service
    echo ""

    test_api_gateway
    echo ""

    # Print summary
    echo "================================================"
    echo "📊 TEST SUMMARY"
    echo "================================================"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        print_success "🎉 ALL TESTS PASSED! All microservices are working correctly."
        return 0
    else
        echo ""
        print_error "❌ $FAILED_TESTS tests failed. Please check the services."
        return 1
    fi
}

# Execute tests
main
