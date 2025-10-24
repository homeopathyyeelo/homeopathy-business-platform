#!/bin/bash

echo "🚀 Starting HomeoERP with All New Features"

# Kill existing processes
killall -9 api-v2-minimal 2>/dev/null

# Start main API (if not using minimal)
echo "📦 Starting API server..."
cd services/api-golang-v2/cmd
nohup go run main.go > ../../../logs/api-golang-v2.log 2>&1 &
API_PID=$!

sleep 3

# Test endpoints
echo "🧪 Testing new feature endpoints..."
BASE_URL="http://localhost:3005"

curl -s $BASE_URL/health | jq -r '.status' && echo "✅ Health OK"
curl -s $BASE_URL/api/erp/commissions/report | jq -r '.success' && echo "✅ Commission API"
curl -s $BASE_URL/api/erp/bundles | jq -r '.success' && echo "✅ Bundles API"
curl -s $BASE_URL/api/erp/loyalty/cards/cust-001 | jq -r '.success' && echo "✅ Loyalty API"
curl -s $BASE_URL/api/erp/inventory/damages | jq -r '.success' && echo "✅ Damage API"
curl -s $BASE_URL/api/erp/pos/held-bills | jq -r '.success' && echo "✅ POS API"
curl -s $BASE_URL/api/erp/estimates | jq -r '.success' && echo "✅ Estimates API"

echo ""
echo "✅ API Server running (PID: $API_PID)"
echo "📊 Dashboard: http://localhost:3005/api/erp/dashboard/summary"
echo "💳 Commission: http://localhost:3000/finance/commission"
echo "📱 WhatsApp: http://localhost:3000/crm/whatsapp"
echo "🛒 Catalogue: http://localhost:3000/marketing/catalogue"
echo "⚠️  Damages: http://localhost:3000/inventory/damage"
echo "🤖 AI Insights: http://localhost:3000/ai/insights"
echo ""
echo "Run migrations: psql -U postgres -d homeoerp -f db/migrations/001_new_features.sql"
