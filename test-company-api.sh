#!/bin/bash

echo "Testing Company Settings API Endpoints"
echo "========================================"
echo ""

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaXNwbGF5TmFtZSI6IiIsImVtYWlsIjoibWVkaWNpbmVAeWVlbG9ob21lb3BhdGh5LmNvbSIsImV4cCI6MTc2NDc3NDM4NywiZmlyc3ROYW1lIjoiU3VwZXIiLCJpYXQiOjE3NjQ2ODc5ODcsImlzU3VwZXJBZG1pbiI6dHJ1ZSwibGFzdE5hbWUiOiJBZG1pbiIsIm5hbWUiOiIiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJ1c2VyX2lkIjoiNGM2NzJkYWUtYTFmZi00ZTNkLWI4ODEtYjZlMzgwYWM5ZTRlIn0.6iAJpH6d-wMWO8nedSFApcyDkS2WsKQZvtbt3PXZnc8"

echo "1. Testing GET /api/erp/companies (with cookie)"
curl -s -b "auth-token=$TOKEN" http://localhost:3005/api/erp/companies?limit=1 | python3 -m json.tool
echo ""
echo ""

echo "2. Getting company ID from database"
COMPANY_ID=$(PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT id FROM companies WHERE code='YEELO' LIMIT 1;" | tr -d ' ')
echo "Company ID: $COMPANY_ID"
echo ""

if [ ! -z "$COMPANY_ID" ]; then
  echo "3. Testing PUT /api/erp/companies/$COMPANY_ID (Update)"
  curl -s -b "auth-token=$TOKEN" -X PUT http://localhost:3005/api/erp/companies/$COMPANY_ID \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Yeelo Homeopathy",
      "address": "Updated Address Test",
      "phone": "8478019973",
      "email": "medicine@yeelohomeopathy.com",
      "gstin": "06BUAPG3815Q1ZH"
    }' | python3 -m json.tool
  echo ""
fi

echo ""
echo "✅ API Test Complete"
