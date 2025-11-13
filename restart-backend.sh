#\!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔄 GOLANG BACKEND RESTART SCRIPT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}1️⃣  Stopping existing backend processes...${NC}"
pkill -9 backend-server 2>/dev/null
pkill -9 main 2>/dev/null
sleep 1

echo -e "${YELLOW}2️⃣  Clearing port 3005...${NC}"
lsof -ti:3005 | xargs kill -9 2>/dev/null
echo -e "${GREEN}   ✅ Port 3005 cleared${NC}"

cd /var/www/homeopathy-business-platform
echo -e "${GREEN}   ✅ Changed to project directory${NC}"

echo -e "${YELLOW}3️⃣  Cleaning Go build cache...${NC}"
cd services/api-golang-master
go clean -cache 2>/dev/null
echo -e "${GREEN}   ✅ Go cache cleaned${NC}"

echo -e "${YELLOW}4️⃣  Installing Go modules...${NC}"
go mod download
go mod tidy
echo -e "${GREEN}   ✅ Go modules ready${NC}"

echo -e "${YELLOW}5️⃣  Building backend binary...${NC}"
cd /var/www/homeopathy-business-platform
rm -f backend-server 2>/dev/null

cd services/api-golang-master
go build -o ../../backend-server cmd/api/main.go

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Build successful${NC}"
else
    echo -e "${RED}   ❌ Build failed\!${NC}"
    exit 1
fi

cd /var/www/homeopathy-business-platform
mkdir -p logs

echo -e "${YELLOW}6️⃣  Starting backend server...${NC}"
./backend-server > logs/backend.log 2>&1 &
BACKEND_PID=$\!
echo -e "${GREEN}   ✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "      Logs: logs/backend.log"
echo "      API: http://localhost:3005"

echo -e "${YELLOW}7️⃣  Verifying server health...${NC}"
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    HEALTH_CHECK=$(curl -s http://localhost:3005/health 2>/dev/null)
    if echo "$HEALTH_CHECK" | grep -q "healthy"; then
        echo -e "${GREEN}   ✅ Server is healthy${NC}"
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ BACKEND SERVER READY\!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo ""
        echo "API: http://localhost:3005"
        echo "Health: http://localhost:3005/health"
        echo ""
        echo "Commands:"
        echo "  View logs: tail -f logs/backend.log"
        echo "  Stop: pkill -9 backend-server"
        echo ""
    else
        echo -e "${RED}   ❌ Health check failed${NC}"
        tail -20 logs/backend.log
        exit 1
    fi
else
    echo -e "${RED}   ❌ Process died\!${NC}"
    tail -30 logs/backend.log
    exit 1
fi
