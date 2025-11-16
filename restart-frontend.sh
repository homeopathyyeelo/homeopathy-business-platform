#!/bin/bash

# Quick Frontend Restart Script
# Use this after making React/Next.js code changes

echo "🔄 Restarting Frontend..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kill all Node/Next.js processes
echo -e "${YELLOW}🛑 Stopping Next.js...${NC}"
pkill -9 -f 'node.*next' 2>/dev/null || true
pkill -9 -f 'next dev' 2>/dev/null || true
pkill -9 -f 'next-server' 2>/dev/null || true

# Kill by port (3 attempts)
for i in {1..3}; do
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
  if ! lsof -ti:3000 >/dev/null 2>&1; then
    break
  fi
done

# Force kill if still running
if lsof -ti:3000 >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Port 3000 stubborn, using fuser...${NC}"
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 2
fi

# Clean Next.js cache
echo -e "${BLUE}🧹 Cleaning cache...${NC}"
rm -rf .next/cache 2>/dev/null || true
rm -rf .next/trace 2>/dev/null || true
rm -f .next/server/next-server.sock 2>/dev/null || true

# Verify port is free
if lsof -ti:3000 >/dev/null 2>&1; then
  echo -e "${RED}❌ FAILED: Port 3000 still in use!${NC}"
  echo "Try: sudo lsof -ti:3000 | xargs sudo kill -9"
  exit 1
fi

echo -e "${GREEN}✓ Port 3000 is free${NC}"

# Start Next.js
echo -e "${BLUE}🎨 Starting Next.js...${NC}"
mkdir -p logs
npx next dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

# Verify started
if ps -p $FRONTEND_PID > /dev/null; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Frontend restarted successfully!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "   App: http://localhost:3000"
  echo "   PID: $FRONTEND_PID"
  echo "   Logs: tail -f logs/frontend.log"
  echo ""
  echo "To stop: kill -9 $FRONTEND_PID"
  echo ""
else
  echo -e "${RED}❌ Frontend failed to start${NC}"
  echo "Check logs: tail -30 logs/frontend.log"
  exit 1
fi
