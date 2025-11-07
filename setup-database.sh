#!/bin/bash

# ============================================================================
# Database Setup Script - Professional Authentication
# Creates schema and super admin user with bcrypt password hashing
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Database Setup - Professional Authentication             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}[1/4]${NC} Checking PostgreSQL connection..."
if ! docker exec homeopathy-business-platform-postgres-1 psql -U postgres -d yeelo_homeopathy -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo -e "${YELLOW}Start services first: ./start-fresh.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Apply schema
echo -e "${YELLOW}[2/4]${NC} Applying database schema..."
docker exec -i homeopathy-business-platform-postgres-1 psql -U postgres -d yeelo_homeopathy < database/MASTER_SCHEMA.sql > /dev/null 2>&1
echo -e "${GREEN}✓ Schema applied${NC}"
echo ""

# Run Go setup script to create super admin with hashed password
echo -e "${YELLOW}[3/4]${NC} Creating super admin user..."
cd services/api-golang-master
go run scripts/setup-db.go
cd ../..
echo ""

# Verify user creation
echo -e "${YELLOW}[4/4]${NC} Verifying user creation..."
USER_COUNT=$(docker exec homeopathy-business-platform-postgres-1 psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM users WHERE email='medicine@yeelohomeopathy.com';" | tr -d ' ')
if [ "$USER_COUNT" = "1" ]; then
    echo -e "${GREEN}✓ Super admin user verified${NC}"
else
    echo -e "${RED}✗ User creation failed${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Database Setup Complete!                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📝 Super Admin Credentials:${NC}"
echo -e "  ${BLUE}•${NC} Email:    ${YELLOW}medicine@yeelohomeopathy.com${NC}"
echo -e "  ${BLUE}•${NC} Password: ${YELLOW}Medicine@2024${NC}"
echo -e "  ${BLUE}•${NC} Role:     ${YELLOW}SUPERADMIN${NC}"
echo ""

echo -e "${YELLOW}🔄 Next step: Restart backend${NC}"
echo -e "   ${BLUE}pkill -f api-golang && cd services/api-golang-master && nohup ./api-golang > ../../logs/backend.log 2>&1 &${NC}"
echo ""
