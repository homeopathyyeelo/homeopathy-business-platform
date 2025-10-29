#!/bin/bash

# Setup script for Purchase & Inventory Upload System
# This script initializes the database tables and verifies the setup

set -e

echo "========================================="
echo "Purchase & Inventory Upload System Setup"
echo "========================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
    echo "✓ Environment variables loaded from .env.local"
elif [ -f .env ]; then
    source .env
    echo "✓ Environment variables loaded from .env"
else
    echo "✗ .env file not found"
    exit 1
fi

# Extract database connection details
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5433}"
DB_NAME="${POSTGRES_DB:-yeelo_homeopathy}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Build clean database URL (psql doesn't like ?schema=public)
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Run migration
echo "Running database migration..."
psql "$DB_URL" -f database/migrations/011_upload_approval_system.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database tables created successfully!"
    echo ""
    echo "Created tables:"
    echo "  - upload_sessions"
    echo "  - upload_items"
    echo "  - purchase_uploads"
    echo "  - inventory_uploads"
    echo "  - upload_logs"
    echo ""
else
    echo ""
    echo "✗ Migration failed"
    exit 1
fi

# Verify tables
echo "Verifying table creation..."
psql "$DB_URL" -c "SELECT COUNT(*) FROM upload_sessions;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Tables verified"
else
    echo "✗ Table verification failed"
    exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Access purchase upload: http://localhost:3000/purchases/upload"
echo "2. Access inventory upload: http://localhost:3000/inventory/upload"
echo "3. Access approval dashboard: http://localhost:3000/admin/approvals"
echo ""
echo "CSV Templates available at:"
echo "  - /templates/Template_Purchase_Upload.csv"
echo "  - /templates/Template_Inventory_Upload.csv"
echo ""
echo "For detailed documentation, see UPLOAD-SYSTEM-COMPLETE.md"
echo ""
