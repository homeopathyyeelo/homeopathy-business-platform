#!/bin/bash

# =====================================================
# Add Parent-Child Category Support & Subcategories
# =====================================================

echo "🚀 Adding subcategories support..."
echo ""

DB_CONTAINER="erp-postgres"
DB_NAME="yeelo_homeopathy"
DB_USER="postgres"
SQL_FILE="ADD-SUBCATEGORIES.sql"

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

echo "📊 Adding parent_id column and inserting subcategories..."
echo ""

# Execute SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $SQL_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Subcategories added successfully!"
    echo ""
    echo "📈 Summary:"
    echo "   - External Application category + 12 subcategories"
    echo "   - Cosmetics: 3 subcategories"
    echo "   - Dilutions: 12 potency subcategories"
    echo "   - Mother Tincture: 4 brand subcategories"
    echo "   - Biochemic: 4 brand subcategories"
    echo "   - Total new subcategories: ~35"
    echo ""
    echo "🌐 Test at:"
    echo "   http://localhost:3000/products/subcategories"
else
    echo ""
    echo "❌ Error: Failed to add subcategories!"
    exit 1
fi
