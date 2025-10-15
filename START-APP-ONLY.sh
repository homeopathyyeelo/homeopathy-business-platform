#!/bin/bash

echo "🚀 Starting Next.js Application ONLY (No Microservices)"
echo "========================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Start PostgreSQL
echo -e "${YELLOW}1. Starting PostgreSQL...${NC}"
docker start yeelo-postgres 2>/dev/null || docker run -d \
    --name yeelo-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5433:5432 \
    postgres:15

echo -e "${GREEN}✅ PostgreSQL started${NC}"
sleep 2

# 2. Create database if not exists
docker exec yeelo-postgres psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;" 2>/dev/null || true

# 3. Create .env.local
cat > .env.local << 'EOF'
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DATABASE=yeelo_homeopathy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

DB_HOST=localhost
DB_PORT=5433
DB_NAME=yeelo_homeopathy
DB_USER=postgres
DB_PASSWORD=postgres

NEXT_PUBLIC_API_URL=http://localhost:3000
SESSION_SECRET=yeelo-secret
NODE_ENV=development
EOF

echo -e "${GREEN}✅ Environment configured${NC}"

# 4. Start ONLY Next.js
echo -e "${YELLOW}Starting Next.js application...${NC}"
echo ""
echo -e "${GREEN}======================================"
echo "✅ Ready on http://localhost:3000"
echo "======================================"
echo ""
echo "📊 Test these pages:"
echo "   http://localhost:3000/dashboard"
echo "   http://localhost:3000/master"
echo "   http://localhost:3000/sales"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo -e "${NC}"

cd /var/www/homeopathy-business-platform
npm run dev:app
