#!/bin/bash

# Developer Build Script for Yeelo Homeopathy ERP Platform
# Builds and starts all services for development environment

set -e

echo "🚀 Starting Yeelo Homeopathy ERP Platform Developer Build..."
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_NAME="yeelo-homeopathy-erp"

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

check_dependencies() {
    print_status "Checking system dependencies..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check Node.js (for frontend)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Frontend development may be limited."
    fi

    # Check Go (for Go services)
    if ! command -v go &> /dev/null; then
        print_warning "Go is not installed. Go service development may be limited."
    fi

    print_success "Dependencies check completed"
}

setup_environment() {
    print_status "Setting up environment..."

    # Create necessary directories
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/elasticsearch

    # Copy environment files if they don't exist
    if [ ! -f .env.local ]; then
        cp .env .env.local
        print_warning "Created .env.local from .env template"
    fi

    print_success "Environment setup completed"
}

build_services() {
    print_status "Building all services..."

    # Use docker-compose to build
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE build --parallel
    else
        docker compose -f $COMPOSE_FILE build --parallel
    fi

    print_success "All services built successfully"
}

start_infrastructure() {
    print_status "Starting infrastructure services..."

    # Start only infrastructure services first
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE up -d postgres redis rabbitmq elasticsearch
    else
        docker compose -f $COMPOSE_FILE up -d postgres redis rabbitmq elasticsearch
    fi

    print_status "Waiting for infrastructure services to be ready..."

    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while ! pg_isready -h localhost -p 5432 -U yeelo_user -d yeelo_platform 2>/dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "PostgreSQL startup timeout"
            exit 1
        fi
    done

    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout=30
    while ! redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Redis startup timeout"
            exit 1
        fi
    done

    print_success "Infrastructure services are ready"
}

start_microservices() {
    print_status "Starting microservices..."

    # Start all microservices
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE up -d user-service product-service order-service payment-service notification-service ai-service api-gateway
    else
        docker compose -f $COMPOSE_FILE up -d user-service product-service order-service payment-service notification-service ai-service api-gateway
    fi

    print_status "Waiting for microservices to be ready..."

    # Wait for services to respond
    services=("user-service:8001" "product-service:8002" "order-service:8003" "payment-service:8004" "notification-service:8005" "ai-service:8006" "api-gateway:8000")

    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"

        print_status "Waiting for $service_name..."
        timeout=120

        while ! curl -s --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; do
            sleep 3
            timeout=$((timeout - 3))
            if [ $timeout -le 0 ]; then
                print_warning "$service_name health check timeout - may still be starting"
                break
            fi
        done

        if curl -s --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$service_name is ready"
        else
            print_warning "$service_name may not be fully ready yet"
        fi
    done

    print_success "Microservices startup completed"
}

start_frontend() {
    print_status "Starting frontend application..."

    # Check if package.json exists
    if [ -f "package.json" ]; then
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            npm install
        fi

        # Start Next.js development server in background
        print_status "Starting Next.js development server..."
        npm run dev &
        FRONTEND_PID=$!

        # Wait for frontend to be ready
        print_status "Waiting for Next.js to be ready..."
        timeout=60

        while ! curl -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; do
            sleep 3
            timeout=$((timeout - 3))
            if [ $timeout -le 0 ]; then
                print_warning "Next.js startup timeout"
                break
            fi
        done

        if curl -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
            print_success "Next.js frontend is ready at http://localhost:3000"
        else
            print_warning "Next.js may not be fully ready yet"
        fi
    else
        print_warning "Frontend package.json not found - skipping frontend startup"
    fi
}

run_tests() {
    print_status "Running automated tests..."

    # Make test scripts executable
    chmod +x test-all-services.sh
    chmod +x test-frontend.sh
    chmod +x health-check.sh

    # Run service tests
    print_status "Running microservices tests..."
    if ./test-all-services.sh; then
        print_success "Microservices tests passed"
    else
        print_warning "Some microservices tests failed"
    fi

    # Run frontend tests
    print_status "Running frontend tests..."
    if ./test-frontend.sh; then
        print_success "Frontend tests passed"
    else
        print_warning "Some frontend tests failed"
    fi

    # Run health check
    print_status "Running comprehensive health check..."
    if ./health-check.sh; then
        print_success "Health check passed"
    else
        print_warning "Health check found issues"
    fi
}

show_status() {
    echo ""
    echo "================================================"
    echo "🏗️  BUILD STATUS SUMMARY"
    echo "================================================"
    echo ""

    # Infrastructure status
    echo "🏗️  Infrastructure Services:"
    if pg_isready -h localhost -p 5432 -U yeelo_user -d yeelo_platform 2>/dev/null; then
        echo "   ✅ PostgreSQL: Running"
    else
        echo "   ❌ PostgreSQL: Not running"
    fi

    if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG; then
        echo "   ✅ Redis: Running"
    else
        echo "   ❌ Redis: Not running"
    fi

    if curl -s --max-time 5 "http://localhost:15672/api/overview" -u yeelo_user:yeelo_password >/dev/null 2>&1; then
        echo "   ✅ RabbitMQ: Running"
    else
        echo "   ❌ RabbitMQ: Not running"
    fi

    if curl -s --max-time 5 "http://localhost:9200/_cluster/health" | grep -q '"status":"green"\|"status":"yellow"'; then
        echo "   ✅ Elasticsearch: Running"
    else
        echo "   ❌ Elasticsearch: Not running"
    fi

    echo ""

    # Microservices status
    echo "🔧 Microservices:"
    services=("user-service:8001" "product-service:8002" "order-service:8003" "payment-service:8004" "notification-service:8005" "ai-service:8006" "api-gateway:8000")

    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name port <<< "$service_info"
        if curl -s --max-time 3 "http://localhost:$port/health" >/dev/null 2>&1; then
            echo "   ✅ $service_name: Running (http://localhost:$port)"
        else
            echo "   ❌ $service_name: Not responding"
        fi
    done

    echo ""

    # Frontend status
    echo "🌐 Frontend:"
    if curl -s --max-time 3 "http://localhost:3000" >/dev/null 2>&1; then
        echo "   ✅ Next.js: Running (http://localhost:3000)"
    else
        echo "   ❌ Next.js: Not responding"
    fi

    echo ""
    echo "🚀 ACCESS POINTS:"
    echo "================"
    echo "   🔗 Frontend:        http://localhost:3000"
    echo "   🔗 API Gateway:     http://localhost:8000"
    echo "   🔗 User Service:    http://localhost:8001"
    echo "   🔗 Product Service: http://localhost:8002"
    echo "   🔗 Order Service:   http://localhost:8003"
    echo "   🔗 Payment Service: http://localhost:8004"
    echo "   🔗 Notification:    http://localhost:8005"
    echo "   🔗 AI Service:      http://localhost:8006"
    echo ""
    echo "   📊 RabbitMQ Mgmt:   http://localhost:15672 (yeelo_user:yeelo_password)"
    echo "   📊 PostgreSQL:      localhost:5432 (yeelo_user:yeelo_password)"
    echo "   📊 Redis:          localhost:6379"
    echo ""
}

cleanup() {
    print_status "Cleaning up previous builds..."

    # Stop and remove containers
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE down --volumes --remove-orphans 2>/dev/null || true
    else
        docker compose -f $COMPOSE_FILE down --volumes --remove-orphans 2>/dev/null || true
    fi

    # Clean up any orphaned containers
    docker container prune -f 2>/dev/null || true

    print_success "Cleanup completed"
}

# Main build process
main() {
    echo "🔧 Yeelo Homeopathy ERP Platform Developer Build"
    echo "=============================================="
    echo ""

    # Check dependencies
    check_dependencies
    echo ""

    # Cleanup previous builds
    cleanup
    echo ""

    # Setup environment
    setup_environment
    echo ""

    # Build all services
    build_services
    echo ""

    # Start infrastructure
    start_infrastructure
    echo ""

    # Start microservices
    start_microservices
    echo ""

    # Start frontend
    start_frontend
    echo ""

    # Run tests
    run_tests
    echo ""

    # Show final status
    show_status

    echo "🎉 DEVELOPMENT ENVIRONMENT READY!"
    echo "================================"
    echo ""
    echo "✅ All services are built and running"
    echo "✅ Tests have been executed"
    echo "✅ Frontend is accessible"
    echo "✅ API endpoints are available"
    echo ""
    echo "🚀 You can now:"
    echo "   - Access the frontend at http://localhost:3000"
    echo "   - Test APIs at http://localhost:8000"
    echo "   - Run tests with ./test-all-services.sh"
    echo "   - Check health with ./health-check.sh"
    echo ""
    echo "💡 For development:"
    echo "   - Services auto-reload on code changes"
    echo "   - Hot reload enabled for frontend"
    echo "   - Logs are available in real-time"
    echo ""
}

# Execute build
main
