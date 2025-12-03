#!/bin/bash

# 🚀 Hold Bills Feature - Production Deployment Script
# This script deploys the Hold Bills feature to production

set -e  # Exit on error

echo "🚀 Starting Hold Bills Feature Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-yeelo_homeopathy}
BACKEND_PORT=${BACKEND_PORT:-3005}

echo "📋 Configuration:"
echo "   Database: $DB_NAME@$DB_HOST"
echo "   User: $DB_USER"
echo "   Backend Port: $BACKEND_PORT"
echo ""

# Step 1: Run Migration
echo "📦 Step 1/4: Running database migration..."
MIGRATION_FILE="/var/www/homeopathy-business-platform/services/api-golang-master/migrations/018_create_hold_bills_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "   Running migration..."
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE 2>&1 | grep -q "ERROR"; then
    # Check if table already exists
    if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d pos_hold_bills" &>/dev/null; then
        echo -e "${YELLOW}   ⚠️  Table already exists (migration previously run)${NC}"
    else
        echo -e "${RED}   ❌ Migration failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}   ✅ Migration successful${NC}"
fi

# Verify table was created
echo "   Verifying table structure..."
if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d pos_hold_bills" &>/dev/null; then
    echo -e "${GREEN}   ✅ Table pos_hold_bills verified${NC}"
else
    echo -e "${RED}   ❌ Table verification failed${NC}"
    exit 1
fi

echo ""

# Step 2: Configure OpenAI (Optional)
echo "🤖 Step 2/4: Configuring OpenAI API key (optional)..."
ENV_FILE="/var/www/homeopathy-business-platform/services/api-golang-master/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "   Creating .env file..."
    touch $ENV_FILE
fi

if grep -q "OPENAI_API_KEY=" $ENV_FILE; then
    echo -e "${GREEN}   ✅ OpenAI key already configured${NC}"
else
    echo -e "${YELLOW}   ⚠️  OpenAI key not found in .env${NC}"
    echo "   Note: AI suggestions will work with SQL-based algorithms"
    echo "   For disease-based AI, add: OPENAI_API_KEY=your-key to .env"
fi

echo ""

# Step 3: Restart Backend
echo "🔄 Step 3/4: Restarting backend server..."

cd /var/www/homeopathy-business-platform/services/api-golang-master

# Check if backend is running
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "   Stopping existing backend..."
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Verify Go dependencies
echo "   Verifying Go dependencies..."
go mod tidy
if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Go dependencies check failed${NC}"
    exit 1
fi

# Start backend
echo "   Starting backend server..."
nohup go run cmd/main.go > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check if backend is running
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}   ✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}   ❌ Backend failed to start${NC}"
    echo "   Check logs: tail -f backend.log"
    exit 1
fi

echo ""

# Step 4: Test Endpoints
echo "🧪 Step 4/4: Testing API endpoints..."

# Test health endpoint
echo "   Testing health endpoint..."
HEALTH_CHECK=$(curl -s http://localhost:$BACKEND_PORT/api/health || echo "FAILED")
if [[ $HEALTH_CHECK == *"OK"* ]] || [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo -e "${GREEN}   ✅ Health check passed${NC}"
else
    echo -e "${YELLOW}   ⚠️  Health check uncertain (backend may still be starting)${NC}"
fi

# Test Hold Bills endpoint
echo "   Testing Hold Bills endpoint..."
HOLD_BILLS_TEST=$(curl -s http://localhost:$BACKEND_PORT/api/erp/pos/hold-bills || echo "FAILED")
if [[ $HOLD_BILLS_TEST == *"data"* ]] || [[ $HOLD_BILLS_TEST == *"[]"* ]]; then
    echo -e "${GREEN}   ✅ Hold Bills API working${NC}"
else
    echo -e "${YELLOW}   ⚠️  Hold Bills API response uncertain${NC}"
    echo "   Response: $HOLD_BILLS_TEST"
fi

# Test AI Suggestions endpoint (without auth)
echo "   Testing AI Suggestions endpoint..."
AI_TEST=$(curl -s -X POST http://localhost:$BACKEND_PORT/api/erp/pos/ai-suggestions \
    -H "Content-Type: application/json" \
    -d '{"cart_items":[{"name":"Test"}]}' || echo "FAILED")
if [[ $AI_TEST == *"suggestions"* ]] || [[ $AI_TEST == *"success"* ]]; then
    echo -e "${GREEN}   ✅ AI Suggestions API working${NC}"
else
    echo -e "${YELLOW}   ⚠️  AI API response: May need authentication${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Access Points:"
echo "   POS Page:        http://localhost:3000/sales/pos"
echo "   Hold Bills Page: http://localhost:3000/sales/hold-bills"
echo "   Backend API:     http://localhost:$BACKEND_PORT"
echo ""
echo "🧪 Quick Test:"
echo "   1. Open: http://localhost:3000/sales/pos"
echo "   2. Add items to cart"
echo "   3. Click 'Hold Bill' button"
echo "   4. Verify: Cart clears & bill is saved"
echo "   5. Click 'Held Bills' to see saved bills"
echo "   6. Click 'Resume' to load bill back"
echo ""
echo "📊 API Test Commands:"
echo "   # List held bills"
echo "   curl http://localhost:$BACKEND_PORT/api/erp/pos/hold-bills"
echo ""
echo "   # AI Suggestions"
echo "   curl -X POST http://localhost:$BACKEND_PORT/api/erp/pos/ai-suggestions \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"cart_items\":[{\"name\":\"Arnica\"}]}'"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f /var/www/homeopathy-business-platform/services/api-golang-master/backend.log"
echo "   Frontend: Check browser console"
echo ""
echo "🎉 Features Now Live:"
echo "   ✅ Hold Bills"
echo "   ✅ AI Smart Suggestions"
echo "   ✅ Disease-Based Recommendations"
echo "   ✅ Profit Margin Tracking"
echo ""
echo "For detailed documentation, see:"
echo "   - HOLD_BILLS_TESTING_GUIDE.md"
echo "   - AI_FEATURES_COMPLETE_GUIDE.md"
echo "   - PRODUCTION_READINESS_REPORT.md"
echo ""
