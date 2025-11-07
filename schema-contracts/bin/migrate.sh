#!/bin/bash

##############################################
# Migration Runner Script
# Usage: ./bin/migrate.sh up|down|status|create [migration_name]
##############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SQL_DIR="$ROOT_DIR/sql"
MIGRATIONS_DIR="$ROOT_DIR/migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database URL from environment or argument
DATABASE_URL="${DATABASE_URL:-}"

usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  up              Apply all pending migrations"
    echo "  down            Rollback last migration"
    echo "  status          Show migration status"
    echo "  create [name]   Create a new migration file"
    echo "  reset           Reset database (WARNING: destructive)"
    echo ""
    echo "Options:"
    echo "  --db URL        Database connection URL"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL    Database connection URL"
    echo ""
    exit 1
}

# Parse arguments
COMMAND="${1:-}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --db)
            DATABASE_URL="$2"
            shift 2
            ;;
        *)
            MIGRATION_NAME="$1"
            shift
            ;;
    esac
done

# Validate database URL
if [[ -z "$DATABASE_URL" ]]; then
    echo -e "${RED}✗${NC} DATABASE_URL is required"
    echo "Set it via environment variable or use --db flag"
    exit 1
fi

# Function to run SQL file
run_sql_file() {
    local file="$1"
    echo -e "${BLUE}→${NC} Running: $(basename "$file")"
    
    psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓${NC} Success"
        return 0
    else
        echo -e "${RED}✗${NC} Failed"
        return 1
    fi
}

# Function to record migration
record_migration() {
    local version="$1"
    local name="$2"
    
    psql "$DATABASE_URL" -c "
        INSERT INTO schema_migrations (version, name)
        VALUES ('$version', '$name')
        ON CONFLICT (version) DO NOTHING;
    " > /dev/null
}

# Function to check if migration table exists
ensure_migration_table() {
    run_sql_file "$SQL_DIR/000_migration_tracker.sql" > /dev/null 2>&1 || true
}

# Command: migrate up
migrate_up() {
    echo -e "\n${GREEN}Running migrations...${NC}\n"
    
    ensure_migration_table
    
    # Get list of applied migrations
    APPLIED=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY version;" 2>/dev/null || echo "")
    
    # Run SQL files in order
    for file in "$SQL_DIR"/*.sql; do
        if [[ ! -f "$file" ]]; then
            continue
        fi
        
        filename=$(basename "$file")
        version="${filename%%_*}"
        
        # Skip if already applied
        if echo "$APPLIED" | grep -q "$version"; then
            echo -e "${YELLOW}⊘${NC} Skipped: $filename (already applied)"
            continue
        fi
        
        run_sql_file "$file"
        record_migration "$version" "$filename"
    done
    
    echo -e "\n${GREEN}✓ All migrations applied${NC}"
}

# Command: migration status
migrate_status() {
    echo -e "\n${BLUE}Migration Status${NC}\n"
    
    ensure_migration_table
    
    psql "$DATABASE_URL" -c "
        SELECT 
            version,
            name,
            applied_at,
            execution_time_ms || 'ms' as duration
        FROM schema_migrations
        ORDER BY version;
    "
}

# Command: create new migration
create_migration() {
    if [[ -z "$MIGRATION_NAME" ]]; then
        echo -e "${RED}✗${NC} Migration name is required"
        echo "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    # Get next version number
    LAST_FILE=$(ls -1 "$SQL_DIR" | grep -E '^[0-9]+_' | sort -V | tail -1)
    if [[ -z "$LAST_FILE" ]]; then
        NEXT_VERSION="001"
    else
        LAST_VERSION="${LAST_FILE%%_*}"
        NEXT_VERSION=$(printf "%03d" $((10#$LAST_VERSION + 1)))
    fi
    
    # Create migration file
    FILENAME="${NEXT_VERSION}_${MIGRATION_NAME}.sql"
    FILEPATH="$SQL_DIR/$FILENAME"
    
    cat > "$FILEPATH" <<EOF
-- ============================================================
-- Migration: $FILENAME
-- Description: $MIGRATION_NAME
-- Version: $NEXT_VERSION
-- ============================================================

-- Write your migration SQL here


-- Rollback (for reference - implement separate down migration if needed)
-- 

EOF
    
    echo -e "${GREEN}✓${NC} Created migration: $FILENAME"
    echo -e "   Path: $FILEPATH"
}

# Command: reset database (destructive)
reset_database() {
    echo -e "${RED}⚠ WARNING: This will DROP and recreate all tables!${NC}"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        echo "Aborted."
        exit 0
    fi
    
    echo -e "\n${YELLOW}Resetting database...${NC}\n"
    
    # Drop all tables
    psql "$DATABASE_URL" -c "
        DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;
    "
    
    echo -e "${GREEN}✓${NC} Tables dropped"
    
    # Re-run migrations
    migrate_up
}

# Main
case "$COMMAND" in
    up)
        migrate_up
        ;;
    status)
        migrate_status
        ;;
    create)
        create_migration
        ;;
    reset)
        reset_database
        ;;
    down)
        echo -e "${YELLOW}⚠${NC} Down migrations not yet implemented"
        echo "To rollback, manually write reverse SQL or use reset"
        exit 1
        ;;
    *)
        usage
        ;;
esac
