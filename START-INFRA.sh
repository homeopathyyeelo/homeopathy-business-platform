#!/bin/bash

# START-INFRA.sh
# Start only infrastructure services (PostgreSQL, Redis, Kafka, MinIO)
# Use this for local development without Docker containers for apps

set -e

echo "🏗️  Starting Infrastructure Services Only"
echo "=========================================="
echo ""

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

# Stop any running containers
print_status "Stopping any running containers..."
docker-compose -f docker-compose.infra.yml down 2>/dev/null || true

# Start infrastructure
print_status "Starting infrastructure services..."
docker-compose -f docker-compose.infra.yml up -d

# Wait for services
print_status "Waiting for services to be ready..."
sleep 10

# Show status
docker-compose -f docker-compose.infra.yml ps

echo ""
echo "=========================================="
print_success "✅ Infrastructure is running!"
echo "=========================================="
echo ""
echo "📋 Available Services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🗄️  Infrastructure:"
echo "   PostgreSQL:            localhost:5433"
echo "   Redis:                 localhost:6380"
echo "   Kafka:                 localhost:9092"
echo "   Zookeeper:             localhost:2181"
echo "   MinIO Console:         http://localhost:9001"
echo "   MinIO API:             http://localhost:9000"
echo ""
echo "📊 Monitoring:"
echo "   Kafka UI:              http://localhost:8080"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Now you can run your apps locally:"
echo "   cd services/api-nest && npm run start:dev"
echo "   cd services/ai-service && uvicorn src.main:app --reload"
echo "   npm run dev:app  # Next.js frontend"
echo ""
echo "📝 Commands:"
echo "   Stop:                  docker-compose -f docker-compose.infra.yml down"
echo "   Logs:                  docker-compose -f docker-compose.infra.yml logs -f"
echo "   Restart:               ./START-INFRA.sh"
echo ""
print_success "✨ Ready for local development!"
