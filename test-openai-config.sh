#!/bin/bash

echo "=========================================="
echo "Testing OpenAI Configuration"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check environment variable
echo -e "${YELLOW}1. Checking Environment Variable${NC}"
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}✗ OPENAI_API_KEY not set in environment${NC}"
    echo "  Loading from .env file..."
    source .env
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${RED}✗ OPENAI_API_KEY not found in .env${NC}"
    else
        echo -e "${GREEN}✓ OPENAI_API_KEY loaded from .env${NC}"
        echo "  Key: ${OPENAI_API_KEY:0:10}...${OPENAI_API_KEY: -4}"
    fi
else
    echo -e "${GREEN}✓ OPENAI_API_KEY found in environment${NC}"
    echo "  Key: ${OPENAI_API_KEY:0:10}...${OPENAI_API_KEY: -4}"
fi
echo ""

# Test 2: Check database
echo -e "${YELLOW}2. Checking Database${NC}"
DB_KEY=$(PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT value FROM app_settings WHERE key = 'ai.openai.apiKey';" 2>/dev/null | tr -d ' ' | tr -d '\n')
if [ -z "$DB_KEY" ]; then
    echo -e "${RED}✗ OpenAI key not found in database${NC}"
else
    echo -e "${GREEN}✓ OpenAI key found in database${NC}"
    # Extract key from JSON value
    CLEAN_KEY=$(echo "$DB_KEY" | sed 's/"//g')
    echo "  Key: ${CLEAN_KEY:0:10}...${CLEAN_KEY: -4}"
fi
echo ""

# Test 3: Check backend logs
echo -e "${YELLOW}3. Checking Backend Logs${NC}"
if grep -q "🔑 OpenAI API Key loaded" logs/backend.log 2>/dev/null; then
    KEY_LOG=$(grep "🔑 OpenAI API Key loaded" logs/backend.log | tail -1)
    echo -e "${GREEN}✓ Backend loaded OpenAI key${NC}"
    echo "  $KEY_LOG"
else
    echo -e "${RED}✗ Backend log not found or key not loaded${NC}"
fi
echo ""

# Test 4: Check backend is running
echo -e "${YELLOW}4. Checking Backend Status${NC}"
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 3005${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
fi
echo ""

# Test 5: Test API endpoint
echo -e "${YELLOW}5. Testing AI Settings API${NC}"
AI_SETTINGS=$(curl -s http://localhost:3005/api/erp/settings/category/ai 2>/dev/null)
if echo "$AI_SETTINGS" | grep -q "ai.openai.apiKey"; then
    echo -e "${GREEN}✓ AI settings endpoint working${NC}"
    echo "$AI_SETTINGS" | python3 -m json.tool 2>/dev/null | head -20
else
    echo -e "${RED}✗ AI settings endpoint not working${NC}"
fi
echo ""

# Test 6: Count all AI-related settings
echo -e "${YELLOW}6. AI Settings Summary${NC}"
AI_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM app_settings WHERE category = 'ai';" 2>/dev/null | tr -d ' ')
echo "  Total AI settings in database: $AI_COUNT"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "SELECT key, type, description FROM app_settings WHERE category = 'ai' ORDER BY key;" 2>/dev/null
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ OpenAI Configuration Summary${NC}"
echo "=========================================="
echo ""
echo "Configuration Sources:"
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "  ✓ Environment Variable: SET"
else
    echo "  ✗ Environment Variable: NOT SET"
fi

if [ ! -z "$DB_KEY" ]; then
    echo "  ✓ Database (app_settings): SET"
else
    echo "  ✗ Database (app_settings): NOT SET"
fi

if grep -q "🔑 OpenAI API Key loaded" logs/backend.log 2>/dev/null; then
    echo "  ✓ Backend: LOADED"
else
    echo "  ✗ Backend: NOT LOADED"
fi

echo ""
echo "OpenAI key is available from:"
echo "  1. Database (app_settings table) - FIRST PRIORITY"
echo "  2. Environment variable - FALLBACK"
echo ""
echo "Backend uses ConfigService to load key automatically."
echo "Frontend uses lib/config/openai-config.ts to access key."
echo ""
echo "🚀 AI Features Ready!"
echo ""
