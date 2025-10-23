#!/bin/bash

echo "======================================"
echo "HomeoERP Authentication & RBAC Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Database Migration
echo -e "${YELLOW}Step 1: Running database migration...${NC}"
if psql -U postgres -d homeoerp < database/migrations/001_auth_rbac_schema.sql 2>/dev/null; then
    echo -e "${GREEN}✅ Database schema created${NC}"
else
    echo -e "${RED}❌ Database migration failed. Make sure PostgreSQL is running.${NC}"
    echo "   Run: sudo systemctl start postgresql"
    exit 1
fi

# Step 2: Verify tables
echo ""
echo -e "${YELLOW}Step 2: Verifying database tables...${NC}"
TABLE_COUNT=$(psql -U postgres -d homeoerp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'user_permissions', 'user_sessions');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -eq "7" ]; then
    echo -e "${GREEN}✅ All 7 tables created${NC}"
else
    echo -e "${RED}❌ Expected 7 tables, found $TABLE_COUNT${NC}"
fi

# Step 3: Check default user
echo ""
echo -e "${YELLOW}Step 3: Checking default super admin...${NC}"
USER_EXISTS=$(psql -U postgres -d homeoerp -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@homeoerp.com';" 2>/dev/null | tr -d ' ')

if [ "$USER_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✅ Super admin user created${NC}"
    echo "   Email: admin@homeoerp.com"
    echo "   Password: Admin@123 (CHANGE THIS!)"
else
    echo -e "${RED}❌ Super admin user not found${NC}"
fi

# Step 4: Check roles
echo ""
echo -e "${YELLOW}Step 4: Checking default roles...${NC}"
ROLE_COUNT=$(psql -U postgres -d homeoerp -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ')
echo -e "${GREEN}✅ $ROLE_COUNT roles created${NC}"

# Step 5: Check permissions
echo ""
echo -e "${YELLOW}Step 5: Checking permissions...${NC}"
PERM_COUNT=$(psql -U postgres -d homeoerp -t -c "SELECT COUNT(*) FROM permissions;" 2>/dev/null | tr -d ' ')
echo -e "${GREEN}✅ $PERM_COUNT permissions created${NC}"

# Step 6: User service setup
echo ""
echo -e "${YELLOW}Step 6: Setting up user service...${NC}"
cd services/user-service 2>/dev/null || mkdir -p services/user-service && cd services/user-service

if [ ! -f "go.mod" ]; then
    echo "Initializing Go module..."
    go mod init user-service
    go get github.com/gofiber/fiber/v2
    go get github.com/lib/pq
    go get github.com/golang-jwt/jwt/v5
    go get golang.org/x/crypto/bcrypt
    go get github.com/joho/godotenv
    echo -e "${GREEN}✅ Go dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Go module already initialized${NC}"
fi

# Create .env file
if [ ! -f ".env" ]; then
    cat > .env << EOF
PORT=8004
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=homeoerp
JWT_SECRET=$(openssl rand -base64 32)
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

cd ../..

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start user service:"
echo "   cd services/user-service && go run *.go"
echo ""
echo "2. Start Next.js frontend:"
echo "   npx next dev -p 3000"
echo ""
echo "3. Test login:"
echo "   Email: admin@homeoerp.com"
echo "   Password: Admin@123"
echo ""
echo "4. IMPORTANT: Change default admin password!"
echo ""
echo "Documentation: COMPLETE-AUTH-RBAC-SYSTEM.md"
echo "======================================"
