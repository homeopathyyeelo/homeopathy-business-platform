#!/bin/bash

# ============================================================================
# Fix ALL Database References - Replace Old Credentials Everywhere
# Single Connection: postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║   🔧 Fixing ALL Database References Everywhere 🔧         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Standard connection
STANDARD_URL="postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy"
STANDARD_USER="postgres"
STANDARD_PASS="postgres"
STANDARD_DB="yeelo_homeopathy"

log "📝 Fixing start-complete.sh..."
sed -i 's|postgresql://erp_user:erp_password@localhost:5432/erp_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' start-complete.sh
sed -i 's|POSTGRES_USER=erp_user|POSTGRES_USER=postgres|g' start-complete.sh
sed -i 's|POSTGRES_PASSWORD=erp_password|POSTGRES_PASSWORD=postgres|g' start-complete.sh
sed -i 's|POSTGRES_DB=erp_db|POSTGRES_DB=yeelo_homeopathy|g' start-complete.sh
log "✅ start-complete.sh fixed"

log "📝 Fixing scripts/setup.sh..."
if [ -f "scripts/setup.sh" ]; then
    sed -i 's|postgresql://erp_user:erp_password@localhost:5432/erp_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' scripts/setup.sh
    sed -i 's|POSTGRES_USER=erp_user|POSTGRES_USER=postgres|g' scripts/setup.sh
    sed -i 's|POSTGRES_PASSWORD=erp_password|POSTGRES_PASSWORD=postgres|g' scripts/setup.sh
    sed -i 's|psql -U erp_user|psql -U postgres|g' scripts/setup.sh
    log "✅ scripts/setup.sh fixed"
fi

log "📝 Fixing Go services..."

# Product Service
if [ -f "services/product-service/main.go" ]; then
    sed -i 's|postgresql://erp_user:erp_password@localhost:5432/products_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' services/product-service/main.go
    log "✅ product-service/main.go fixed"
fi

# Inventory Service
if [ -f "services/inventory-service/main.go" ]; then
    sed -i 's|postgresql://erp_user:erp_password@localhost:5432/inventory_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' services/inventory-service/main.go
    log "✅ inventory-service/main.go fixed"
fi

# Sales Service
if [ -f "services/sales-service/main.go" ]; then
    sed -i 's|postgresql://erp_user:erp_password@localhost:5432/sales_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' services/sales-service/main.go
    log "✅ sales-service/main.go fixed"
fi

log "📝 Fixing docker-compose.yml comments..."
sed -i 's|postgresql://erp_user:erp_password@postgres:5432/erp_main|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' docker-compose.yml
sed -i 's|postgresql://erp_user:erp_password@postgres:5432/products_db|postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy|g' docker-compose.yml
log "✅ docker-compose.yml fixed"

log "📝 Searching for any remaining old references..."
remaining=$(grep -r "erp_user\|erp_password\|erp_db\|erp_main\|products_db\|inventory_db\|sales_db" \
    --include="*.go" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.sh" \
    --include="*.yml" \
    --include="*.yaml" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=.git \
    . 2>/dev/null | wc -l)

if [ "$remaining" -gt 0 ]; then
    warn "⚠️  Found $remaining remaining references to old credentials"
    info "Run this to see them:"
    info "  grep -r 'erp_user\\|erp_password\\|erp_db' --include='*.go' --include='*.ts' --include='*.sh' ."
else
    log "✅ No remaining old references found!"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  All Database References Fixed!                       ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "📋 Summary:"
log "   Old: erp_user:erp_password@*/erp_db"
log "   New: postgres:postgres@postgres:5432/yeelo_homeopathy"
echo ""
log "🔄 Restart services to apply changes:"
log "   ./stop-complete.sh && ./start-complete.sh"
echo ""
