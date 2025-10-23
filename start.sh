#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Production Startup Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')]${NC} $1"; }

# ============================================================================
# Configuration
# ============================================================================

FRONTEND_PORT=3000
GOLANG_API_PORT=3004
NESTJS_API_PORT=3001
FASTIFY_API_PORT=3002
EXPRESS_API_PORT=3003

# ============================================================================
# Pre-flight Checks
# ============================================================================

log "🚀 Starting Yeelo Homeopathy ERP Platform..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
log "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    error "❌ npm not found"
    exit 1
fi
log "✅ npm $(npm --version) detected"

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        warn "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# ============================================================================
# Environment Setup
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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homeopathy_erp"

# API URLs
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:3004
NEXT_PUBLIC_NESTJS_API_URL=http://localhost:3001
NEXT_PUBLIC_FASTIFY_API_URL=http://localhost:3002
NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:3003
NEXT_PUBLIC_PYTHON_AI_URL=http://localhost:8001

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI (optional)
OPENAI_API_KEY=

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Suppress Kafka warnings
KAFKAJS_NO_PARTITIONER_WARNING=1
EOF
        log "✅ Created default .env file"
    fi
fi

# ============================================================================
# Install Dependencies
# ============================================================================

if [ ! -d "node_modules" ]; then
    log "📦 Installing dependencies..."
    npm install
else
    log "✅ Dependencies already installed"
fi

# ============================================================================
# Database Setup
# ============================================================================

log "🗄️  Checking database..."

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log "✅ PostgreSQL is running"
        
        # Run migrations if Prisma is available
        if [ -d "prisma" ]; then
            log "🔄 Running database migrations..."
            npx prisma migrate deploy 2>/dev/null || warn "⚠️  Migrations skipped (run manually if needed)"
        fi
    else
        warn "⚠️  PostgreSQL not running. Database features will be limited."
    fi
else
    warn "⚠️  PostgreSQL not installed. Using mock data."
fi

# ============================================================================
# Build Application (Skip for faster startup)
# ============================================================================

log "🧹 Cleaning Next.js cache..."
rm -rf .next 2>/dev/null || true

log "⚡ Starting in development mode for faster startup..."
DEV_MODE=true

# ============================================================================
# Start Services
# ============================================================================

log "🚀 Starting services..."

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
    local name=$1
    local port=$2
    local cmd=$3
    local dir=$4
    
    if check_port $port; then
        log "▶️  Starting $name on port $port..."
        if [ -n "$dir" ] && [ -d "$dir" ]; then
            cd "$dir"
            $cmd > "../../logs/${name}.log" 2>&1 &
            cd - > /dev/null
        else
            $cmd > "logs/${name}.log" 2>&1 &
        fi
        echo $! > "logs/${name}.pid"
        log "✅ $name started (PID: $(cat logs/${name}.pid))"
    else
        warn "⚠️  Skipping $name (port $port in use)"
    fi
}

# Start Golang API if available
if [ -d "services/api-golang" ] && [ -f "services/api-golang/main.go" ]; then
    if command -v go &> /dev/null; then
        start_service "golang-api" $GOLANG_API_PORT "go run main.go" "services/api-golang"
    else
        warn "⚠️  Go not installed, skipping Golang API"
    fi
fi

# Start NestJS API if available
if [ -d "services/api-nestjs" ] && [ -f "services/api-nestjs/package.json" ]; then
    start_service "nestjs-api" $NESTJS_API_PORT "npm start" "services/api-nestjs"
fi

# Start Fastify API if available
if [ -d "services/api-fastify" ] && [ -f "services/api-fastify/package.json" ]; then
    start_service "fastify-api" $FASTIFY_API_PORT "npm start" "services/api-fastify"
fi

# Start Express API if available
if [ -d "services/api-express" ] && [ -f "services/api-express/package.json" ]; then
    start_service "express-api" $EXPRESS_API_PORT "npm start" "services/api-express"
fi

# Wait for services to start
sleep 3

# Start Next.js Frontend
log "🌐 Starting Next.js frontend..."
npm run dev:app > logs/frontend.log 2>&1 &
echo $! > logs/frontend.pid
log "✅ Frontend started (PID: $(cat logs/frontend.pid))"

# ============================================================================
# Health Checks
# ============================================================================

sleep 5

log "🔍 Running health checks..."

check_health() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        log "✅ $name is healthy"
        return 0
    else
        warn "⚠️  $name health check failed"
        return 1
    fi
}

# Check frontend
check_health "Frontend" "http://localhost:$FRONTEND_PORT"

# Check APIs (non-blocking)
check_health "Golang API" "http://localhost:$GOLANG_API_PORT/health" || true
check_health "NestJS API" "http://localhost:$NESTJS_API_PORT/health" || true
check_health "Fastify API" "http://localhost:$FASTIFY_API_PORT/health" || true

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  🎉  Yeelo Homeopathy ERP Platform Started Successfully!  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
log "📱 Frontend:     http://localhost:$FRONTEND_PORT"
log "🔧 Golang API:   http://localhost:$GOLANG_API_PORT"
log "🔧 NestJS API:   http://localhost:$NESTJS_API_PORT"
log "🔧 Fastify API:  http://localhost:$FASTIFY_API_PORT"
log "🔧 Express API:  http://localhost:$EXPRESS_API_PORT"
echo ""
log "📋 Logs:         ./logs/"
log "🛑 Stop:         ./stop.sh"
echo ""
warn "💡 Tip: Run 'tail -f logs/frontend.log' to monitor frontend logs"
echo ""

# Save running services info
cat > logs/services.json << EOF
{
  "started_at": "$(date -Iseconds)",
  "frontend": {
    "pid": $(cat logs/frontend.pid 2>/dev/null || echo "null"),
    "port": $FRONTEND_PORT,
    "url": "http://localhost:$FRONTEND_PORT"
  },
  "services": {
    "golang_api": {
      "pid": $(cat logs/golang-api.pid 2>/dev/null || echo "null"),
      "port": $GOLANG_API_PORT
    },
    "nestjs_api": {
      "pid": $(cat logs/nestjs-api.pid 2>/dev/null || echo "null"),
      "port": $NESTJS_API_PORT
    },
    "fastify_api": {
      "pid": $(cat logs/fastify-api.pid 2>/dev/null || echo "null"),
      "port": $FASTIFY_API_PORT
    }
  }
}
EOF

log "✅ Service info saved to logs/services.json"
