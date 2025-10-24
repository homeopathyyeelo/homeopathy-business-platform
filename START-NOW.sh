#!/bin/bash

echo "=============================================="
echo "  HomeoERP - Quick Start"
echo "=============================================="
echo ""

# Check if Next.js is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ Next.js is already running on port 3000"
else
    echo "✗ Next.js is NOT running"
    echo "  Start it with: npm run dev (in another terminal)"
    echo ""
fi

# Start Backend
echo "Starting API Golang v2 (port 3005)..."
echo ""

cd services/api-golang-v2/cmd

# Set environment
export PORT=3005
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy?sslmode=disable}"

# Kill existing process if any
pid=$(lsof -ti:3005 2>/dev/null)
if [ ! -z "$pid" ]; then
    echo "Killing existing process on port 3005 (PID: $pid)"
    kill -9 $pid 2>/dev/null
    sleep 1
fi

# Start service in background
echo "Starting Go API v2..."
nohup go run main.go > ../../../logs/api-golang-v2.log 2>&1 &
GO_PID=$!

cd ../../..

echo "Waiting for service to start..."
sleep 5

# Check if service is up
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/health 2>/dev/null)

if [ "$response" = "200" ]; then
    echo ""
    echo "=============================================="
    echo "  ✓ SUCCESS - Backend Started!"
    echo "=============================================="
    echo ""
    echo "Backend API: http://localhost:3005 (PID: $GO_PID)"
    echo "Health: http://localhost:3005/health"
    echo ""
    echo "View logs: tail -f logs/api-golang-v2.log"
    echo "Stop: kill $GO_PID"
    echo ""
    echo "Now open browser: http://localhost:3000/dashboard"
    echo ""
else
    echo ""
    echo "=============================================="
    echo "  ✗ FAILED - Service didn't start"
    echo "=============================================="
    echo ""
    echo "Check logs: cat logs/api-golang-v2.log"
    echo "Try manual start: cd services/api-golang-v2/cmd && go run main.go"
    echo ""
fi
