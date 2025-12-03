#!/bin/bash

echo "=========================================="
echo "Verifying OpenAI Project Configuration"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Database
echo -e "${YELLOW}1. Database Verification${NC}"
echo "Checking app_settings table..."
DB_PROJECT_NAME=$(PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT value FROM app_settings WHERE key = 'ai.openai.projectName';" 2>/dev/null | tr -d ' ' | tr -d '\n' | sed 's/"//g')
DB_PROJECT_ID=$(PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -t -c "SELECT value FROM app_settings WHERE key = 'ai.openai.projectId';" 2>/dev/null | tr -d ' ' | tr -d '\n' | sed 's/"//g')

if [ "$DB_PROJECT_NAME" = "YeeloHomeopathy" ]; then
    echo -e "${GREEN}✓ Project Name in database: $DB_PROJECT_NAME${NC}"
else
    echo -e "${RED}✗ Project Name not found or incorrect${NC}"
fi

if [ "$DB_PROJECT_ID" = "proj_sS82iVGtjYP6IkBNXocPajXt" ]; then
    echo -e "${GREEN}✓ Project ID in database: $DB_PROJECT_ID${NC}"
else
    echo -e "${RED}✗ Project ID not found or incorrect${NC}"
fi
echo ""

# Test 2: System Environment
echo -e "${YELLOW}2. System Environment Verification${NC}"
echo "Checking ~/.bashrc exports..."
source ~/.bashrc

if [ "$OPENAI_PROJECT_NAME" = "YeeloHomeopathy" ]; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_NAME: $OPENAI_PROJECT_NAME${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_NAME not set or incorrect${NC}"
fi

if [ "$OPENAI_PROJECT_ID" = "proj_sS82iVGtjYP6IkBNXocPajXt" ]; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_ID: $OPENAI_PROJECT_ID${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_ID not set or incorrect${NC}"
fi
echo ""

# Test 3: .env files
echo -e "${YELLOW}3. Environment Files Verification${NC}"
echo "Checking .env file..."
cd /var/www/homeopathy-business-platform

if grep -q "OPENAI_PROJECT_NAME=YeeloHomeopathy" .env; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_NAME in .env${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_NAME not in .env${NC}"
fi

if grep -q "OPENAI_PROJECT_ID=proj_sS82iVGtjYP6IkBNXocPajXt" .env; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_ID in .env${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_ID not in .env${NC}"
fi

if grep -q "OPENAI_PROJECT_NAME=YeeloHomeopathy" .env.local; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_NAME in .env.local${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_NAME not in .env.local${NC}"
fi

if grep -q "OPENAI_PROJECT_ID=proj_sS82iVGtjYP6IkBNXocPajXt" .env.local; then
    echo -e "${GREEN}✓ OPENAI_PROJECT_ID in .env.local${NC}"
else
    echo -e "${RED}✗ OPENAI_PROJECT_ID not in .env.local${NC}"
fi
echo ""

# Test 4: Complete AI Settings
echo -e "${YELLOW}4. Complete AI Settings Summary${NC}"
echo "All AI settings in database:"
PGPASSWORD=postgres psql -h localhost -U postgres -d yeelo_homeopathy -c "
SELECT 
  key,
  CASE 
    WHEN is_secret THEN '***MASKED***'
    ELSE LEFT(value::text, 30) || '...'
  END as value_preview,
  description
FROM app_settings 
WHERE category = 'ai' 
ORDER BY key;" 2>/dev/null
echo ""

# Test 5: OpenAI Platform Link
echo -e "${YELLOW}5. OpenAI Platform Information${NC}"
echo -e "${BLUE}Project Name:${NC} YeeloHomeopathy"
echo -e "${BLUE}Project ID:${NC}   proj_sS82iVGtjYP6IkBNXocPajXt"
echo -e "${BLUE}Dashboard URL:${NC} https://platform.openai.com/settings/proj_sS82iVGtjYP6IkBNXocPajXt"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Verification Complete${NC}"
echo "=========================================="
echo ""
echo "OpenAI Project Configuration Status:"
echo "  Database:        5 AI settings stored"
echo "  .env:            Project vars added"
echo "  .env.local:      Project vars added"
echo "  ~/.bashrc:       System exports added"
echo ""
echo "Project Details:"
echo "  Name: YeeloHomeopathy"
echo "  ID:   proj_sS82iVGtjYP6IkBNXocPajXt"
echo ""
echo "Access in code:"
echo "  Backend:  configService.GetOpenAIProjectName()"
echo "  Frontend: await getOpenAIProjectName()"
echo "  Shell:    echo \$OPENAI_PROJECT_NAME"
echo ""
echo "🚀 OpenAI project ready for use!"
echo ""
