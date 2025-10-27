#!/usr/bin/env bash
set -e
echo "🔍 Service Port Audit — $(date)"
declare -A PORTS=(
  ["api-golang"]=3004
  ["api-golang-master"]=3005
  ["purchase-service"]=8006
  ["invoice-parser"]=8005
  ["api-gateway"]=4000
)

for svc in "${!PORTS[@]}"; do
  port=${PORTS[$svc]}
  url="http://localhost:$port/health"
  echo -n "Checking $svc ($port)... "
  code=$(curl -s -o /dev/null -w "%{http_code}" $url)
  if [[ "$code" == "200" ]]; then
    echo "✅ Healthy"
  else
    echo "❌ Not Responding"
  fi
done

# HomeoERP Service Audit Script
# Checks health of all microservices and reports mismatches

echo "================================================"
echo "   HomeoERP Microservices Health Check"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service definitions
declare -A services=(
    ["Next.js Frontend"]="http://localhost:3000"
    ["API Golang v1 (Legacy)"]="http://localhost:3005/health"
    ["API Golang v2 (Primary)"]="http://localhost:3005/health"
    ["API Gateway"]="http://localhost:4000/health"
    ["Invoice Parser"]="http://localhost:8005/health"
    ["Purchase Service"]="http://localhost:8006/health"
)

# Track results
total=0
up=0
down=0

echo "Checking services..."
echo ""

# Check each service
for service in "${!services[@]}"; do
    url="${services[$service]}"
    total=$((total + 1))
    
    # Ping the service
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "000" ]; then
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✓${NC} $service (${url}) - ${GREEN}UP${NC} [HTTP $response]"
            up=$((up + 1))
        else
            echo -e "${RED}✗${NC} $service (${url}) - ${RED}DOWN${NC} [No Response]"
            down=$((down + 1))
        fi
    else
        echo -e "${YELLOW}⚠${NC} $service (${url}) - ${YELLOW}UNKNOWN${NC} [HTTP $response]"
        down=$((down + 1))
    fi
done

echo ""
echo "================================================"
echo "Summary:"
echo "  Total Services: $total"
echo -e "  ${GREEN}Up: $up${NC}"
echo -e "  ${RED}Down: $down${NC}"
echo "================================================"
echo ""

# Check environment variables
echo "Checking Frontend Environment Variables..."
echo ""

if [ -f ".env.local" ]; then
    echo "✓ .env.local exists"
    
    # Check key variables
    if grep -q "NEXT_PUBLIC_GOLANG_API_URL" .env.local; then
        golang_url=$(grep "NEXT_PUBLIC_GOLANG_API_URL" .env.local | cut -d '=' -f2)
        echo "  NEXT_PUBLIC_GOLANG_API_URL=$golang_url"
        
        if [ "$golang_url" != "http://localhost:3005" ]; then
            echo -e "  ${YELLOW}⚠ WARNING: Should be http://localhost:3005${NC}"
        fi
    else
        echo -e "  ${RED}✗ NEXT_PUBLIC_GOLANG_API_URL not set${NC}"
    fi
else
    echo -e "${RED}✗ .env.local not found${NC}"
    echo ""
    echo "Creating .env.local with recommended settings..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:3005
NEXT_PUBLIC_API_LEGACY_URL=http://localhost:3005
NEXT_PUBLIC_PURCHASE_API_URL=http://localhost:8006
NEXT_PUBLIC_INVOICE_API_URL=http://localhost:8005
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000
EOF
    echo "✓ .env.local created"
fi

echo ""
echo "================================================"
echo "Port Assignments:"
echo "================================================"
echo "  3000 - Next.js Frontend"
echo "  3004 - API Golang v1 (Legacy)"
echo "  3005 - API Golang v2 (Primary - ERP Core)"
echo "  4000 - API Gateway (Auth & Routing)"
echo "  8005 - Invoice Parser (FastAPI)"
echo "  8006 - Purchase Service (Golang)"
echo ""

# Check for port conflicts
echo "Checking for port conflicts..."
echo ""

ports=(3000 3004 3005 4000 8005 8006)
conflicts=0

for port in "${ports[@]}"; do
    # Check if port is in use
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            process=$(lsof -Pi :$port -sTCP:LISTEN -t | head -1)
            cmd=$(ps -p $process -o comm= 2>/dev/null || echo "unknown")
            echo -e "${GREEN}✓${NC} Port $port is in use by PID $process ($cmd)"
        else
            echo -e "${YELLOW}⚠${NC} Port $port is NOT in use"
            conflicts=$((conflicts + 1))
        fi
    else
        # Fallback to netstat
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "${GREEN}✓${NC} Port $port is in use"
        else
            echo -e "${YELLOW}⚠${NC} Port $port is NOT in use"
            conflicts=$((conflicts + 1))
        fi
    fi
done

echo ""
if [ $conflicts -gt 0 ]; then
    echo -e "${YELLOW}Warning: $conflicts expected ports are not in use${NC}"
    echo "Run ./start-complete.sh to start all services"
fi

echo ""
echo "================================================"
echo "API Endpoint Tests:"
echo "================================================"
echo ""

# Test key endpoints
echo "Testing Go v2 Core Endpoints..."
endpoints=(
    "http://localhost:3005/health"
    "http://localhost:3005/api/erp/dashboard/stats"
    "http://localhost:3005/api/erp/inventory"
    "http://localhost:3005/api/v1/system/bugs"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$endpoint" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $endpoint - HTTP $response"
    else
        echo -e "${RED}✗${NC} $endpoint - HTTP $response"
    fi
done

echo ""
echo "================================================"
echo "Audit Complete"
echo "================================================"

# Exit with appropriate code
if [ $down -eq 0 ]; then
    exit 0
else
    exit 1
fi
