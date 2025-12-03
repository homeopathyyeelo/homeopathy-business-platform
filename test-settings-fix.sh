#!/bin/bash

echo "=========================================="
echo "Testing Settings Pages Fix"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3005/api/erp"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaXNwbGF5TmFtZSI6IiIsImVtYWlsIjoibWVkaWNpbmVAeWVlbG9ob21lb3BhdGh5LmNvbSIsImV4cCI6MTc2NDgzMzQ1NCwiZmlyc3ROYW1lIjoiU3VwZXIiLCJpYXQiOjE3NjQ3NDcwNTQsImlzU3VwZXJBZG1pbiI6dHJ1ZSwibGFzdE5hbWUiOiJBZG1pbiIsIm5hbWUiOiIiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJ1c2VyX2lkIjoiNGM2NzJkYWUtYTFmZi00ZTNkLWI4ODEtYjZlMzgwYWM5ZTRlIn0.xXniuIPIfJPr29u_EcVzG8_0-Ialt4wPRdZf2JrUIUc"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing Users Endpoint${NC}"
echo "GET $BASE_URL/users"
curl -s -b "auth-token=$TOKEN" $BASE_URL/users | python3 -m json.tool | head -20
echo ""
echo ""

echo -e "${YELLOW}2. Testing Roles Endpoint${NC}"
echo "GET $BASE_URL/roles"
curl -s -b "auth-token=$TOKEN" $BASE_URL/roles | python3 -m json.tool | head -20
echo ""
echo ""

echo -e "${YELLOW}3. Testing Backup Config Endpoint${NC}"
echo "GET $BASE_URL/backups/config"
curl -s -b "auth-token=$TOKEN" $BASE_URL/backups/config | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}4. Testing Backup Status Endpoint${NC}"
echo "GET $BASE_URL/backups/status"
curl -s -b "auth-token=$TOKEN" $BASE_URL/backups/status | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}5. Testing Backup List Endpoint${NC}"
echo "GET $BASE_URL/backups/list"
curl -s -b "auth-token=$TOKEN" $BASE_URL/backups/list | python3 -m json.tool | head -20
echo ""
echo ""

echo -e "${YELLOW}6. Testing App Settings (Backup Category)${NC}"
echo "GET $BASE_URL/settings/category/backup"
curl -s -b "auth-token=$TOKEN" $BASE_URL/settings/category/backup | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}7. Testing App Settings (Database Category)${NC}"
echo "GET $BASE_URL/settings/category/database"
curl -s -b "auth-token=$TOKEN" $BASE_URL/settings/category/database | python3 -m json.tool
echo ""
echo ""

echo -e "${YELLOW}8. Checking Database Records${NC}"
echo "Backup settings count:"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM app_settings WHERE category = 'backup';" | tr -d ' '

echo "Database settings count:"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM app_settings WHERE category = 'database';" | tr -d ' '

echo ""
echo "All backup settings:"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "SELECT key, type, description FROM app_settings WHERE category = 'backup' ORDER BY key;"

echo ""
echo "All database settings:"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "SELECT key, type, description FROM app_settings WHERE category = 'database' ORDER BY key;"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ All Tests Complete"
echo "==========================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3000/settings"
echo "2. Click 'Users' tab - should load user list"
echo "3. Click 'Database' tab > 'Backups' - should load backup config"
echo "4. Try creating a user or updating backup settings"
echo ""
