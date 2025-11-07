#!/bin/bash

# Setup AI System for Yeelo Homeopathy Platform
# This script sets up the complete AI-powered ERP system

set -e

echo "🚀 Setting up Yeelo AI-Powered ERP System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required environment variables are set
check_env() {
    print_status "Checking environment variables..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env 2>/dev/null || {
            print_warning "No .env.example found. Creating basic .env file..."
            cat > .env << EOF
# Database
DATABASE_URL=postgresql://yeelo:yeelo@localhost:5433/yeelo

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# AI Service
OPENAI_API_KEY=your_openai_api_key_here
AI_SERVICE_URL=http://localhost:8001

# WhatsApp/SMS
WHATSAPP_API_KEY=your_whatsapp_api_key_here
TWILIO_API_KEY=your_twilio_api_key_here

# MinIO
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
EOF
        }
    fi
    
    print_success "Environment variables configured"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install --legacy-peer-deps
    
    # Install AI service dependencies
    if [ -d "services/ai-service" ]; then
        print_status "Installing AI service dependencies..."
        cd services/ai-service
        pip install -r requirements.txt
        cd ../..
    fi
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Start PostgreSQL
    docker-compose -f docker-compose.ai.yml up -d postgres
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Run migrations
    print_status "Running database migrations..."
    
    # Run the AI tables migration
    PGPASSWORD=yeelo psql -h localhost -U yeelo -d yeelo -f packages/shared-db/migrations/004_ai_tables.sql
    
    print_success "Database setup complete"
}

# Start all services
start_services() {
    print_status "Starting all services..."
    
    # Start all services with docker-compose
    docker-compose -f docker-compose.ai.yml up -d
    
    print_success "All services started"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for AI service
    print_status "Waiting for AI service..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8001/health &> /dev/null; then
            print_success "AI service is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "AI service may not be ready yet. Check logs with: docker-compose -f docker-compose.ai.yml logs ai-service"
    fi
    
    # Wait for API Gateway
    print_status "Waiting for API Gateway..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/health &> /dev/null; then
            print_success "API Gateway is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "API Gateway may not be ready yet. Check logs with: docker-compose -f docker-compose.ai.yml logs api-gateway"
    fi
}

# Test AI service
test_ai_service() {
    print_status "Testing AI service..."
    
    # Test health endpoint
    if curl -f http://localhost:8001/health &> /dev/null; then
        print_success "AI service health check passed"
    else
        print_error "AI service health check failed"
        return 1
    fi
    
    # Test content generation
    print_status "Testing content generation..."
    response=$(curl -s -X POST http://localhost:8001/v1/generate \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": "Create a product description for a homeopathy medicine",
            "max_tokens": 100,
            "temperature": 0.7
        }')
    
    if echo "$response" | grep -q "text"; then
        print_success "Content generation test passed"
    else
        print_warning "Content generation test failed - this is expected if no AI models are configured"
    fi
    
    # Test demand forecasting
    print_status "Testing demand forecasting..."
    response=$(curl -s -X POST http://localhost:8001/v1/forecast-demand \
        -H "Content-Type: application/json" \
        -d '{
            "product_id": "test-product",
            "shop_id": "test-shop",
            "days_ahead": 30
        }')
    
    if echo "$response" | grep -q "forecasted_quantity"; then
        print_success "Demand forecasting test passed"
    else
        print_warning "Demand forecasting test failed"
    fi
}

# Show service URLs
show_urls() {
    print_success "🎉 Yeelo AI-Powered ERP System is ready!"
    echo ""
    echo "📊 Service URLs:"
    echo "  Frontend:           http://localhost:3000"
    echo "  API Gateway:        http://localhost:3001"
    echo "  AI Service:         http://localhost:8001"
    echo "  Kafka UI:           http://localhost:8080"
    echo "  MinIO Console:      http://localhost:9001"
    echo "  Prometheus:         http://localhost:9090"
    echo "  Grafana:            http://localhost:3001 (admin/admin)"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs:          docker-compose -f docker-compose.ai.yml logs [service]"
    echo "  Stop services:      docker-compose -f docker-compose.ai.yml down"
    echo "  Restart services:   docker-compose -f docker-compose.ai.yml restart [service]"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Configure OpenAI API key in .env file"
    echo "  2. Set up WhatsApp/SMS API keys for campaigns"
    echo "  3. Access the frontend and start using the system"
    echo "  4. Check the documentation in docs/ for detailed usage"
}

# Main execution
main() {
    print_status "Starting Yeelo AI System setup..."
    
    check_docker
    check_env
    install_dependencies
    setup_database
    start_services
    wait_for_services
    test_ai_service
    show_urls
    
    print_success "Setup complete! 🎉"
}

# Run main function
main "$@"
