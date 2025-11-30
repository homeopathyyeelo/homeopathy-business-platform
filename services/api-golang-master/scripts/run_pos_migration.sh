#!/bin/bash

# POS & GST Compliance Migration Runner
# This script applies the POS database migrations

set -e

echo "========================================="
echo "POS & GST Compliance Migration"
echo "========================================="
echo ""

# Database connection details (update these)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-yeelo_homeopathy}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

MIGRATION_FILE="$(dirname "$0")/../migrations/013_pos_gst_compliance.sql"

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "ERROR: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "Running migration: 013_pos_gst_compliance.sql"
echo ""

# Run the migration
if [ -z "$DB_PASSWORD" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
else
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Migration completed successfully!"
    echo "========================================="
    echo ""
    echo "The following tables have been created:"
    echo "  - sales_invoices"
    echo "  - sales_invoice_items"
    echo "  - sales_returns"
    echo "  - sales_return_items"
    echo "  - credit_notes"
    echo "  - itc_ledger"
    echo "  - doctor_commission_rules"
    echo "  - doctor_commissions"
    echo "  - prescriptions"
    echo "  - prescription_items"
    echo "  - held_bills"
    echo "  - product_pricing_tiers"
    echo "  - gst_return_periods"
    echo ""
    echo "You can now use the POS system with full GST compliance!"
else
    echo ""
    echo "========================================="
    echo "❌ Migration failed!"
    echo "========================================="
    exit 1
fi
