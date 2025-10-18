#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# YEELO HOMEOPATHY PLATFORM - COMPLETE STARTUP SCRIPT (IMPROVED)
# ═══════════════════════════════════════════════════════════════
# Starts all backend services and frontend for development
# 
# Services Started:
# - Golang API v1 (Gin) - Port 8080
# - Golang API v2 (Gin) - Port 3005  
# - NestJS API - Port 3001
# - Fastify API - Port 3002
# - Express API - Port 3004
# - Next.js Frontend - Port 3000
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Log file
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
MAIN_LOG="$LOG_DIR/startup.log"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Logging functions
log() {
    echo -e "${CYAN}[$(timestamp)]${NC} $1" | tee -a "$MAIN_LOG"
}

log_success() {
    echo -e "${GREEN}[$(timestamp)] ✅ $1${NC}" | tee -a "$MAIN_LOG"
}

log_error() {
    echo -e "${RED}[$(timestamp)] ❌ $1${NC}" | tee -a "$MAIN_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(timestamp)] ⚠️  $1${NC}" | tee -a "$MAIN_LOG"
}

# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════

export NODE_ENV=development
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

log "🚀 Starting Yeelo Homeopathy Platform..."
echo ""

# ═══════════════════════════════════════════════════════════════
# CLEANUP EXISTING PROCESSES
# ═══════════════════════════════════════════════════════════════

cleanup_processes() {
    log "🧹 Cleaning up existing processes..."
    
    # Kill processes by port
    for port in 3000 3001 3002 3004 3005 8080; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            log_warning "Killing process on port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # Kill by process name
    pkill -f "go run" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    # Clean old log files
    rm -f "$LOG_DIR"/*.log 2>/dev/null || true
    
    sleep 2
    log_success "Cleanup complete"
}

# ═══════════════════════════════════════════════════════════════
# WAIT FOR SERVICE
# ═══════════════════════════════════════════════════════════════

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    log "⏳ Waiting for $name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log_warning "$name not ready yet (attempt $attempt/$max_attempts)..."
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$name failed to start after $max_attempts attempts"
    log_error "Check logs at: $LOG_DIR/${name,,}-api.log"
    return 1
}

# ═══════════════════════════════════════════════════════════════
# CHECK PREREQUISITES
# ═══════════════════════════════════════════════════════════════

check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
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
    log_success "Go: $(go version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm: $(npm --version)"
    
    # Check PostgreSQL connection
    if ! pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
        log_warning "PostgreSQL is not running on port 5433"
        log_warning "Run: docker-compose up -d postgres"
    else
        log_success "PostgreSQL is running"
    fi
    
    echo ""
}

# ═══════════════════════════════════════════════════════════════
# START SERVICES
# ═══════════════════════════════════════════════════════════════

# Store PIDs
declare -a PIDS=()

start_golang_v1() {
    local service_dir="$SCRIPT_DIR/services/api-golang"
    local log_file="$LOG_DIR/golang-v1.log"
    
    log "🔧 Starting Golang API v1 (Gin framework) on port $GOLANG_V1_PORT..."
    
    if [ ! -f "$service_dir/main.go" ]; then
        log_error "Golang v1 main.go not found at $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    export SERVER_PORT=$GOLANG_V1_PORT
    export PORT=$GOLANG_V1_PORT
    
    go run main.go > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    cd "$SCRIPT_DIR"
    log_success "Golang v1 started (PID: $pid)"
    sleep 3
}

start_golang_v2() {
    local service_dir="$SCRIPT_DIR/services/api-golang-v2"
    local log_file="$LOG_DIR/golang-v2.log"
    
    log "🔧 Starting Golang API v2 (Gin framework) on port $GOLANG_V2_PORT..."
    
    if [ ! -f "$service_dir/cmd/main.go" ]; then
        log_error "Golang v2 main.go not found at $service_dir/cmd/"
        return 1
    fi
    
    cd "$service_dir"
    export PORT=$GOLANG_V2_PORT
    
    go run cmd/main.go > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    cd "$SCRIPT_DIR"
    log_success "Golang v2 started (PID: $pid)"
    sleep 3
}

start_nestjs() {
    local service_dir="$SCRIPT_DIR/services/api-nest"
    local log_file="$LOG_DIR/nestjs.log"
    
    log "🏗️  Starting NestJS API on port $NESTJS_PORT..."
    
    if [ ! -d "$service_dir" ]; then
        log_error "NestJS service not found at $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "📦 Installing NestJS dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    export PORT=$NESTJS_PORT
    npm run start:dev > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    cd "$SCRIPT_DIR"
    log_success "NestJS started (PID: $pid)"
    sleep 3
}

start_fastify() {
    local service_dir="$SCRIPT_DIR/services/api-fastify"
    local log_file="$LOG_DIR/fastify.log"
    
    log "⚡ Starting Fastify API on port $FASTIFY_PORT..."
    
    if [ ! -d "$service_dir" ]; then
        log_error "Fastify service not found at $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "📦 Installing Fastify dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    export PORT=$FASTIFY_PORT
    npm run dev > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    cd "$SCRIPT_DIR"
    log_success "Fastify started (PID: $pid)"
    sleep 3
}

start_express() {
    local service_dir="$SCRIPT_DIR/services/api-express"
    local log_file="$LOG_DIR/express.log"
    
    log "⚡ Starting Express API on port $EXPRESS_PORT..."
    
    if [ ! -d "$service_dir" ]; then
        log_error "Express service not found at $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "📦 Installing Express dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    export PORT=$EXPRESS_PORT
    npm run dev > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    cd "$SCRIPT_DIR"
    log_success "Express started (PID: $pid)"
    sleep 3
}

start_frontend() {
    local log_file="$LOG_DIR/frontend.log"
    
    log "🎨 Starting Next.js Frontend on port $FRONTEND_PORT..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "📦 Installing Frontend dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    export PORT=$FRONTEND_PORT
    npm run dev > "$log_file" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    
    log_success "Frontend started (PID: $pid)"
    sleep 5
}

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

check_health() {
    log "🏥 Running health checks..."
    echo ""
    
    local all_healthy=true
    
    # Golang v1
    if wait_for_service "http://localhost:$GOLANG_V1_PORT/health" "Golang v1"; then
        :
    else
        all_healthy=false
    fi
    
    # Golang v2
    if wait_for_service "http://localhost:$GOLANG_V2_PORT/health" "Golang v2"; then
        :
    else
        all_healthy=false
    fi
    
    # NestJS
    if wait_for_service "http://localhost:$NESTJS_PORT/health" "NestJS"; then
        :
    else
        all_healthy=false
    fi
    
    # Fastify
    if wait_for_service "http://localhost:$FASTIFY_PORT/health" "Fastify"; then
        :
    else
        all_healthy=false
    fi
    
    # Express
    if wait_for_service "http://localhost:$EXPRESS_PORT/health" "Express"; then
        :
    else
        all_healthy=false
    fi
    
    # Frontend
    if wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend"; then
        :
    else
        all_healthy=false
    fi
    
    echo ""
    
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
    else
        log_warning "Some services failed health checks - check logs"
    fi
}

# ═══════════════════════════════════════════════════════════════
# DISPLAY STATUS
# ═══════════════════════════════════════════════════════════════

display_status() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${GREEN}🎉 YEELO HOMEOPATHY PLATFORM - ALL SERVICES RUNNING${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${CYAN}🌐 FRONTEND:${NC}"
    echo "   http://localhost:$FRONTEND_PORT"
    echo ""
    echo -e "${CYAN}📡 BACKEND APIs:${NC}"
    echo ""
    echo -e "   ${BLUE}Golang v1 (Gin):${NC}     http://localhost:$GOLANG_V1_PORT"
    echo "      Health:              http://localhost:$GOLANG_V1_PORT/health"
    echo "      Features:            Main ERP, Sales, Inventory, Finance"
    echo ""
    echo -e "   ${BLUE}Golang v2 (Gin):${NC}     http://localhost:$GOLANG_V2_PORT"
    echo "      Health:              http://localhost:$GOLANG_V2_PORT/health"
    echo "      Products:            http://localhost:$GOLANG_V2_PORT/api/products"
    echo "      Sales:               http://localhost:$GOLANG_V2_PORT/api/sales"
    echo ""
    echo -e "   ${BLUE}NestJS:${NC}              http://localhost:$NESTJS_PORT"
    echo "      Health:              http://localhost:$NESTJS_PORT/health"
    echo "      Purchases:           http://localhost:$NESTJS_PORT/purchase/*"
    echo ""
    echo -e "   ${BLUE}Fastify:${NC}             http://localhost:$FASTIFY_PORT"
    echo "      Health:              http://localhost:$FASTIFY_PORT/health"
    echo "      Campaigns:           http://localhost:$FASTIFY_PORT/api/campaigns"
    echo ""
    echo -e "   ${BLUE}Express:${NC}             http://localhost:$EXPRESS_PORT"
    echo "      Health:              http://localhost:$EXPRESS_PORT/health"
    echo "      Orders:              http://localhost:$EXPRESS_PORT/api/orders"
    echo ""
    echo -e "${CYAN}📝 LOGS:${NC}"
    echo "   Golang v1:              tail -f $LOG_DIR/golang-v1.log"
    echo "   Golang v2:              tail -f $LOG_DIR/golang-v2.log"
    echo "   NestJS:                 tail -f $LOG_DIR/nestjs.log"
    echo "   Fastify:                tail -f $LOG_DIR/fastify.log"
    echo "   Express:                tail -f $LOG_DIR/express.log"
    echo "   Frontend:               tail -f $LOG_DIR/frontend.log"
    echo ""
    echo -e "${CYAN}🔧 COMMANDS:${NC}"
    echo "   View all logs:          tail -f $LOG_DIR/*.log"
    echo "   Stop all services:      Press Ctrl+C"
    echo "   Restart services:       ./START-EVERYTHING-IMPROVED.sh"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# ═══════════════════════════════════════════════════════════════
# CLEANUP ON EXIT
# ═══════════════════════════════════════════════════════════════

cleanup() {
    echo ""
    log "🛑 Stopping all services..."
    
    # Kill all PIDs
    for pid in "${PIDS[@]}"; do
        if ps -p $pid > /dev/null 2>&1; then
            log "Killing PID $pid..."
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # Kill by port as backup
    for port in $FRONTEND_PORT $GOLANG_V1_PORT $GOLANG_V2_PORT $NESTJS_PORT $FASTIFY_PORT $EXPRESS_PORT; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    log_success "All services stopped"
    exit 0
}

trap cleanup INT TERM EXIT

# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

main() {
    # Check prerequisites
    check_prerequisites
    
    # Cleanup existing
    cleanup_processes
    
    echo ""
    log "🚀 Starting all services..."
    echo ""
    
    # Start backend services
    start_golang_v1 || log_error "Failed to start Golang v1"
    start_golang_v2 || log_error "Failed to start Golang v2"
    start_nestjs || log_error "Failed to start NestJS"
    start_fastify || log_error "Failed to start Fastify"
    start_express || log_error "Failed to start Express"
    
    # Start frontend
    start_frontend || log_error "Failed to start Frontend"
    
    echo ""
    
    # Health checks
    check_health
    
    # Display status
    display_status
    
    # Keep running
    log "✨ All services running! Press Ctrl+C to stop."
    echo ""
    
    # Wait indefinitely
    wait
}

# Run main
main

