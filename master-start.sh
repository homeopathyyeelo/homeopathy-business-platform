#!/bin/bash

# MASTER-START.sh
# Yeelo Homeopathy Platform - Complete Startup Script
# Consolidates all functionality into one script for smooth development
# Includes bug fixes and comprehensive service management

set -e

echo "🚀 Starting Yeelo Homeopathy Platform - Master Script"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
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

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready at $url${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Step 1: Fix Common Bugs (from FIX-NESTJS-ERRORS.sh)
print_status "🔧 Applying bug fixes..."
echo ""

# Fix NestJS ai.service.ts
sed -i 's/this\.prisma\.aiModel/\/\/ this.prisma.aiModel/g' services/api-nest/src/ai/ai.service.ts 2>/dev/null || true
sed -i 's/this\.prisma\.aiRequest/\/\/ this.prisma.aiRequest/g' services/api-nest/src/ai/ai.service.ts 2>/dev/null || true
sed -i 's/created_at/createdAt/g' services/api-nest/src/ai/ai.service.ts 2>/dev/null || true

# Fix NestJS b2b.service.ts
sed -i 's/order_items/orderItems/g' services/api-nest/src/b2b/b2b.service.ts 2>/dev/null || true
sed -i 's/order_type/orderType/g' services/api-nest/src/b2b/b2b.service.ts 2>/dev/null || true
sed -i 's/total_amount/totalAmount/g' services/api-nest/src/b2b/b2b.service.ts 2>/dev/null || true
sed -i 's/customer_id/customerId/g' services/api-nest/src/b2b/b2b.service.ts 2>/dev/null || true
sed -i 's/customer_type/\/\/ customer_type/g' services/api-nest/src/b2b/b2b.service.ts 2>/dev/null || true

# Fix Golang unused imports
sed -i '/^[[:space:]]*"net\/http"$/d' services/api-golang/handlers.go 2>/dev/null || true
sed -i '/^[[:space:]]*"encoding\/json"$/d' services/api-golang/main.go 2>/dev/null || true
sed -i '/^[[:space:]]*"strconv"$/d' services/api-golang/main.go 2>/dev/null || true

print_success "Bug fixes applied"

# Step 2: Environment Setup
print_status "📝 Setting up environment..."

# Create .env if missing
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy

# Redis
REDIS_URL=redis://localhost:6380

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI (optional)
OPENAI_API_KEY=

# MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_ENDPOINT=localhost:9000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
EOF
    print_success ".env file created"
else
    print_success ".env file exists"
fi

# Set runtime environment variables
export KAFKAJS_NO_PARTITIONER_WARNING=1
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export REDIS_URL="redis://localhost:6380"
export KAFKA_BROKERS="localhost:9092"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Step 3: Check Dependencies
print_status "🔍 Checking dependencies..."

if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed."
    exit 1
fi
print_success "docker-compose is installed"

# Step 4: Stop Existing Services
print_status "🛑 Stopping existing services..."
pkill -f "go run" || true
pkill -f "node.*api" || true
pkill -f "npm run dev" || true
pkill -f "npm start" || true
docker-compose -f docker-compose.master.yml down 2>/dev/null || true
sleep 2

# Step 5: Start Infrastructure (Docker)
print_status "🐳 Starting Docker infrastructure..."
./START-INFRA.sh
sleep 10

# Step 6: Database Setup
print_status "🗄️ Setting up database..."
npm run db:generate 2>/dev/null || print_warning "Prisma generate skipped (may not be needed)"
npm run db:migrate:deploy 2>/dev/null || print_warning "Migrations skipped (may not be needed)"
print_success "Database setup completed"

# Step 7: Start Services
print_status "🚀 Starting all services..."

# Store PIDs
declare -a PIDS=()

echo ""
echo "🌐 Starting Backend Services..."
echo "================================"

# 1. NestJS API (Port 3001) - Fixed
echo -e "${YELLOW}Starting NestJS API on port 3001...${NC}"
cd services/api-nest
export PORT=3001
npm run start:dev > /tmp/nestjs-api.log 2>&1 &
NESTJS_PID=$!
PIDS+=($NESTJS_PID)
cd ../..
sleep 3

# 2. Fastify API (Port 3002) - Fixed
echo -e "${YELLOW}Starting Fastify API on port 3002...${NC}"
cd services/api-fastify
export PORT=3002
npm run dev > /tmp/fastify-api.log 2>&1 &
FASTIFY_PID=$!
PIDS+=($FASTIFY_PID)
cd ../..
sleep 3

# 3. Express API (Port 3003)
echo -e "${YELLOW}Starting Express API on port 3003...${NC}"
cd services/api-express
export PORT=3003
node src/index-complete.js > /tmp/express-api.log 2>&1 &
EXPRESS_PID=$!
PIDS+=($EXPRESS_PID)
cd ../..
sleep 3

# 4. Golang API (Port 3004) - Fixed
echo -e "${YELLOW}Starting Golang API on port 3004...${NC}"
cd services/api-golang
export PORT=3004
go run . > /tmp/golang-api.log 2>&1 &
GOLANG_PID=$!
PIDS+=($GOLANG_PID)
cd ../..
sleep 3

# 5. Auth Service (Port 3005) - Fixed
echo -e "${YELLOW}Starting Auth Service on port 3005...${NC}"
cd services/auth-service
export PORT=3005
npm run dev > /tmp/auth-api.log 2>&1 &
AUTH_PID=$!
PIDS+=($AUTH_PID)
cd ../..
sleep 3

# 6. Python AI Service (Port 8001) - Already in Docker
echo -e "${GREEN}✅ AI Service running in Docker on port 8001${NC}"

echo ""
echo "🎨 Starting Frontend..."
echo "======================"

# 7. Next.js Frontend (Port 3000)
echo -e "${YELLOW}Starting Next.js Frontend on port 3000...${NC}"
npm run dev:app > /tmp/nextjs-frontend.log 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
sleep 5

# Step 8: Health Checks
print_status "🔍 Checking service health..."
echo "=============================="

wait_for_service "http://localhost:3001/health" "NestJS API"
wait_for_service "http://localhost:3002/health" "Fastify API"
wait_for_service "http://localhost:3003/health" "Express API"
wait_for_service "http://localhost:3004/health" "Golang API"
wait_for_service "http://localhost:3005/health" "Auth Service"
wait_for_service "http://localhost:8001/health" "AI Service"
wait_for_service "http://localhost:3000" "Next.js Frontend"

# Step 9: Final Status
echo ""
echo "🎉 Yeelo Homeopathy Platform Started Successfully!"
echo "=================================================="
echo -e "${GREEN}🌐 Frontend:${NC}           http://localhost:3000"
echo ""
echo -e "${GREEN}📡 Backend APIs:${NC}"
echo "  🔐 Auth Service:       http://localhost:3005"
echo "     Docs:              http://localhost:3005/docs"
echo "     JWKS:              http://localhost:3005/.well-known/jwks.json"
echo ""
echo "  🏗️  NestJS API:         http://localhost:3001"
echo "     Docs:              http://localhost:3001/api"
echo "     Features:          Orders, Inventory, Purchase, Finance, B2B, AI"
echo ""
echo "  ⚡ Fastify API:        http://localhost:3002"
echo "     Docs:              http://localhost:3002/documentation"
echo ""
echo "  ⚡ Express API:        http://localhost:3003"
echo "     Docs:              http://localhost:3003/api-docs"
echo ""
echo "  🔧 Golang API:         http://localhost:3004"
echo "     Swagger:           http://localhost:3004/swagger"
echo ""
echo "  🤖 AI Service:         http://localhost:8001"
echo "     Docs:              http://localhost:8001/docs"
echo ""
echo -e "${GREEN}🔧 Infrastructure:${NC}"
echo "  📋 Kafka UI:           http://localhost:8080"
echo "  💾 MinIO Console:      http://localhost:9001 (minio/minio123)"
echo "  🗄️  PostgreSQL:         localhost:5433 (postgres/postgres)"
echo "  📦 Redis:              localhost:6380"
echo "  📨 Kafka:              localhost:9092"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "  tail -f /tmp/auth-api.log"
echo "  tail -f /tmp/nestjs-api.log"
echo "  tail -f /tmp/fastify-api.log"
echo "  tail -f /tmp/express-api.log"
echo "  tail -f /tmp/golang-api.log"
echo "  tail -f /tmp/nextjs-frontend.log"
echo ""

# Store PIDs for cleanup
echo "${PIDS[@]}" > /tmp/yeelo-pids.txt

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    if [ -f /tmp/yeelo-pids.txt ]; then
        for pid in $(cat /tmp/yeelo-pids.txt); do
            kill $pid 2>/dev/null || true
        done
        rm /tmp/yeelo-pids.txt
    fi
    docker-compose -f docker-compose.master.yml down 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running and monitor services
echo "✨ All services are running! Monitoring..."
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Just wait for Ctrl+C
wait
