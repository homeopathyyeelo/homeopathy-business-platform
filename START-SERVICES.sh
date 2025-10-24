#!/bin/bash

# =====================================================
# HomeoERP - Complete Service Startup Script
# =====================================================

set -e

echo "════════════════════════════════════════════════"
echo "   🚀 HomeoERP Microservices Startup"
echo "════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 1: Start infrastructure services
echo "📦 Step 1: Starting infrastructure services..."
echo "   - PostgreSQL (Port 5432)"
echo "   - Redis (Port 6379)"
echo "   - MinIO (Port 9000, 9001)"
echo "   - Kafka + Zookeeper (Port 9092, 2181)"
echo ""

docker-compose up -d postgres redis minio zookeeper kafka

echo -e "${YELLOW}⏳ Waiting for services to be healthy (30 seconds)...${NC}"
sleep 30

# Step 2: Run database migrations
echo ""
echo "🗄️  Step 2: Running database migrations..."

# Check if database exists
DB_EXISTS=$(docker exec erp-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='yeelo_homeopathy'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "   Creating database..."
    docker exec erp-postgres psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;"
fi

echo "   Running migrations..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < database/migrations/002_invoice_parser_tables.sql
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < database/migrations/003_sales_tables.sql
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < database/migrations/004_complete_invoice_system.sql

echo -e "${GREEN}✅ Database migrations completed${NC}"

# Step 3: Start microservices
echo ""
echo "🔧 Step 3: Starting microservices..."
echo "   - Invoice Parser Service (Python/FastAPI - Port 8005)"
echo "   - Purchase Service (Golang/Gin - Port 8006)"
echo "   - Main API Service (Golang - Port 3004)"
echo "   - API Gateway (Node.js - Port 4000)"
echo ""

docker-compose up -d invoice-parser purchase-service api-golang api-gateway

echo -e "${YELLOW}⏳ Waiting for services to start (20 seconds)...${NC}"
sleep 20

# Step 4: Health checks
echo ""
echo "🏥 Step 4: Running health checks..."
echo ""

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not responding${NC}"
        return 1
    fi
}

check_service "PostgreSQL" "http://localhost:5432" || echo "   (DB check via psql)"
check_service "Redis" "http://localhost:6379" || echo "   (Redis check via redis-cli)"
check_service "MinIO" "http://localhost:9000/minio/health/live"
check_service "Kafka UI" "http://localhost:8080"
check_service "Invoice Parser" "http://localhost:8005/health"
check_service "Purchase Service" "http://localhost:8006/health"
check_service "Main API" "http://localhost:3004/health"
check_service "API Gateway" "http://localhost:4000/health"

# Step 5: Summary
echo ""
echo "════════════════════════════════════════════════"
echo "   ✨ Services Started Successfully!"
echo "════════════════════════════════════════════════"
echo ""
echo "📊 Service URLs:"
echo "   • API Gateway:        http://localhost:4000"
echo "   • Invoice Parser:     http://localhost:8005/docs"
echo "   • Purchase Service:   http://localhost:8006"
echo "   • Main API:           http://localhost:3004"
echo "   • MinIO Console:      http://localhost:9001"
echo "   • Kafka UI:           http://localhost:8080"
echo ""
echo "🗄️  Database:"
echo "   • PostgreSQL:         localhost:5432"
echo "   • Database:           yeelo_homeopathy"
echo "   • User:               postgres"
echo "   • Password:           postgres"
echo ""
echo "📝 Next Steps:"
echo "   1. Start Next.js frontend:"
echo "      cd /var/www/homeopathy-business-platform"
echo "      npx next dev -p 3000"
echo ""
echo "   2. Access the application:"
echo "      http://localhost:3000"
echo ""
echo "   3. API Documentation:"
echo "      http://localhost:8005/docs (Invoice Parser)"
echo ""
echo "   4. Upload test invoice:"
echo "      Navigate to: http://localhost:3000/purchases/invoice-upload"
echo ""
echo "════════════════════════════════════════════════"
echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
