#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# PRODUCTION-READY STARTUP SCRIPT
# Starts infrastructure and all application services with proper
# health checks, error handling, and monitoring
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Timestamp
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Logging functions
log() {
    echo -e "${CYAN}[$(timestamp)]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

log_success() {
    echo -e "${GREEN}[$(timestamp)] ✅ $1${NC}" | tee -a "$LOG_DIR/startup.log"
}

log_error() {
    echo -e "${RED}[$(timestamp)] ❌ $1${NC}" | tee -a "$LOG_DIR/startup.log"
}

log_warning() {
    echo -e "${YELLOW}[$(timestamp)] ⚠️  $1${NC}" | tee -a "$LOG_DIR/startup.log"
}

echo "════════════════════════════════════════════════════════════════"
echo -e "${BOLD}${CYAN}🚀 YEELO HOMEOPATHY PLATFORM - PRODUCTION STARTUP${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

log "Running pre-flight checks..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi
log_success "Docker: $(docker --version | cut -d' ' -f3)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi
log_success "Docker Compose: $(docker-compose --version | cut -d' ' -f4)"

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
log_success "Node.js: $(node --version)"

# Check Go
if ! command -v go &> /dev/null; then
    log_error "Go is not installed"
    exit 1
fi
log_success "Go: $(go version | awk '{print $3}')"

# Check required directories
for dir in services db logs volumes; do
    if [ ! -d "$dir" ]; then
        log_warning "Directory $dir not found, creating..."
        mkdir -p "$dir"
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CLEANUP OLD PROCESSES
# ═══════════════════════════════════════════════════════════════

log "Cleaning up old processes..."

# Kill old application processes
pkill -f "go run" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*api" 2>/dev/null || true

# Clean ports
for port in 3000 3001 3002 3004 3005 8080; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        log_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

log_success "Cleanup complete"
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. START INFRASTRUCTURE (DOCKER)
# ═══════════════════════════════════════════════════════════════

log "Starting infrastructure services with Docker..."
echo ""

# Stop any running containers
log "Stopping old containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
sleep 2

# Start infrastructure
log "Starting Zookeeper, Kafka, PostgreSQL, Redis, MinIO..."
docker-compose -f docker-compose.production.yml up -d

log "Waiting for infrastructure to be ready..."
sleep 10

# ═══════════════════════════════════════════════════════════════
# 4. WAIT FOR INFRASTRUCTURE HEALTH
# ═══════════════════════════════════════════════════════════════

log "Checking infrastructure health..."
echo ""

wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    log "Waiting for $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.production.yml ps | grep "$service" | grep -q "healthy\|Up"; then
            log_success "$service is healthy"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log_warning "$service not ready yet (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service failed to become healthy"
    return 1
}

# Check each service
wait_for_service "yeelo-postgres"
wait_for_service "yeelo-redis"
wait_for_service "yeelo-zookeeper"
wait_for_service "yeelo-kafka"
wait_for_service "yeelo-minio"

echo ""
log_success "All infrastructure services are healthy!"
echo ""

# ═══════════════════════════════════════════════════════════════
# 5. INITIALIZE DATABASE
# ═══════════════════════════════════════════════════════════════

log "Initializing database..."

# Run migrations
if [ -d "db/migrations" ]; then
    log "Running database migrations..."
    
    for migration in db/migrations/*.sql; do
        if [ -f "$migration" ]; then
            log "Running migration: $(basename $migration)"
            PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy -f "$migration" 2>&1 | tee -a "$LOG_DIR/migrations.log"
        fi
    done
    
    log_success "Database migrations complete"
else
    log_warning "No migrations directory found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. CREATE KAFKA TOPICS
# ═══════════════════════════════════════════════════════════════

log "Creating Kafka topics..."

# List of topics to create
topics=(
    "product.events"
    "sales.events"
    "purchase.events"
    "inventory.events"
    "customer.events"
    "vendor.events"
    "order.events"
    "payment.events"
    "notification.events"
)

for topic in "${topics[@]}"; do
    docker exec yeelo-kafka kafka-topics \
        --bootstrap-server localhost:9092 \
        --create \
        --if-not-exists \
        --topic "$topic" \
        --partitions 3 \
        --replication-factor 1 \
        2>&1 | tee -a "$LOG_DIR/kafka-topics.log" || log_warning "Topic $topic might already exist"
done

log_success "Kafka topics created"
echo ""

# ═══════════════════════════════════════════════════════════════
# 7. SET ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════

log "Setting environment variables..."

export NODE_ENV=production
export KAFKAJS_NO_PARTITIONER_WARNING=1

# Database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy"
export DB_HOST="localhost"
export DB_PORT=5433
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_NAME="yeelo_homeopathy"

# Redis
export REDIS_URL="redis://localhost:6380"
export REDIS_HOST="localhost"
export REDIS_PORT=6380
export REDIS_PASSWORD="redis_password_change_in_production"

# Kafka
export KAFKA_BROKERS="localhost:9092"

# JWT
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Ports
export GOLANG_V1_PORT=8080
export GOLANG_V2_PORT=3005
export NESTJS_PORT=3001
export FASTIFY_PORT=3002
export EXPRESS_PORT=3004
export FRONTEND_PORT=3000

log_success "Environment variables set"
echo ""

# ═══════════════════════════════════════════════════════════════
# 8. START BACKEND SERVICES
# ═══════════════════════════════════════════════════════════════

log "Starting backend services..."
echo ""

# Store PIDs
declare -a PIDS=()

# Golang v1
log "Starting Golang v1 (Port $GOLANG_V1_PORT)..."
cd services/api-golang
export SERVER_PORT=$GOLANG_V1_PORT
export PORT=$GOLANG_V1_PORT
go run main.go > "$LOG_DIR/golang-v1.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
log_success "Golang v1 started (PID: ${PIDS[-1]})"
sleep 2

# Golang v2
log "Starting Golang v2 (Port $GOLANG_V2_PORT)..."
cd services/api-golang-v2
export PORT=$GOLANG_V2_PORT
go run cmd/main.go > "$LOG_DIR/golang-v2.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
log_success "Golang v2 started (PID: ${PIDS[-1]})"
sleep 2

# NestJS
log "Starting NestJS (Port $NESTJS_PORT)..."
cd services/api-nest
export PORT=$NESTJS_PORT
npm run start:prod > "$LOG_DIR/nestjs.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
log_success "NestJS started (PID: ${PIDS[-1]})"
sleep 2

# Fastify
log "Starting Fastify (Port $FASTIFY_PORT)..."
cd services/api-fastify
export PORT=$FASTIFY_PORT
npm run start > "$LOG_DIR/fastify.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
log_success "Fastify started (PID: ${PIDS[-1]})"
sleep 2

# Express
log "Starting Express (Port $EXPRESS_PORT)..."
cd services/api-express
export PORT=$EXPRESS_PORT
npm run start > "$LOG_DIR/express.log" 2>&1 &
PIDS+=($!)
cd "$SCRIPT_DIR"
log_success "Express started (PID: ${PIDS[-1]})"
sleep 2

echo ""

# ═══════════════════════════════════════════════════════════════
# 9. START FRONTEND
# ═══════════════════════════════════════════════════════════════

log "Starting Next.js Frontend (Port $FRONTEND_PORT)..."
export PORT=$FRONTEND_PORT
npm run build > "$LOG_DIR/frontend-build.log" 2>&1 || log_warning "Build might have warnings"
npm run start > "$LOG_DIR/frontend.log" 2>&1 &
PIDS+=($!)
log_success "Frontend started (PID: ${PIDS[-1]})"
echo ""

# ═══════════════════════════════════════════════════════════════
# 10. HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

log "Running health checks..."
sleep 10
echo ""

check_health() {
    local url=$1
    local name=$2
    
    if curl -sf "$url" > /dev/null 2>&1; then
        log_success "$name is healthy"
        return 0
    else
        log_error "$name health check failed"
        return 1
    fi
}

check_health "http://localhost:$GOLANG_V1_PORT/health" "Golang v1"
check_health "http://localhost:$GOLANG_V2_PORT/health" "Golang v2"
check_health "http://localhost:$NESTJS_PORT/health" "NestJS"
check_health "http://localhost:$FASTIFY_PORT/health" "Fastify"
check_health "http://localhost:$EXPRESS_PORT/health" "Express"
check_health "http://localhost:$FRONTEND_PORT" "Frontend"

echo ""

# ═══════════════════════════════════════════════════════════════
# 11. DISPLAY STATUS
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}${BOLD}🎉 PRODUCTION PLATFORM STARTED SUCCESSFULLY!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}🌐 FRONTEND:${NC}"
echo "   http://localhost:$FRONTEND_PORT"
echo ""
echo -e "${CYAN}📡 BACKEND APIs:${NC}"
echo "   Golang v1:  http://localhost:$GOLANG_V1_PORT"
echo "   Golang v2:  http://localhost:$GOLANG_V2_PORT"
echo "   NestJS:     http://localhost:$NESTJS_PORT"
echo "   Fastify:    http://localhost:$FASTIFY_PORT"
echo "   Express:    http://localhost:$EXPRESS_PORT"
echo ""
echo -e "${CYAN}🔧 INFRASTRUCTURE:${NC}"
echo "   Kafka UI:       http://localhost:8080"
echo "   MinIO Console:  http://localhost:9001 (minio/minio123_change_in_production)"
echo "   pgAdmin:        http://localhost:5050 (admin@yeelo.com/admin_password_change)"
echo "   PostgreSQL:     localhost:5433"
echo "   Redis:          localhost:6380"
echo "   Kafka:          localhost:9092"
echo ""
echo -e "${CYAN}📝 LOGS:${NC}"
echo "   Infrastructure: docker-compose -f docker-compose.production.yml logs -f"
echo "   Application:    tail -f $LOG_DIR/*.log"
echo ""
echo -e "${CYAN}🛑 STOP:${NC}"
echo "   Press Ctrl+C to stop all services"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Store PIDs
echo "${PIDS[@]}" > /tmp/yeelo-production-pids.txt

# ═══════════════════════════════════════════════════════════════
# 12. CLEANUP HANDLER
# ═══════════════════════════════════════════════════════════════

cleanup() {
    echo ""
    log "Stopping all services..."
    
    # Kill application processes
    if [ -f /tmp/yeelo-production-pids.txt ]; then
        for pid in $(cat /tmp/yeelo-production-pids.txt); do
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
            fi
        done
        rm /tmp/yeelo-production-pids.txt
    fi
    
    # Stop Docker containers
    log "Stopping infrastructure..."
    docker-compose -f docker-compose.production.yml down
    
    log_success "All services stopped"
    exit 0
}

trap cleanup INT TERM EXIT

# ═══════════════════════════════════════════════════════════════
# 13. KEEP RUNNING
# ═══════════════════════════════════════════════════════════════

log "✨ All services running! Monitoring..."
echo ""

# Monitor services
while true; do
    sleep 10
    
    # Check if all PIDs are still running
    for pid in "${PIDS[@]}"; do
        if ! ps -p $pid > /dev/null 2>&1; then
            log_error "Process $pid died unexpectedly!"
            log_error "Check logs in $LOG_DIR"
        fi
    done
done

wait
