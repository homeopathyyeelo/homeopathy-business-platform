#!/bin/bash

# START-ALL-SERVICES.sh
# Complete startup script for all microservices
# Supports Next.js, NestJS, Express, Golang, Python with Kafka, Zookeeper, GraphQL, Swagger

set -e

echo "🚀 Starting Homeopathy Business Platform - All Services"
echo "========================================================"
echo ""

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

print_success "docker-compose is installed"

# Create .env file if it doesn't exist
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

# Stop any running containers
print_status "Stopping any running containers..."
docker-compose -f docker-compose.master.yml down 2>/dev/null || true

# Remove old volumes (optional - comment out if you want to keep data)
# print_warning "Removing old volumes..."
# docker-compose -f docker-compose.master.yml down -v

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.master.yml pull

# Build services
print_status "Building services..."
docker-compose -f docker-compose.master.yml build

# Start infrastructure services first
print_status "Starting infrastructure services (Zookeeper, Kafka, PostgreSQL, Redis, MinIO)..."
docker-compose -f docker-compose.master.yml up -d zookeeper kafka postgres redis minio

# Wait for infrastructure to be ready
print_status "Waiting for infrastructure services to be healthy..."
sleep 10

# Check if PostgreSQL is ready
print_status "Waiting for PostgreSQL..."
until docker-compose -f docker-compose.master.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
print_success "PostgreSQL is ready"

# Check if Kafka is ready
print_status "Waiting for Kafka..."
sleep 5
print_success "Kafka is ready"

# Run database migrations
print_status "Running database migrations..."
npm run db:generate
npm run db:migrate:deploy
print_success "Database migrations completed"

# Start monitoring services
print_status "Starting monitoring services (Kafka UI, Schema Registry)..."
docker-compose -f docker-compose.master.yml up -d kafka-ui schema-registry

# Start backend services
print_status "Starting backend services..."
docker-compose -f docker-compose.master.yml up -d \
    api-nest \
    api-fastify \
    api-express \
    api-golang \
    ai-service

# Wait for backend services to start
sleep 5

# Start gateway services
print_status "Starting gateway services (GraphQL, API Gateway)..."
docker-compose -f docker-compose.master.yml up -d \
    graphql-gateway \
    api-gateway

# Start workers
print_status "Starting worker services..."
docker-compose -f docker-compose.master.yml up -d \
    outbox-worker \
    worker-golang

# Start frontend
print_status "Starting Next.js frontend..."
docker-compose -f docker-compose.master.yml up -d nextjs-app

# Wait for all services to be ready
print_status "Waiting for all services to start..."
sleep 10

# Show status
print_status "Checking service status..."
docker-compose -f docker-compose.master.yml ps

echo ""
echo "========================================================"
print_success "🎉 All services are starting up!"
echo "========================================================"
echo ""
echo "📋 Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend:"
echo "   Next.js App:           http://localhost:3000"
echo ""
echo "🔌 Backend APIs:"
echo "   NestJS API:            http://localhost:3001"
echo "   NestJS Swagger:        http://localhost:3001/api"
echo "   Fastify API:           http://localhost:3002"
echo "   Fastify Swagger:       http://localhost:3002/documentation"
echo "   Express API:           http://localhost:3003"
echo "   Express Swagger:       http://localhost:3003/api-docs"
echo "   Golang API:            http://localhost:3004"
echo "   Python AI Service:     http://localhost:8001"
echo "   Python Swagger:        http://localhost:8001/docs"
echo ""
echo "🌉 Gateways:"
echo "   GraphQL Gateway:       http://localhost:4000/graphql"
echo "   GraphQL Playground:    http://localhost:4000"
echo "   API Gateway:           http://localhost:5000"
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
echo "   Schema Registry:       http://localhost:8081"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:             docker-compose -f docker-compose.master.yml logs -f [service-name]"
echo "   Stop all:              docker-compose -f docker-compose.master.yml down"
echo "   Restart service:       docker-compose -f docker-compose.master.yml restart [service-name]"
echo "   View status:           docker-compose -f docker-compose.master.yml ps"
echo ""
echo "🔍 Service Names:"
echo "   nextjs-app, api-nest, api-fastify, api-express, api-golang,"
echo "   ai-service, graphql-gateway, api-gateway, outbox-worker,"
echo "   worker-golang, postgres, redis, kafka, zookeeper, minio"
echo ""
echo "========================================================"
print_success "✨ Platform is ready for development!"
echo "========================================================"
