#!/bin/bash

echo "========================================="
echo "  Starting HomeoERP Backend Services"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Kill existing processes on these ports
echo "Cleaning up existing processes..."
for port in 3004 3005 4000 8005 8006; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done
sleep 2

# Start API Golang v2 (Primary - Port 3005)
echo -e "${BLUE}Starting API Golang v2 on port 3005...${NC}"
cd services/api-golang-v2/cmd
export PORT=3005
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy?sslmode=disable"
go run main.go > ../../../logs/api-golang-v2.log 2>&1 &
API_V2_PID=$!
echo -e "${GREEN}✓ API Golang v2 started (PID: $API_V2_PID)${NC}"
cd ../../..

sleep 2

# Check if service is up
echo ""
echo "Checking service health..."
sleep 3

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/health 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ API Golang v2 is UP and responding${NC}"
else
    echo -e "${RED}✗ API Golang v2 failed to start (HTTP $response)${NC}"
    echo "Check logs at: logs/api-golang-v2.log"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Backend Services Started!${NC}"
echo "========================================="
echo ""
echo "Running Services:"
echo "  - API Golang v2: http://localhost:3005 (PID: $API_V2_PID)"
echo ""
echo "Check logs:"
echo "  tail -f logs/api-golang-v2.log"
echo ""
echo "Test health:"
echo "  curl http://localhost:3005/health"
echo ""
echo "Stop services:"
echo "  kill $API_V2_PID"
echo ""
