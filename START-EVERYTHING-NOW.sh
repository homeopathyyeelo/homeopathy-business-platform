#!/bin/bash

echo "🚀 Starting Yeelo Homeopathy Platform..."
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Start PostgreSQL
echo -e "${YELLOW}1. Starting PostgreSQL...${NC}"
if docker ps | grep -q yeelo-postgres; then
    echo -e "${GREEN}✅ PostgreSQL already running${NC}"
else
    docker start yeelo-postgres 2>/dev/null || docker run -d \
        --name yeelo-postgres \
        -e POSTGRES_PASSWORD=postgres \
        -p 5433:5432 \
        postgres:15
    
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
    echo "Waiting 3 seconds for PostgreSQL to initialize..."
    sleep 3
fi

# 2. Check if database exists
echo -e "${YELLOW}2. Checking database...${NC}"
DB_EXISTS=$(docker exec yeelo-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -w yeelo_homeopathy | wc -l)

if [ "$DB_EXISTS" -eq "0" ]; then
    echo "Creating yeelo_homeopathy database..."
    docker exec yeelo-postgres psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;"
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

# 3. Apply schema if tables don't exist
echo -e "${YELLOW}3. Checking database schema...${NC}"
TABLE_COUNT=$(docker exec yeelo-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')

if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" -lt "5" ]; then
    echo "Applying database schema..."
    if [ -f "COMPLETE-ERP-SCHEMA.sql" ]; then
        docker exec -i yeelo-postgres psql -U postgres -d yeelo_homeopathy < COMPLETE-ERP-SCHEMA.sql 2>/dev/null
        echo -e "${GREEN}✅ Schema applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Schema file not found, continuing...${NC}"
    fi
else
    echo -e "${GREEN}✅ Schema exists ($TABLE_COUNT tables)${NC}"
fi

# 4. Check environment file
echo -e "${YELLOW}4. Checking environment configuration...${NC}"
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
# Database Configuration
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

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Session
SESSION_SECRET=yeelo-homeopathy-secret-key-change-in-production

# Environment
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${GREEN}✅ Environment file exists${NC}"
fi

# 5. Install dependencies
echo -e "${YELLOW}5. Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies exist${NC}"
fi

# 6. Start the application
echo -e "${YELLOW}6. Starting Next.js application...${NC}"
echo ""
echo -e "${GREEN}======================================"
echo "✅ ALL SYSTEMS READY!"
echo "======================================"
echo ""
echo "🌐 Opening in browser: http://localhost:3000"
echo ""
echo "📊 Available pages:"
echo "   - Dashboard:    http://localhost:3000/dashboard"
echo "   - Master Data:  http://localhost:3000/master"
echo "   - Inventory:    http://localhost:3000/inventory"
echo "   - Sales:        http://localhost:3000/sales"
echo "   - Purchases:    http://localhost:3000/purchases"
echo "   - Customers:    http://localhost:3000/customers"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo "======================================"
echo -e "${NC}"

# Start Next.js
npm run dev
