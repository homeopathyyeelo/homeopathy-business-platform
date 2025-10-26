#!/bin/bash

# HomeoERP Database Reset Script
# This script resets the database and recreates all tables with master data

set -e

echo "🔄 Resetting HomeoERP Database..."
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q erp-postgres; then
    echo "❌ PostgreSQL container is not running!"
    echo "   Run: docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL container is running"
echo ""

# Step 1: Drop and recreate database
echo "📦 Step 1: Recreating database..."
docker exec erp-postgres psql -U postgres -c "DROP DATABASE IF EXISTS yeelo_homeopathy;"
docker exec erp-postgres psql -U postgres -c "CREATE DATABASE yeelo_homeopathy;"
echo "✅ Database recreated"
echo ""

# Step 2: Run initial schema
echo "📦 Step 2: Creating core tables..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < scripts/001_init_database.sql
echo "✅ Core tables created"
echo ""

# Step 3: Create master data tables
echo "📦 Step 3: Creating master data tables..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < create-master-tables.sql
echo "✅ Master data tables created"
echo ""

# Step 4: Create additional tables
echo "📦 Step 4: Creating additional tables..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < create-additional-tables.sql
echo "✅ Additional tables created"
echo ""

# Step 5: Insert master data
echo "📦 Step 5: Inserting master data..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < INSERT-MASTER-DATA-FIXED.sql
echo "✅ Master data inserted"
echo ""

# Step 6: Insert default homeopathy data
echo "📦 Step 6: Inserting default homeopathy data..."
docker exec -i erp-postgres psql -U postgres -d yeelo_homeopathy < insert-default-homeopathy-data.sql
echo "✅ Default homeopathy data inserted"
echo ""

# Step 7: Verify tables
echo "📊 Verifying database..."
TABLE_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Total tables: $TABLE_COUNT"

CATEGORY_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM categories;")
BRAND_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM brands;")
POTENCY_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM potencies;")
FORM_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM forms;")
SUBCAT_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM subcategories;")
UNIT_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM units;")
HSN_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM hsn_codes;")
VENDOR_COUNT=$(docker exec erp-postgres psql -U postgres -d yeelo_homeopathy -t -c "SELECT COUNT(*) FROM vendors;")

echo "   Categories: $CATEGORY_COUNT"
echo "   Subcategories: $SUBCAT_COUNT"
echo "   Brands: $BRAND_COUNT"
echo "   Potencies: $POTENCY_COUNT"
echo "   Forms: $FORM_COUNT"
echo "   Units: $UNIT_COUNT"
echo "   HSN Codes: $HSN_COUNT"
echo "   Vendors: $VENDOR_COUNT"
echo ""

echo "✅ Database reset complete!"
echo ""
echo "🚀 You can now start the API service:"
echo "   cd services/api-golang-v2"
echo "   go run main.go"
echo ""
echo "🌐 Test the APIs:"
echo "   curl http://localhost:3005/api/erp/categories"
echo "   curl http://localhost:3005/api/erp/brands"
echo "   curl http://localhost:3005/api/erp/products"
