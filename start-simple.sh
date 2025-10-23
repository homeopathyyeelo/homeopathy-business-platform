#!/bin/bash

# ============================================================================
# Yeelo Homeopathy ERP - Simple Startup (Uses System Services)
# Uses existing PostgreSQL, Redis on system + starts microservices + frontend
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
error() { echo -e "${RED}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     🏥 Yeelo Homeopathy ERP - Simple Startup 🏥          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Check if system services are running
log "🔍 Checking system services..."

if sudo systemctl is-active --quiet postgresql; then
    log "✅ PostgreSQL is running (system service)"
else
    warn "⚠️  PostgreSQL not running. Starting..."
    sudo systemctl start postgresql
fi

if sudo systemctl is-active --quiet redis-server; then
    log "✅ Redis is running (system service)"
else
    warn "⚠️  Redis not running. Starting..."
    sudo systemctl start redis-server
fi

echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log "📦 Installing dependencies..."
    npm install
else
    log "✅ Dependencies already installed"
fi

echo ""

# Start microservices
log "🚀 Starting microservices..."

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    
    if [ -d "$dir" ]; then
        info "Starting $name on port $port..."
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
        
        log "✅ $name started (PID: $pid)"
    else
        warn "⚠️  $name directory not found: $dir"
    fi
}

# Start Go services (if Go is available)
if command -v go &> /dev/null; then
    if [ -d "services/product-service" ]; then
        start_service "product-service" "services/product-service" "go run main.go" "8001"
    fi
    if [ -d "services/inventory-service" ]; then
        start_service "inventory-service" "services/inventory-service" "go run main.go" "8002"
    fi
    if [ -d "services/sales-service" ]; then
        start_service "sales-service" "services/sales-service" "go run main.go" "8003"
    fi
fi

# Start NestJS API Gateway
if [ -d "services/api-gateway" ]; then
    start_service "api-gateway" "services/api-gateway" "npm run start:dev" "4000"
fi

# Start Python AI Service (if Python is available)
if command -v python3 &> /dev/null && [ -d "services/ai-service" ]; then
    info "Starting AI service..."
    cd services/ai-service
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt --quiet 2>/dev/null || true
    else
        source venv/bin/activate
    fi
    uvicorn main:app --host 0.0.0.0 --port 8010 > ../../logs/ai-service.log 2>&1 &
    echo $! > ../../logs/ai-service.pid
    cd - > /dev/null
    log "✅ AI service started (PID: $(cat logs/ai-service.pid))"
fi

# Wait for services to initialize
log "⏳ Waiting for services to initialize..."
sleep 3

echo ""

# Start Frontend
log "🌐 Starting Next.js frontend..."

# Clean Next.js cache
rm -rf .next 2>/dev/null || true

# Start frontend
npm run dev:app > logs/frontend.log 2>&1 &
echo $! > logs/frontend.pid
log "✅ Frontend started (PID: $(cat logs/frontend.pid))"

echo ""

# Wait a bit for frontend to start
sleep 5

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  🎉  All Services Started Successfully!                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📦 INFRASTRUCTURE (System Services):${NC}"
log "🐘 PostgreSQL:       localhost:5432 (system)"
log "🔴 Redis:            localhost:6379 (system)"
echo ""

echo -e "${CYAN}🔧 MICROSERVICES:${NC}"
if command -v go &> /dev/null; then
    log "📦 Product Service:  http://localhost:8001"
    log "📦 Inventory Service: http://localhost:8002"
    log "🛒 Sales Service:    http://localhost:8003"
fi
log "🌐 API Gateway:      http://localhost:4000"
if command -v python3 &> /dev/null; then
    log "🤖 AI Service:       http://localhost:8010"
fi
echo ""

echo -e "${CYAN}🖥️  FRONTEND:${NC}"
log "💻 Next.js App:      http://localhost:3000"
log "⚙️  Layout Settings:  http://localhost:3000/app/settings/layout"
echo ""

echo -e "${CYAN}📋 MANAGEMENT:${NC}"
log "📊 Logs:             ./logs/"
log "🛑 Stop All:         ./stop-simple.sh"
echo ""

echo -e "${CYAN}💡 TIPS:${NC}"
warn "• Monitor logs:      tail -f logs/frontend.log"
warn "• Check services:    ps aux | grep -E '(node|go|python)'"
warn "• View API logs:     tail -f logs/api-gateway.log"
echo ""

# Save service info
cat > logs/services.json << EOF
{
  "started_at": "$(date -Iseconds)",
  "infrastructure": {
    "postgres": { "port": 5432, "type": "system" },
    "redis": { "port": 6379, "type": "system" }
  },
  "microservices": {
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
      "pid": $(cat logs/ai-service.pid 2>/dev/null || echo "null"),
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
