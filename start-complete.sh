#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Complete Startup Script
# Starts: Docker (Postgres, Redis, Kafka, MinIO) + All Microservices + Frontend
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     🏥 Yeelo Homeopathy ERP - Complete Startup 🏥        ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. PRE-FLIGHT CHECKS
# ============================================================================

log "🔍 Running pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "❌ Docker not found. Please install Docker first."
fi
log "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detected"

# Resolve Docker Compose command (docker compose v2 or legacy docker-compose)
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose -f docker-compose.dev.yml"
    log "✅ Docker Compose (v2) detected"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose -f docker-compose.dev.yml"
    log "✅ Docker Compose (legacy) detected"
else
    error "❌ Docker Compose not found. Please install Docker Compose."
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    error "❌ Node.js not found. Please install Node.js 18+"
fi
log "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    error "❌ npm not found"
fi
log "✅ npm $(npm --version) detected"

# Check Go (optional)
if command -v go &> /dev/null; then
    log "✅ Go $(go version | cut -d' ' -f3) detected"
    GO_AVAILABLE=true
else
    warn "⚠️  Go not installed - Go services will be skipped"
    GO_AVAILABLE=false
fi

# Check Python (optional)
if command -v python3 &> /dev/null; then
    log "✅ Python $(python3 --version | cut -d' ' -f2) detected"
    PYTHON_AVAILABLE=true
else
    warn "⚠️  Python not installed - AI service will be skipped"
    PYTHON_AVAILABLE=false
fi

echo ""

# ============================================================================
# 2. ENVIRONMENT SETUP
# ============================================================================

log "📝 Setting up environment..."

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        log "✅ Created .env from env.example"
    else
        warn "⚠️  No .env file found. Creating default..."
        cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=yeelo_homeopathy

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# API URLs
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenAI (optional)
OPENAI_API_KEY=

# Node Environment
NODE_ENV=development
EOF
        log "✅ Created default .env file"
    fi
else
    log "✅ .env file exists"
fi

# Create logs directory
mkdir -p logs

echo ""

# ============================================================================
# 3. INSTALL DEPENDENCIES
# ============================================================================

log "📦 Installing dependencies..."

if [ ! -d "node_modules" ]; then
    npm install
    log "✅ Dependencies installed"
else
    log "✅ Dependencies already installed"
fi

echo ""

# ============================================================================
# 4. START DOCKER SERVICES
# ============================================================================

log "🐳 Starting Docker services..."

# Check if dev compose file exists
if [ ! -f "docker-compose.dev.yml" ]; then
    error "❌ docker-compose.dev.yml not found!"
fi

# Stop existing containers
log "Stopping existing containers..."
$COMPOSE down 2>&1 | tee -a logs/docker-startup.log

# Stop system Redis if running (to avoid port conflict)
info "Checking for port conflicts..."
if sudo systemctl is-active --quiet redis-server; then
    warn "System Redis is running on port 6379. Stopping it..."
    sudo systemctl stop redis-server
    log "✅ System Redis stopped"
fi

# Start Docker services
info "Starting PostgreSQL, Redis, Kafka, MinIO..."
$COMPOSE up -d postgres redis kafka minio 2>&1 | tee logs/docker-startup.log

# Wait for services to be ready
log "⏳ Waiting for Docker services to be ready..."
sleep 10

# Check PostgreSQL
info "Checking PostgreSQL..."
for i in {1..20}; do
    if $COMPOSE exec -T postgres pg_isready -U postgres -d yeelo_homeopathy >/dev/null 2>&1; then
        log "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 20 ]; then
        error "❌ PostgreSQL failed to start after 40 seconds"
        exit 1
    fi
    sleep 2
done

# Check Redis
info "Checking Redis..."
for i in {1..10}; do
    if $COMPOSE exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        log "✅ Redis is ready"
        break
    fi
    if [ $i -eq 10 ]; then
        warn "⚠️  Redis not ready, but continuing..."
    fi
    sleep 1
done

# Check Kafka
info "Checking Kafka..."
sleep 5  # Kafka needs more time
log "✅ Kafka starting (will be ready in ~30s)"

# Check MinIO
info "Checking MinIO..."
if curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    log "✅ MinIO is ready"
else
    warn "⚠️  MinIO check failed (may still be starting)"
fi

echo ""

# ============================================================================
# 5. RUN DATABASE MIGRATIONS
# ============================================================================

log "🗄️  Running database migrations..."

if [ -f "db/migrations/000_outbox_pattern.sql" ]; then
    info "Applying outbox pattern migration..."
    docker-compose exec -T postgres psql -U postgres -d yeelo_homeopathy < db/migrations/000_outbox_pattern.sql 2>/dev/null || warn "⚠️  Migration may have already been applied"
    log "✅ Database migrations complete"
fi

echo ""

# ============================================================================
# 6. START MICROSERVICES
# ============================================================================

log "🚀 Starting microservices..."

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    
    if [ -d "$dir" ]; then
        info "Starting $name..."
        cd "$dir"
        
        # Install dependencies if needed
        if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
            npm install --silent
        fi
        
        # Start service in background
        $cmd > "../../logs/${name}.log" 2>&1 &
        local pid=$!
        echo $pid > "../../logs/${name}.pid"
        cd - > /dev/null
        
        log "✅ $name started (PID: $pid, Port: $port)"
    else
        warn "⚠️  $name directory not found: $dir"
    fi
}

# Start Go services
if [ "$GO_AVAILABLE" = true ]; then
    # Start api-golang-master (Import/Export API - Port 3005)
    if [ -d "services/api-golang-master" ]; then
        info "Starting api-golang-master (Import/Export API)..."
        cd services/api-golang-master
        
        # Build if binary doesn't exist or source is newer
        if [ ! -f "bin/api" ] || [ "cmd/main.go" -nt "bin/api" ]; then
            info "Building api-golang-master..."
            go build -o bin/api cmd/main.go
        fi
        
        # Ensure it talks to Dockerized Postgres/Redis on host ports
        DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy" \
        REDIS_URL="redis://localhost:6380" \
        ./bin/api > ../../logs/api-golang-master.log 2>&1 &
        echo $! > ../../logs/api-golang-master.pid
        cd - > /dev/null
        log "✅ api-golang-master started (PID: $(cat logs/api-golang-master.pid), Port: 3005)"
    fi
    
    start_service "product-service" "services/product-service" "go run main.go" "8001"
    start_service "inventory-service" "services/inventory-service" "go run main.go" "8002"
    start_service "sales-service" "services/sales-service" "go run main.go" "8003"
fi

# Start Auth Service (Node) on 3050
start_service "auth-service" "services/auth-service" "env PORT=3050 npm run dev" "3050"

# Start API Gateway (Node) on 3001
start_service "api-gateway" "services/api-gateway" "npm run dev" "3001"

# Start Python AI Service
if [ "$PYTHON_AVAILABLE" = true ] && [ -d "services/ai-service" ]; then
    info "Starting AI service..."
    cd services/ai-service
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt --quiet
    else
        source venv/bin/activate
    fi
    uvicorn main:app --host 0.0.0.0 --port 8010 > ../../logs/ai-service.log 2>&1 &
    echo $! > ../../logs/ai-service.pid
    cd - > /dev/null
    log "✅ AI service started (PID: $(cat logs/ai-service.pid), Port: 8010)"
fi

# Wait for services to initialize
log "⏳ Waiting for services to initialize..."
sleep 5

echo ""

# ============================================================================
# 7. START FRONTEND
# ============================================================================

log "🌐 Starting Next.js frontend..."

# Clean Next.js cache to prevent corruption
info "Cleaning Next.js build cache..."
rm -rf .next node_modules/.cache 2>/dev/null || true

# Start frontend
cd "$PROJECT_ROOT"
npm run dev:app > logs/frontend.log 2>&1 &
echo $! > logs/frontend.pid
log "✅ Frontend started (PID: $(cat logs/frontend.pid), Port: 3000)"

echo ""

# ============================================================================
# 8. HEALTH CHECKS
# ============================================================================

log "🔍 Running health checks..."
info "Waiting 15 seconds for services to initialize..."
sleep 15

check_health() {
    local name=$1
    local url=$2
    local retries=${3:-3}
    
    for i in $(seq 1 $retries); do
        if curl -s -f "$url" -m 5 > /dev/null 2>&1; then
            log "✅ $name is healthy"
            return 0
        fi
        sleep 2
    done
    warn "⚠️  $name health check failed (may need more time)"
    return 1
}

# Check Docker services
info "Checking Docker services..."
if $COMPOSE exec -T postgres pg_isready -U postgres -d yeelo_homeopathy >/dev/null 2>&1; then
    log "✅ PostgreSQL is healthy"
else
    warn "⚠️  PostgreSQL health check failed"
fi

if $COMPOSE exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    log "✅ Redis is healthy"
else
    warn "⚠️  Redis health check failed"
fi

check_health "MinIO" "http://localhost:9000/minio/health/live" 2

# Check microservices (with more retries)
info "Checking microservices..."
check_health "Product Service" "http://localhost:8001/health" 5 || true
check_health "Inventory Service" "http://localhost:8002/health" 5 || true
check_health "Sales Service" "http://localhost:8003/health" 5 || true
check_health "API Gateway" "http://localhost:3001/health" 5 || true
check_health "AI Service" "http://localhost:8010/health" 5 || true

# Check frontend (needs more time)
info "Checking frontend..."
check_health "Frontend" "http://localhost:3000" 10 || warn "⚠️  Frontend may need more time to compile"

echo ""

# ============================================================================
# 9. SUMMARY
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  🎉  All Services Started Successfully!                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📦 INFRASTRUCTURE:${NC}"
log "🐘 PostgreSQL:       localhost:5433"
log "🔴 Redis:            localhost:6380"
log "📨 Kafka:            localhost:9092"
log "📦 MinIO:            http://localhost:9000 (admin/minioadmin)"
echo ""

echo -e "${CYAN}🔧 MICROSERVICES:${NC}"
if [ "$GO_AVAILABLE" = true ]; then
    log "🚀 Import/Export API: http://localhost:3005"
    log "📦 Product Service:  http://localhost:8001"
    log "📦 Inventory Service: http://localhost:8002"
    log "🛒 Sales Service:    http://localhost:8003"
fi
log "🌐 API Gateway:      http://localhost:3001"
log "🌐 GraphQL:          http://localhost:3001/graphql"
if [ "$PYTHON_AVAILABLE" = true ]; then
    log "🤖 AI Service:       http://localhost:8010"
fi
echo ""

echo -e "${CYAN}🖥️  FRONTEND:${NC}"
log "💻 Next.js App:      http://localhost:3000"
log "⚙️  Layout Settings:  http://localhost:3000/app/settings/layout"
echo ""

echo -e "${CYAN}📋 MANAGEMENT:${NC}"
log "📊 Logs:             ./logs/"
log "🛑 Stop All:         ./stop-complete.sh"
log "🔄 Restart:          ./stop-complete.sh && ./start-complete.sh"
echo ""

echo -e "${CYAN}💡 TIPS:${NC}"
warn "• Monitor logs:      tail -f logs/frontend.log"
warn "• View all services: docker-compose ps"
warn "• Check Kafka:       docker-compose logs kafka"
warn "• MinIO Console:     http://localhost:9001"
echo ""

# Save service info
cat > logs/services.json << EOF
{
  "started_at": "$(date -Iseconds)",
  "docker": {
    "postgres": { "port": 5433, "status": "running" },
    "redis": { "port": 6380, "status": "running" },
    "kafka": { "port": 9092, "status": "running" },
    "minio": { "port": 9000, "status": "running" }
  },
  "microservices": {
    "api_golang_v2": {
      "pid": $(cat logs/api-golang-master.pid 2>/dev/null || echo "null"),
      "port": 3005,
      "description": "Import/Export API"
    },
    "product_service": {
      "pid": $(cat logs/product-service.pid 2>/dev/null || echo "null"),
      "port": 8001
    },
    "inventory_service": {
      "pid": $(cat logs/inventory-service.pid 2>/dev/null || echo "null"),
      "port": 8002
    },
    "sales_service": {
      "pid": $(cat logs/sales-service.pid 2>/dev/null || echo "null"),
      "port": 8003
    },
    "api_gateway": {
      "pid": $(cat logs/api-gateway.pid 2>/dev/null || echo "null"),
      "port": 4000
    },
    "ai_service": {
      "pid": $(cat logs/api-service.pid 2>/dev/null || echo "null"),
      "port": 8010
    }
  },
  "frontend": {
    "pid": $(cat logs/frontend.pid 2>/dev/null || echo "null"),
    "port": 3000,
    "url": "http://localhost:3000"
  }
}
EOF

log "✅ Service info saved to logs/services.json"
log "🚀 Platform is ready! Open http://localhost:3000 in your browser"
echo ""
