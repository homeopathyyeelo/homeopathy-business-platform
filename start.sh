#\!/bin/bash

# Homeopathy Business Platform - Startup Script
# Usage: ./start.sh [--fresh]
# --fresh: Do a complete clean rebuild (removes node_modules, .next, rebuilds Go backend)

# Check for fresh install flag
FRESH_INSTALL=false
if [ "$1" == "--fresh" ] || [ "$1" == "-f" ]; then
    FRESH_INSTALL=true
    echo "🔄 FRESH INSTALL MODE - Will rebuild everything from scratch"
fi

echo "🚀 Starting Homeopathy Business Platform..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for required system dependencies
echo "🔍 Checking system dependencies..."
if \! dpkg -l | grep -q libpq-dev; then
    echo "❌ libpq-dev not found. Please install it:"
    echo "   sudo apt-get install -y libpq-dev build-essential"
    echo "⚠️  Continuing anyway (may fail if not installed)..."
fi

# Kill existing processes
echo -e "${YELLOW}�� Stopping existing servers...${NC}"
pkill -9 backend-server 2>/dev/null
pkill -9 node 2>/dev/null
sleep 2

# Create logs directory
mkdir -p logs

# Fresh install mode - clean everything
if [ "$FRESH_INSTALL" = true ]; then
  echo ""
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  🧹 FRESH INSTALL - CLEANING ALL BUILD ARTIFACTS     ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Remove Node.js artifacts
  echo -e "${BLUE}📦 Cleaning Node.js artifacts...${NC}"
  if [ -d "node_modules" ]; then
    echo "  → Removing node_modules..."
    rm -rf node_modules
  fi
  
  if [ -d ".next" ]; then
    echo "  → Removing .next folder..."
    rm -rf .next
  fi
  
  if [ -f "package-lock.json" ]; then
    echo "  → Removing package-lock.json..."
    rm -f package-lock.json
  fi
  
  echo "  → Cleaning npm cache..."
  npm cache clean --force 2>&1 | grep -v "npm warn"
  
  # Rebuild Go backend
  echo ""
  echo -e "${BLUE}🔧 Rebuilding Go backend...${NC}"
  cd /var/www/homeopathy-business-platform/services/api-golang-master
  
  # Clean Go build cache
  echo "  → Cleaning Go caches..."
  go clean -cache -modcache -i -r 2>/dev/null || true
  
  # Download dependencies
  echo "  → Running go mod download..."
  go mod download
  
  # Rebuild backend
  echo "  → Building backend binary..."
  go build -o ../../backend-server cmd/api/main.go
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ Backend compiled successfully${NC}"
  else
    echo -e "${RED}  ❌ Backend compilation failed${NC}"
    exit 1
  fi
  
  cd /var/www/homeopathy-business-platform
  
  echo ""
  echo -e "${GREEN}✅ Clean complete\! Now installing fresh dependencies...${NC}"
  echo ""
fi

# Check if node_modules exists or fresh install
if [ \! -d "node_modules" ] || [ "$FRESH_INSTALL" = true ]; then
  echo "📦 Installing npm dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed. Please install libpq-dev:${NC}"
    echo "   sudo apt-get install -y libpq-dev build-essential"
    exit 1
  fi
  echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
  echo "✅ Dependencies already installed"
fi

# Always clean .next folder for fresh Next.js build
if [ -d ".next" ]; then
  echo "🧹 Cleaning .next folder for fresh build..."
  rm -rf .next
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 STARTING SERVICES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Start Backend
echo -e "${BLUE}📦 Starting Backend (Golang API)...${NC}"
cd /var/www/homeopathy-business-platform
./backend-server > logs/backend.log 2>&1 &
BACKEND_PID=$\!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo "   API: http://localhost:3005"

# Wait for backend to be ready
sleep 4

# Check backend health
BACKEND_STATUS=$(curl -s http://localhost:3005/health | grep -o "healthy" || echo "failed")
if [ "$BACKEND_STATUS" == "healthy" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
fi

echo ""

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend (Next.js)...${NC}"
cd /var/www/homeopathy-business-platform
npx next dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$\!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: logs/frontend.log"
echo "   App: http://localhost:3000"

# Wait for frontend to be ready
sleep 6

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All services started successfully\!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📌 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3005"
echo "   Health:    http://localhost:3005/health"
echo ""
echo "📌 Import Products:"
echo "   http://localhost:3000/products/import-export"
echo ""
echo "📋 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -9 backend-server && pkill -9 node"
echo ""
echo "💡 Tips:"
echo "   Fresh rebuild: ./start.sh --fresh"
echo "   Normal start:  ./start.sh"
echo ""
