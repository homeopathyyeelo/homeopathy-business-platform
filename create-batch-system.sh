#!/bin/bash

# =====================================================
# Create Complete Batch Management System
# =====================================================

echo "🚀 Creating Batch Management System..."
echo ""

DB_CONTAINER="erp-postgres"
DB_NAME="yeelo_homeopathy"
DB_USER="postgres"
SQL_FILE="CREATE-BATCH-SYSTEM.sql"

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

echo "📊 Creating tables, views, and indexes..."
echo ""

# Execute SQL file
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $SQL_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Batch Management System created successfully!"
    echo ""
    echo "📈 Summary:"
    echo "   - Tables: 4 (warehouses, batches, inventory_transactions, batch_alerts)"
    echo "   - Views: 3 (stock summary, total stock, expiring batches)"
    echo "   - Indexes: 11 (for performance)"
    echo "   - Triggers: 1 (auto-update timestamp)"
    echo "   - Default Warehouses: 3"
    echo ""
    echo "🌐 Test at:"
    echo "   http://localhost:3000/products/batches"
    echo "   http://localhost:3000/inventory/transactions"
    echo ""
    echo "📊 Key Features:"
    echo "   ✅ Multi-warehouse support"
    echo "   ✅ Batch-wise stock tracking"
    echo "   ✅ Expiry date management"
    echo "   ✅ Reserved quantity (for orders)"
    echo "   ✅ Inventory transactions (in/out)"
    echo "   ✅ Automatic alerts (expiry, low stock)"
    echo "   ✅ FIFO stock management"
else
    echo ""
    echo "❌ Error: Failed to create batch system!"
    exit 1
fi
