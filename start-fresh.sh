#!/bin/bash

# ============================================================================
# Fresh Start Script for Homeopathy ERP Platform
# ============================================================================
# Starts all services with upgraded versions:
# - Go 1.25
# - Next.js 15.1.6
# - React 19.0.0
# - Latest Docker images (Kafka 7.8, PostgreSQL 17, Redis 8)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Homeopathy ERP - Fresh Start (Upgraded Versions)         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/8]${NC} Checking prerequisites..."

# Check Go version
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed${NC}"
    echo -e "${YELLOW}Run: ./install-go-1.24.sh${NC}"
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo -e "${GREEN}✓${NC} Go version: $GO_VERSION"

# Check if Go 1.24+
if [[ "$GO_VERSION" < "1.24" ]]; then
    echo -e "${RED}❌ Go 1.24+ is required${NC}"
    echo -e "${YELLOW}Run: ./install-go-1.24.sh${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
echo -e "${GREEN}✓${NC} Docker version: $DOCKER_VERSION"

echo ""

# Step 2: Install frontend dependencies
echo -e "${YELLOW}[2/8]${NC} Installing frontend dependencies..."
npm install
echo -e "${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# Step 3: Install Go dependencies
echo -e "${YELLOW}[3/8]${NC} Installing Go dependencies..."
cd services/api-golang-master
export GOTOOLCHAIN=local
go mod tidy
go mod download
cd ../..
echo -e "${GREEN}✓${NC} Go dependencies installed"
echo ""

# Step 4: Start infrastructure services
echo -e "${YELLOW}[4/8]${NC} Starting infrastructure services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis kafka zookeeper minio

echo -e "${BLUE}⏳${NC} Waiting for services to be ready..."
sleep 10

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳${NC} Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec homeopathy-business-platform-postgres-1 pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "${GREEN}✓${NC} Infrastructure services started"
echo ""

# Step 5: Display running services
echo -e "${YELLOW}[5/8]${NC} Infrastructure status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep homeopathy || true
echo ""

# Step 6: Build Go backend
echo -e "${YELLOW}[6/8]${NC} Building Go backend..."
cd services/api-golang-master
if [ ! -f "api-golang" ]; then
    echo -e "${BLUE}🔨${NC} Compiling Go binary..."
    go build -o api-golang cmd/main.go
fi
echo -e "${GREEN}✓${NC} Go backend ready"
cd ../..
echo ""

# Step 7: Start backend service
echo -e "${YELLOW}[7/8]${NC} Starting backend API..."
cd services/api-golang-master

# Kill any existing Go processes on port 3005
lsof -ti:3005 | xargs kill -9 2>/dev/null || true

# Start backend in background
PORT=3005 \
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy?sslmode=disable" \
JWT_SECRET="your-super-secret-jwt-key-change-in-production" \
./api-golang > ../../logs/backend.log 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > ../../.backend.pid

cd ../..

# Wait for backend to be ready
sleep 5
if curl -s http://localhost:3005/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API started (PID: $BACKEND_PID)"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check logs/backend.log for details"
    exit 1
fi
echo ""

# Step 8: Start frontend
echo -e "${YELLOW}[8/8]${NC} Starting Next.js frontend..."

# Kill any existing Next.js processes
pkill -f "next dev" 2>/dev/null || true

# Start frontend in background
npm run dev:app > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid

echo -e "${GREEN}✓${NC} Frontend starting (PID: $FRONTEND_PID)"
echo ""

# Final status
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎉 All Services Started Successfully!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📋 Service URLs:${NC}"
echo -e "  ${BLUE}•${NC} Frontend:       ${GREEN}http://localhost:3000${NC}"
echo -e "  ${BLUE}•${NC} Backend API:    ${GREEN}http://localhost:3005${NC}"
echo -e "  ${BLUE}•${NC} Health Check:   ${GREEN}http://localhost:3005/health${NC}"
echo -e "  ${BLUE}•${NC} Swagger Docs:   ${GREEN}http://localhost:3005/swagger${NC}"
echo -e "  ${BLUE}•${NC} MinIO Console:  ${GREEN}http://localhost:9001${NC}"
echo -e "  ${BLUE}•${NC} Kafka UI:       ${GREEN}http://localhost:8080${NC}"
echo ""

echo -e "${GREEN}🔐 Login Credentials (Super Admin):${NC}"
echo -e "  ${BLUE}•${NC} Email:    ${YELLOW}medicine@yeelohomeopathy.com${NC}"
echo -e "  ${BLUE}•${NC} Password: ${YELLOW}Medicine@2024${NC}"
echo ""

echo -e "${GREEN}📊 Running Containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep homeopathy || true
echo ""

echo -e "${GREEN}📝 Logs:${NC}"
echo -e "  ${BLUE}•${NC} Backend:  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  ${BLUE}•${NC} Frontend: ${YELLOW}tail -f logs/frontend.log${NC}"
echo ""

echo -e "${GREEN}🛑 To stop all services:${NC}"
echo -e "  ${YELLOW}./stop-all.sh${NC}"
echo ""

echo -e "${GREEN}✨ Happy coding!${NC}"
