#!/bin/bash

# START-SIMPLE.sh
# Quick start with core services only (NestJS + Python AI + Infrastructure)

set -e

echo "🚀 Starting Core Services (Simplified Setup)"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Create .env if missing
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp env.example .env 2>/dev/null || cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://localhost:6380
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=
EOF
    print_success ".env file created"
fi

# Stop any running containers
print_status "Stopping any running containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Start infrastructure first
print_status "Starting infrastructure (PostgreSQL, Redis, Kafka, MinIO)..."
docker-compose -f docker-compose.simple.yml up -d zookeeper kafka postgres redis minio

# Wait for services
print_status "Waiting for services to be ready..."
sleep 15

# Run migrations
print_status "Running database migrations..."
npm run db:generate 2>/dev/null || true
npm run db:migrate:deploy 2>/dev/null || true

# Start monitoring
print_status "Starting monitoring (Kafka UI)..."
docker-compose -f docker-compose.simple.yml up -d kafka-ui

# Start backend services
print_status "Starting backend services (NestJS, Python AI)..."
docker-compose -f docker-compose.simple.yml up -d api-nest ai-service

# Wait for services to start
sleep 10

# Show status
docker-compose -f docker-compose.simple.yml ps

echo ""
echo "=============================================="
print_success "✅ Core services are running!"
echo "=============================================="
echo ""
echo "📋 Available Services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔌 APIs:"
echo "   NestJS API:            http://localhost:3001"
echo "   NestJS Swagger:        http://localhost:3001/api"
echo "   Python AI Service:     http://localhost:8001"
echo "   Python Swagger:        http://localhost:8001/docs"
echo ""
echo "🗄️  Infrastructure:"
echo "   PostgreSQL:            localhost:5433"
echo "   Redis:                 localhost:6380"
echo "   Kafka:                 localhost:9092"
echo "   MinIO Console:         http://localhost:9001"
echo ""
echo "📊 Monitoring:"
echo "   Kafka UI:              http://localhost:8080"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Commands:"
echo "   View logs:             docker-compose -f docker-compose.simple.yml logs -f"
echo "   Stop all:              docker-compose -f docker-compose.simple.yml down"
echo "   Restart:               ./START-SIMPLE.sh"
echo ""
echo "✨ Ready for development!"
