#!/bin/bash

echo "======================================"
echo "Testing Settings Database APIs"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3005/api/erp"

echo "1. Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/../health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    exit 1
fi
echo ""

echo "2. Testing GET /api/erp/settings (All Settings)..."
curl -s $BASE_URL/settings | python3 -m json.tool | head -30
echo ""
echo ""

echo "3. Testing GET /api/erp/settings/categories..."
curl -s $BASE_URL/settings/categories | python3 -m json.tool
echo ""
echo ""

echo "4. Testing GET /api/erp/settings/category/ai (AI Settings)..."
curl -s $BASE_URL/settings/category/ai | python3 -m json.tool
echo ""
echo ""

echo "5. Testing Database Records..."
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM app_settings WHERE is_active = true;" | tr -d ' '
echo " active settings in database"
echo ""

echo "6. Testing Settings by Category..."
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "SELECT category, COUNT(*) as count FROM app_settings WHERE is_active = true GROUP BY category ORDER BY category;"
echo ""

echo "7. Testing Company Settings..."
curl -s $BASE_URL/companies?limit=1 | python3 -m json.tool
echo ""
echo ""

echo -e "${GREEN}======================================"
echo "✅ All Tests Completed"
echo "======================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3000/settings"
echo "2. Update company details and API keys"
echo "3. Click 'Save Configuration'"
echo "4. All settings will be saved to database"
echo ""
