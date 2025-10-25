#!/bin/bash

# =====================================================
# Insert HSN Codes & Units
# =====================================================

echo "🚀 Inserting HSN codes and units..."
echo ""

DB_CONTAINER="erp-postgres"
DB_NAME="yeelo_homeopathy"
DB_USER="postgres"
SQL_FILE="INSERT-HSN-UNITS.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: $SQL_FILE not found!"
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Error: PostgreSQL container '$DB_CONTAINER' is not running!"
    exit 1
fi

echo "📊 Creating tables and inserting data..."
echo ""

# Execute SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $SQL_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ HSN codes and units inserted successfully!"
    echo ""
    echo "📈 Summary:"
    echo "   - HSN Codes: 30+ (October 2025 GST rates)"
    echo "   - Units: 25+ (Volume, Weight, Count)"
    echo "   - GST Rates: 12% (medicines), 18% (cosmetics)"
    echo ""
    echo "🌐 Test at:"
    echo "   http://localhost:3000/products/hsn"
    echo "   http://localhost:3000/products/units"
else
    echo ""
    echo "❌ Error: Failed to insert data!"
    exit 1
fi
