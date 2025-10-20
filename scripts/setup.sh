#!/bin/bash

# Homeopathy ERP - Setup Script
# Automates the complete setup process

set -e

echo "🚀 Homeopathy ERP - Automated Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker found${NC}"
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose found${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠ Node.js not found (required for frontend development)${NC}"
    else
        echo -e "${GREEN}✓ Node.js found${NC}"
    fi
    
    echo ""
}

# Create .env file
create_env_file() {
    echo "📝 Creating environment file..."
    
    if [ -f .env ]; then
        echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
    else
        cat > .env <<EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Services
PRODUCT_SERVICE_URL=http://localhost:8001
INVENTORY_SERVICE_URL=http://localhost:8002
SALES_SERVICE_URL=http://localhost:8003
CUSTOMER_SERVICE_URL=http://localhost:8005
AI_SERVICE_URL=http://localhost:8010

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=localhost:9000

# Environment
NODE_ENV=development
EOF
        echo -e "${GREEN}✓ .env file created${NC}"
    fi
    echo ""
}

# Start infrastructure
start_infrastructure() {
    echo "🏗️  Starting infrastructure services..."
    docker-compose up -d postgres redis kafka zookeeper minio
    
    echo "⏳ Waiting for services to be ready (30 seconds)..."
    sleep 30
    
    echo -e "${GREEN}✓ Infrastructure services started${NC}"
    echo ""
}

# Initialize databases
init_databases() {
    echo "🗄️  Initializing databases..."
    
    # Create databases
    docker-compose exec -T postgres psql -U postgres -d postgres <<EOF
CREATE DATABASE IF NOT EXISTS products_db;
CREATE DATABASE IF NOT EXISTS inventory_db;
CREATE DATABASE IF NOT EXISTS sales_db;
CREATE DATABASE IF NOT EXISTS customers_db;
CREATE DATABASE IF NOT EXISTS vendors_db;
CREATE DATABASE IF NOT EXISTS finance_db;
CREATE DATABASE IF NOT EXISTS hr_db;
CREATE DATABASE IF NOT EXISTS analytics_db;
CREATE DATABASE IF NOT EXISTS ai_db;
EOF
    
    # Apply outbox pattern
    for db in products_db inventory_db sales_db customers_db vendors_db finance_db hr_db; do
        echo "  Applying outbox pattern to $db..."
        docker-compose exec -T postgres psql -U postgres -d $db < db/migrations/000_outbox_pattern.sql
    done
    
    echo -e "${GREEN}✓ Databases initialized${NC}"
    echo ""
}

# Create Kafka topics
create_kafka_topics() {
    echo "📨 Creating Kafka topics..."
    
    topics=(
        "orders.events.v1:6"
        "inventory.events.v1:4"
        "products.events.v1:4"
        "customers.events.v1:3"
        "payments.events.v1:3"
        "vendors.events.v1:2"
        "finance.events.v1:2"
        "hr.events.v1:2"
        "analytics.events.v1:3"
        "notifications.events.v1:4"
    )
    
    for topic_config in "${topics[@]}"; do
        IFS=':' read -r topic partitions <<< "$topic_config"
        echo "  Creating topic: $topic (partitions: $partitions)"
        docker-compose exec -T kafka kafka-topics --create \
            --bootstrap-server localhost:9092 \
            --topic "$topic" \
            --partitions "$partitions" \
            --replication-factor 1 \
            --if-not-exists 2>/dev/null || true
    done
    
    echo -e "${GREEN}✓ Kafka topics created${NC}"
    echo ""
}

# Start backend services
start_backend() {
    echo "⚙️  Starting backend services..."
    docker-compose up -d product-service inventory-service sales-service api-gateway ai-service
    
    echo "⏳ Waiting for services to start (15 seconds)..."
    sleep 15
    
    echo -e "${GREEN}✓ Backend services started${NC}"
    echo ""
}

# Setup frontend
setup_frontend() {
    echo "🎨 Setting up frontend..."
    
    if [ -d "apps/next-erp/node_modules" ]; then
        echo -e "${YELLOW}⚠ Frontend dependencies already installed, skipping${NC}"
    else
        cd apps/next-erp
        echo "  Installing dependencies..."
        npm install
        cd ../..
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    fi
    echo ""
}

# Create test user
create_test_user() {
    echo "👤 Creating test user..."
    
    sleep 5  # Wait for API Gateway to be fully ready
    
    response=$(curl -s -X POST http://localhost:4000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Admin User",
            "email": "admin@example.com",
            "password": "admin123",
            "role": "SUPER_ADMIN"
        }' || echo "failed")
    
    if [[ $response == *"success"* ]]; then
        echo -e "${GREEN}✓ Test user created${NC}"
        echo "  Email: admin@example.com"
        echo "  Password: admin123"
    else
        echo -e "${YELLOW}⚠ Could not create test user (may already exist)${NC}"
    fi
    echo ""
}

# Verify setup
verify_setup() {
    echo "🔍 Verifying setup..."
    
    services=(
        "postgres:5432"
        "redis:6379"
        "kafka:9092"
        "product-service:8001"
        "inventory-service:8002"
        "sales-service:8003"
        "api-gateway:4000"
        "ai-service:8010"
    )
    
    all_healthy=true
    
    for service_config in "${services[@]}"; do
        IFS=':' read -r service port <<< "$service_config"
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "  ${GREEN}✓ $service (port $port)${NC}"
        else
            echo -e "  ${RED}✗ $service (port $port)${NC}"
            all_healthy=false
        fi
    done
    
    echo ""
    
    if [ "$all_healthy" = true ]; then
        echo -e "${GREEN}✅ All services are healthy!${NC}"
    else
        echo -e "${YELLOW}⚠ Some services are not responding${NC}"
        echo "   Run 'docker-compose logs' to check for errors"
    fi
    echo ""
}

# Print summary
print_summary() {
    echo "🎉 Setup Complete!"
    echo "================="
    echo ""
    echo "📍 Access Points:"
    echo "  Frontend:        http://localhost:3000"
    echo "  API Gateway:     http://localhost:4000"
    echo "  API Docs:        http://localhost:4000/api/docs"
    echo "  MinIO Console:   http://localhost:9001"
    echo ""
    echo "🔐 Test Credentials:"
    echo "  Email:    admin@example.com"
    echo "  Password: admin123"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Start frontend:  cd apps/next-erp && npm run dev"
    echo "  2. Open browser:    http://localhost:3000"
    echo "  3. Login with test credentials"
    echo "  4. Explore the application!"
    echo ""
    echo "📖 Documentation:"
    echo "  README.md"
    echo "  GETTING-STARTED.md"
    echo "  ARCHITECTURE-POLYGLOT-SERVICES.md"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "  View logs:       docker-compose logs -f"
    echo "  Stop services:   docker-compose down"
    echo "  Restart:         docker-compose restart"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    create_env_file
    start_infrastructure
    init_databases
    create_kafka_topics
    start_backend
    setup_frontend
    create_test_user
    verify_setup
    print_summary
}

# Run main function
main
