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

# Kill existing processes - AGGRESSIVE MODE
echo -e "${YELLOW}🛑 Stopping existing servers...${NC}"

# Kill backend
pkill -9 -f backend-server 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true

# Kill frontend - multiple methods to ensure all processes die
echo "  → Killing Next.js processes..."
pkill -9 -f 'node.*next' 2>/dev/null || true
pkill -9 -f 'next dev' 2>/dev/null || true
pkill -9 -f 'next-server' 2>/dev/null || true

# Kill by port (most reliable)
for i in {1..3}; do
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
  if ! lsof -ti:3000 >/dev/null 2>&1; then
    break
  fi
done

# Final check
if lsof -ti:3000 >/dev/null 2>&1; then
  echo -e "${YELLOW}  ⚠️  Port 3000 still in use, forcing kill...${NC}"
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 2
fi

echo "  ✓ All processes stopped"
sleep 1

# Create logs directory
mkdir -p logs

# Always clean Next.js cache (even without --fresh)
echo -e "${BLUE}🧹 Cleaning Next.js cache...${NC}"
if [ -d ".next/cache" ]; then
  echo "  → Removing .next/cache..."
  rm -rf .next/cache
fi
if [ -d ".next/trace" ]; then
  echo "  → Removing .next/trace..."
  rm -rf .next/trace
fi
echo "  ✓ Cache cleaned"

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
  go build -o ../../backend-server cmd/main.go
  
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

# Start Backend using dedicated script
echo -e "${BLUE}📦 Starting Backend (Golang API)...${NC}"
cd /var/www/homeopathy-business-platform

# Kill any existing backend
pkill -9 -f backend-server 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
sleep 1

# Build and start
cd services/api-golang-master
go mod tidy 2>&1 | grep -v "warning" || true
go build -o ../../backend-server cmd/main.go
cd /var/www/homeopathy-business-platform

if [ ! -f "backend-server" ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

PORT=3005 JWT_SECRET=your-secret-key-change-in-production ./backend-server > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo "   API: http://localhost:3005"

# Wait for backend to be ready
sleep 5

# Check backend health
BACKEND_STATUS=$(curl -s http://localhost:3005/health | grep -o "healthy" || echo "failed")
if [ "$BACKEND_STATUS" == "healthy" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
fi

echo ""

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend (Next.js)...${NC}"
cd /var/www/homeopathy-business-platform

# Ensure port is free before starting
if lsof -ti:3000 >/dev/null 2>&1; then
  echo -e "${RED}❌ Port 3000 still in use! Force killing...${NC}"
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Clear any stale PID files
rm -f .next/server/next-server.sock 2>/dev/null || true

# Start Next.js
npx next dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: logs/frontend.log"
echo "   App: http://localhost:3000"
echo "   PID: $FRONTEND_PID (to kill: kill -9 $FRONTEND_PID)"

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
echo "   pkill -9 -f backend-server && pkill -9 -f 'node.*next' && lsof -ti:3000,3005 | xargs kill -9"
echo ""
echo "💡 Tips:"
echo "   Fresh rebuild: ./start.sh --fresh"
echo "   Normal start:  ./start.sh"
echo ""
