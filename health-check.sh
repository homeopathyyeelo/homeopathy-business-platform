#!/bin/bash

# Comprehensive Application Health Check
# Tests entire Yeelo Homeopathy ERP Platform

set -e

echo "🏥 Starting Comprehensive Application Health Check..."
echo "==================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost"
FRONTEND_URL="http://localhost:3000"
TIMEOUT=30

# Service ports
declare -A SERVICES=(
    ["postgres"]="5432"
    ["redis"]="6379"
    ["rabbitmq"]="5672"
    ["elasticsearch"]="9200"
    ["user-service"]="8001"
    ["product-service"]="8002"
    ["order-service"]="8003"
    ["payment-service"]="8004"
    ["notification-service"]="8005"
    ["ai-service"]="8006"
    ["api-gateway"]="8000"
    ["frontend"]="3000"
)

# Test results tracking
TOTAL_CHECKS=0
HEALTHY_CHECKS=0
UNHEALTHY_CHECKS=0

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ HEALTHY]${NC} $1"
    ((HEALTHY_CHECKS++))
}

print_error() {
    echo -e "${RED}[❌ UNHEALTHY]${NC} $1"
    ((UNHEALTHY_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

check_service() {
    local service=$1
    local port=${SERVICES[$service]}

    ((TOTAL_CHECKS++))

    print_status "Checking $service on port $port..."

    # Check if port is open
    if nc -z localhost $port 2>/dev/null; then
        print_success "$service is running on port $port"
        return 0
    else
        print_error "$service is NOT running on port $port"
        return 1
    fi
}

check_service_health_endpoint() {
    local service=$1
    local port=${SERVICES[$service]}
    local endpoint=${2:-"/health"}

    ((TOTAL_CHECKS++))

    print_status "Checking $service health endpoint..."

    local url="$BASE_URL:$port$endpoint"
    response=$(curl -s -w "%{http_code}" -o /tmp/health_output --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")

    http_code=$(echo $response | tail -c 4)

    if [ "$http_code" = "200" ]; then
        print_success "$service health endpoint responding (HTTP $http_code)"
        return 0
    else
        print_error "$service health endpoint NOT responding (HTTP $http_code)"
        return 1
    fi
}

check_database_connection() {
    local service=$1
    local port=${SERVICES[$service]}

    ((TOTAL_CHECKS++))

    print_status "Testing $service database connection..."

    # Test PostgreSQL connection
    if [ "$service" = "postgres" ]; then
        if pg_isready -h localhost -p $port -U yeelo_user -d yeelo_platform 2>/dev/null; then
            print_success "$service database connection successful"
            return 0
        else
            print_error "$service database connection failed"
            return 1
        fi
    fi

    # Test Redis connection
    if [ "$service" = "redis" ]; then
        if redis-cli -h localhost -p $port ping 2>/dev/null | grep -q PONG; then
            print_success "$service connection successful"
            return 0
        else
            print_error "$service connection failed"
            return 1
        fi
    fi

    # Test RabbitMQ connection
    if [ "$service" = "rabbitmq" ]; then
        # Simple check if RabbitMQ management API is accessible
        if curl -s --max-time 10 "http://localhost:15672/api/overview" -u yeelo_user:yeelo_password >/dev/null 2>&1; then
            print_success "$service connection successful"
            return 0
        else
            print_error "$service connection failed"
            return 1
        fi
    fi

    # Test Elasticsearch connection
    if [ "$service" = "elasticsearch" ]; then
        if curl -s --max-time 10 "http://localhost:9200/_cluster/health" | grep -q '"status":"green"\|"status":"yellow"'; then
            print_success "$service connection successful"
            return 0
        else
            print_error "$service connection failed"
            return 1
        fi
    fi

    print_warning "Database connection test not implemented for $service"
    return 0
}

check_service_integration() {
    local service=$1
    local port=${SERVICES[$service]}

    ((TOTAL_CHECKS++))

    print_status "Testing $service integration..."

    case $service in
        "user-service")
            # Test user registration and login
            user_data='{"email": "healthcheck@example.com", "username": "healthcheck", "password": "testpass123", "full_name": "Health Check"}'
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output -X POST \
                -H "Content-Type: application/json" \
                -d "$user_data" \
                --max-time $TIMEOUT "$BASE_URL:$port/auth/register" 2>/dev/null || echo "000")
            ;;
        "product-service")
            # Test product listing
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output \
                --max-time $TIMEOUT "$BASE_URL:$port/products" 2>/dev/null || echo "000")
            ;;
        "order-service")
            # Test order listing
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output \
                --max-time $TIMEOUT "$BASE_URL:$port/orders" 2>/dev/null || echo "000")
            ;;
        "payment-service")
            # Test payment creation
            payment_data='{"order_id": "health-check-order", "user_id": 1, "amount": 100.00, "currency": "USD", "payment_method": "credit_card", "gateway": "stripe"}'
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output -X POST \
                -H "Content-Type: application/json" \
                -d "$payment_data" \
                --max-time $TIMEOUT "$BASE_URL:$port/payments" 2>/dev/null || echo "000")
            ;;
        "notification-service")
            # Test notification creation
            notification_data='{"recipient_id": 1, "notification_type": "email", "subject": "Health Check", "content": "System health check notification"}'
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output -X POST \
                -H "Content-Type: application/json" \
                -d "$notification_data" \
                --max-time $TIMEOUT "$BASE_URL:$port/notifications" 2>/dev/null || echo "000")
            ;;
        "ai-service")
            # Test AI recommendations
            ai_data='{"user_id": 1, "user_preferences": {"categories": ["wellness"]}, "limit": 3}'
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output -X POST \
                -H "Content-Type: application/json" \
                -d "$ai_data" \
                --max-time $TIMEOUT "$BASE_URL:$port/v1/recommendations" 2>/dev/null || echo "000")
            ;;
        "frontend")
            # Test Next.js application
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output \
                --max-time $TIMEOUT "$FRONTEND_URL/" 2>/dev/null || echo "000")
            ;;
        "api-gateway")
            # Test API gateway
            response=$(curl -s -w "%{http_code}" -o /tmp/integration_output \
                --max-time $TIMEOUT "$BASE_URL:$port/health" 2>/dev/null || echo "000")
            ;;
    esac

    http_code=$(echo $response | tail -c 4)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "$service integration test passed (HTTP $http_code)"
        return 0
    else
        print_error "$service integration test failed (HTTP $http_code)"
        return 1
    fi
}

check_end_to_end_workflow() {
    print_status "🔄 Testing end-to-end workflow..."

    ((TOTAL_CHECKS++))

    # Simulate a complete user journey
    print_status "Simulating user registration -> product browsing -> order placement -> payment -> notification"

    # 1. User registration
    user_data='{"email": "e2e-test@example.com", "username": "e2e-test", "password": "testpass123", "full_name": "E2E Test User"}'
    user_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$user_data" \
        --max-time $TIMEOUT "$BASE_URL:8001/auth/register" 2>/dev/null)

    if echo "$user_response" | grep -q '"id"'; then
        print_success "✓ User registration successful"
    else
        print_error "✗ User registration failed"
        return 1
    fi

    # 2. Product browsing
    product_response=$(curl -s --max-time $TIMEOUT "$BASE_URL:8002/products" 2>/dev/null)
    if echo "$product_response" | grep -q '"products"'; then
        print_success "✓ Product browsing successful"
    else
        print_error "✗ Product browsing failed"
        return 1
    fi

    # 3. Order creation
    order_data='{
        "cart_id": "e2e-test-cart",
        "shipping_address": {"street": "123 Test St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "US"},
        "billing_address": {"street": "123 Test St", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "US"},
        "shipping_method": "standard",
        "payment_method": "credit_card"
    }'

    order_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$order_data" \
        --max-time $TIMEOUT "$BASE_URL:8003/orders" 2>/dev/null)

    if echo "$order_response" | grep -q '"order_number"'; then
        print_success "✓ Order creation successful"
    else
        print_error "✗ Order creation failed"
        return 1
    fi

    # 4. Payment processing
    payment_data='{
        "order_id": "e2e-test-order",
        "user_id": 1,
        "amount": 100.00,
        "currency": "USD",
        "payment_method": "credit_card",
        "gateway": "stripe"
    }'

    payment_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$payment_data" \
        --max-time $TIMEOUT "$BASE_URL:8004/payments" 2>/dev/null)

    if echo "$payment_response" | grep -q '"payment_id"'; then
        print_success "✓ Payment processing successful"
    else
        print_error "✗ Payment processing failed"
        return 1
    fi

    # 5. Notification sending
    notification_data='{
        "recipient_id": 1,
        "notification_type": "email",
        "subject": "Order Confirmation - E2E Test",
        "content": "Your order has been successfully placed and payment processed."
    }'

    notification_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$notification_data" \
        --max-time $TIMEOUT "$BASE_URL:8005/notifications" 2>/dev/null)

    if echo "$notification_response" | grep -q '"id"'; then
        print_success "✓ Notification sending successful"
    else
        print_error "✗ Notification sending failed"
        return 1
    fi

    print_success "🎉 End-to-end workflow completed successfully!"
    return 0
}

# Main health check execution
main() {
    echo "🔧 Starting comprehensive health check of entire application..."
    echo ""

    # Check infrastructure services
    print_status "🏗️  Checking Infrastructure Services..."
    check_service "postgres"
    check_service "redis"
    check_service "rabbitmq"
    check_service "elasticsearch"

    echo ""

    # Check database connections
    print_status "💾 Checking Database Connections..."
    check_database_connection "postgres"
    check_database_connection "redis"
    check_database_connection "rabbitmq"
    check_database_connection "elasticsearch"

    echo ""

    # Check microservices
    print_status "🔧 Checking Microservices..."
    check_service "user-service"
    check_service "product-service"
    check_service "order-service"
    check_service "payment-service"
    check_service "notification-service"
    check_service "ai-service"
    check_service "api-gateway"

    echo ""

    # Check service health endpoints
    print_status "🏥 Checking Service Health Endpoints..."
    check_service_health_endpoint "user-service" "/health"
    check_service_health_endpoint "product-service" "/health"
    check_service_health_endpoint "order-service" "/health"
    check_service_health_endpoint "payment-service" "/health"
    check_service_health_endpoint "notification-service" "/health"
    check_service_health_endpoint "ai-service" "/health"
    check_service_health_endpoint "api-gateway" "/health"

    echo ""

    # Check frontend
    print_status "🌐 Checking Frontend Application..."
    check_service "frontend"

    echo ""

    # Test service integrations
    print_status "🔗 Testing Service Integrations..."
    check_service_integration "user-service"
    check_service_integration "product-service"
    check_service_integration "order-service"
    check_service_integration "payment-service"
    check_service_integration "notification-service"
    check_service_integration "ai-service"
    check_service_integration "frontend"
    check_service_integration "api-gateway"

    echo ""

    # Test end-to-end workflow
    print_status "🔄 Testing End-to-End Workflow..."
    check_end_to_end_workflow

    echo ""

    # Print comprehensive summary
    echo "================================================"
    echo "🏥 COMPREHENSIVE HEALTH CHECK SUMMARY"
    echo "================================================"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Healthy: $HEALTHY_CHECKS"
    echo "Unhealthy: $UNHEALTHY_CHECKS"

    echo ""
    echo "📋 DETAILED STATUS:"
    echo "=================="

    # Infrastructure status
    echo "🏗️  Infrastructure:"
    if check_service "postgres" 2>/dev/null && check_service "redis" 2>/dev/null && check_service "rabbitmq" 2>/dev/null; then
        echo "   ✅ All infrastructure services running"
    else
        echo "   ❌ Some infrastructure services not running"
    fi

    # Microservices status
    echo "🔧 Microservices:"
    service_count=0
    for service in "user-service" "product-service" "order-service" "payment-service" "notification-service" "ai-service"; do
        if check_service "$service" 2>/dev/null; then
            ((service_count++))
        fi
    done

    if [ $service_count -eq 6 ]; then
        echo "   ✅ All microservices running"
    else
        echo "   ❌ $((6 - service_count)) microservices not running"
    fi

    # API Gateway status
    echo "🚪 API Gateway:"
    if check_service "api-gateway" 2>/dev/null && check_service_health_endpoint "api-gateway" "/health" 2>/dev/null; then
        echo "   ✅ API Gateway healthy"
    else
        echo "   ❌ API Gateway not healthy"
    fi

    # Frontend status
    echo "🌐 Frontend:"
    if check_service "frontend" 2>/dev/null; then
        echo "   ✅ Frontend application running"
    else
        echo "   ❌ Frontend application not running"
    fi

    # End-to-end workflow
    echo "🔄 End-to-End Workflow:"
    if check_end_to_end_workflow 2>/dev/null; then
        echo "   ✅ Complete workflow successful"
    else
        echo "   ❌ End-to-end workflow failed"
    fi

    echo ""
    echo "📊 FINAL ASSESSMENT:"
    echo "==================="

    if [ $UNHEALTHY_CHECKS -eq 0 ]; then
        echo "🎉 EXCELLENT! The entire Yeelo Homeopathy ERP Platform is"
        echo "   fully operational and ready for production use!"
        echo ""
        echo "🚀 Ready for deployment:"
        echo "   - All microservices are running"
        echo "   - All integrations are working"
        echo "   - End-to-end workflows are functional"
        echo "   - Frontend is responsive and operational"
        return 0
    elif [ $UNHEALTHY_CHECKS -lt 5 ]; then
        echo "⚠️  MOSTLY HEALTHY! The platform is operational but has"
        echo "   some issues that should be addressed."
        echo ""
        echo "🔧 Recommended actions:"
        echo "   - Check services that failed health checks"
        echo "   - Review logs for error details"
        echo "   - Restart failed services"
        return 1
    else
        echo "❌ CRITICAL ISSUES! The platform has significant problems"
        echo "   and requires immediate attention."
        echo ""
        echo "🚨 Immediate actions required:"
        echo "   - Check all service logs"
        echo "   - Verify database connections"
        echo "   - Restart all services"
        echo "   - Check configuration files"
        return 1
    fi
}

# Execute health check
main
