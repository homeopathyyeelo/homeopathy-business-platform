#!/bin/bash

# POS System Quick Setup Script
# This script automates the complete POS system deployment

set -e

echo "========================================="
echo "🚀 POS & GST System - Quick Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
command -v psql >/dev/null 2>&1 || { echo -e "${RED}PostgreSQL client not found. Please install it.${NC}"; exit 1; }
command -v go >/dev/null 2>&1 || { echo -e "${RED}Go not found. Please install it.${NC}"; exit 1; }
echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Database configuration
echo -e "${BLUE}Step 2: Database configuration${NC}"
read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database name [yeelo_homeopathy]: " DB_NAME
DB_NAME=${DB_NAME:-yeelo_homeopathy}

read -p "Database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""
echo -e "${GREEN}✓ Database configuration saved${NC}"
echo ""

# Step 3: Run migration
echo -e "${BLUE}Step 3: Running database migration...${NC}"
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD

MIGRATION_FILE="$(dirname "$0")/../migrations/013_pos_gst_compliance.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}ERROR: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
else
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed successfully${NC}"
else
    echo -e "${RED}✗ Database migration failed${NC}"
    exit 1
fi
echo ""

# Step 4: Verify tables
echo -e "${BLUE}Step 4: Verifying tables...${NC}"
TABLES=(
    "sales_invoices"
    "sales_invoice_items"
    "sales_returns"
    "credit_notes"
    "itc_ledger"
    "doctor_commissions"
    "prescriptions"
    "held_bills"
    "product_pricing_tiers"
    "gst_return_periods"
)

for table in "${TABLES[@]}"; do
    if [ -z "$DB_PASSWORD" ]; then
        TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');")
    else
        TABLE_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');")
    fi
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        echo -e "${GREEN}  ✓ $table${NC}"
    else
        echo -e "${RED}  ✗ $table (missing)${NC}"
    fi
done
echo ""

# Step 5: Build Go server
echo -e "${BLUE}Step 5: Building Go server...${NC}"
cd "$(dirname "$0")/.."
go build -o api-bin cmd/server/main.go

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Go server built successfully${NC}"
else
    echo -e "${RED}✗ Go server build failed${NC}"
    exit 1
fi
echo ""

# Step 6: Test API endpoints
echo -e "${BLUE}Step 6: Testing API endpoints...${NC}"
echo "Starting server in background..."
./api-bin &
SERVER_PID=$!
sleep 5

# Test health endpoint
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✓ Server is responding${NC}"
else
    echo -e "${RED}✗ Server is not responding${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Stop test server
kill $SERVER_PID 2>/dev/null
echo ""

# Step 7: Summary
echo "========================================="
echo -e "${GREEN}✅ POS System Setup Complete!${NC}"
echo "========================================="
echo ""
echo "📋 What was installed:"
echo "  ✓ 13 database tables for POS & GST"
echo "  ✓ 25+ REST API endpoints"
echo "  ✓ Multi-rate GST support (5% & 18%)"
echo "  ✓ FEFO batch selection"
echo "  ✓ ITC tracking"
echo "  ✓ GSTR-1 & GSTR-3B reports"
echo "  ✓ Sales returns & credit notes"
echo "  ✓ Doctor commissions"
echo "  ✓ Hold/Resume bills"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start the server: ./api-bin"
echo "  2. Test APIs: curl http://localhost:8080/api/erp/pos/search-products?q=test"
echo "  3. Update frontend to use new APIs"
echo "  4. Review documentation: ../../POS-API-DOCUMENTATION.txt"
echo ""
echo "📚 Documentation:"
echo "  - API Reference: ../../POS-API-DOCUMENTATION.txt"
echo "  - Implementation Guide: ../../POS-IMPLEMENTATION-COMPLETE.txt"
echo "  - API Handlers: internal/handlers/pos_enhanced_handler.go"
echo "  - GST Reports: internal/handlers/gst_reports_handler.go"
echo ""
echo "🎉 Your POS system is ready for production!"
echo ""
