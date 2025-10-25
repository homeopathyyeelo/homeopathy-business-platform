#!/bin/bash

# =====================================================
# Insert Master Data into PostgreSQL Database
# =====================================================

echo "🚀 Starting Master Data Insertion..."
echo ""

# Database connection details
DB_CONTAINER="erp-postgres"
DB_NAME="yeelo_homeopathy"
DB_USER="postgres"
SQL_FILE="INSERT-MASTER-DATA-FIXED.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: $SQL_FILE not found!"
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Error: PostgreSQL container '$DB_CONTAINER' is not running!"
    echo "Please start the database first: docker-compose up -d postgres"
    exit 1
fi

echo "📊 Inserting master data into database..."
echo ""

# Execute SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $SQL_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Master data inserted successfully!"
    echo ""
    echo "📈 Summary:"
    echo "   - Categories: 13"
    echo "   - Brands: 12"
    echo "   - Potencies: 25"
    echo "   - Forms: 22"
    echo "   - Total Records: 72"
    echo ""
    echo "🔍 Verify data:"
    echo "   docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
    echo "   SELECT * FROM categories;"
    echo "   SELECT * FROM brands;"
    echo "   SELECT * FROM potencies;"
    echo "   SELECT * FROM forms;"
else
    echo ""
    echo "❌ Error: Failed to insert master data!"
    exit 1
fi
