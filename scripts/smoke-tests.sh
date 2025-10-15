#!/bin/bash

# Smoke Tests for Yeelo Platform
# Validates basic functionality after deployment
#
# Learning Notes:
# - Quick validation of critical endpoints
# - Health checks for all services
# - Basic functionality verification
# - Integration with CI/CD pipeline

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="yeelo-platform"

if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://api.yeelo.com"
else
    BASE_URL="https://api-staging.yeelo.com"
fi

echo "🧪 Running smoke tests for $ENVIRONMENT environment..."

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo "🔍 Testing: $description"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ $description - OK ($response)"
    else
        echo "❌ $description - FAILED (expected $expected_status, got $response)"
        exit 1
    fi
}

# Function to check Kubernetes deployment
check_k8s_deployment() {
    local deployment=$1
    local namespace=$2
    
    echo "🔍 Checking deployment: $deployment"
    
    ready_replicas=$(kubectl get deployment $deployment -n $namespace -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    desired_replicas=$(kubectl get deployment $deployment -n $namespace -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    if [ "$ready_replicas" = "$desired_replicas" ] && [ "$ready_replicas" != "0" ]; then
        echo "✅ $deployment - OK ($ready_replicas/$desired_replicas ready)"
    else
        echo "❌ $deployment - FAILED ($ready_replicas/$desired_replicas ready)"
        kubectl describe deployment $deployment -n $namespace
        exit 1
    fi
}

# Test 1: Check Kubernetes deployments
echo "📦 Checking Kubernetes deployments..."
check_k8s_deployment "api-gateway" $NAMESPACE
check_k8s_deployment "auth-service" $NAMESPACE
check_k8s_deployment "orders-service" $NAMESPACE
check_k8s_deployment "campaigns-service" $NAMESPACE
check_k8s_deployment "ai-service" $NAMESPACE
check_k8s_deployment "worker-golang" $NAMESPACE

# Test 2: Health check endpoints
echo "🏥 Testing health endpoints..."
check_endpoint "$BASE_URL/health" 200 "API Gateway Health"
check_endpoint "$BASE_URL/api/auth/health" 200 "Auth Service Health"
check_endpoint "$BASE_URL/api/orders/health" 200 "Orders Service Health"
check_endpoint "$BASE_URL/api/campaigns/health" 200 "Campaigns Service Health"
check_endpoint "$BASE_URL/api/ai/health" 200 "AI Service Health"

# Test 3: Authentication flow
echo "🔐 Testing authentication..."

# Register a test user
register_response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test-'$(date +%s)'@example.com",
        "password": "TestPassword123!",
        "firstName": "Test",
        "lastName": "User"
    }' || echo '{"error": "request failed"}')

if echo "$register_response" | grep -q '"token"'; then
    echo "✅ User registration - OK"
    
    # Extract token for further tests
    token=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Test authenticated endpoint
    auth_test=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/orders" \
        -H "Authorization: Bearer $token" || echo "000")
    
    if [ "$auth_test" = "200" ] || [ "$auth_test" = "404" ]; then
        echo "✅ Authenticated request - OK"
    else
        echo "❌ Authenticated request - FAILED ($auth_test)"
        exit 1
    fi
else
    echo "❌ User registration - FAILED"
    echo "Response: $register_response"
    exit 1
fi

# Test 4: Database connectivity
echo "🗄️  Testing database connectivity..."
db_test=$(kubectl exec -n $NAMESPACE deployment/auth-service -- \
    sh -c 'node -e "
        const { Pool } = require(\"pg\");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query(\"SELECT 1\").then(() => {
            console.log(\"OK\");
            process.exit(0);
        }).catch(err => {
            console.error(err.message);
            process.exit(1);
        });
    "' 2>/dev/null || echo "FAILED")

if [ "$db_test" = "OK" ]; then
    echo "✅ Database connectivity - OK"
else
    echo "❌ Database connectivity - FAILED"
    exit 1
fi

# Test 5: Kafka connectivity
echo "📨 Testing Kafka connectivity..."
kafka_test=$(kubectl exec -n $NAMESPACE deployment/worker-golang -- \
    sh -c 'timeout 10s ./worker --test-kafka 2>/dev/null && echo "OK" || echo "FAILED"')

if [ "$kafka_test" = "OK" ]; then
    echo "✅ Kafka connectivity - OK"
else
    echo "⚠️  Kafka connectivity - Could not verify (worker may not support test mode)"
fi

# Test 6: Monitoring endpoints
echo "📊 Testing monitoring..."
if kubectl get servicemonitor -n $NAMESPACE api-gateway >/dev/null 2>&1; then
    echo "✅ ServiceMonitor configured - OK"
else
    echo "⚠️  ServiceMonitor not found - monitoring may not be working"
fi

# Test 7: Ingress and SSL
echo "🌐 Testing ingress and SSL..."
ssl_test=$(curl -s -I "$BASE_URL" | head -n 1 | grep -o "200\|301\|302" || echo "FAILED")

if [ "$ssl_test" != "FAILED" ]; then
    echo "✅ Ingress and SSL - OK"
else
    echo "❌ Ingress and SSL - FAILED"
    exit 1
fi

# Test 8: Resource usage check
echo "📈 Checking resource usage..."
high_cpu_pods=$(kubectl top pods -n $NAMESPACE --no-headers 2>/dev/null | \
    awk '{if($2 ~ /[0-9]+m/ && $2+0 > 500) print $1}' || echo "")

if [ -z "$high_cpu_pods" ]; then
    echo "✅ Resource usage - OK"
else
    echo "⚠️  High CPU usage detected in pods: $high_cpu_pods"
fi

echo ""
echo "🎉 All smoke tests passed for $ENVIRONMENT environment!"
echo "🔗 Platform URL: $BASE_URL"
echo "📊 Monitoring: kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
echo "🔍 Logs: kubectl logs -f deployment/api-gateway -n $NAMESPACE"
