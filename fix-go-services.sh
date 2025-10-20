#!/bin/bash

# ============================================================================
# Fix Go Microservices - Install Dependencies
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     🔧 Fixing Go Microservices Dependencies 🔧            ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

for service in product-service inventory-service sales-service; do
    log "📦 Fixing $service..."
    
    if [ ! -d "services/$service" ]; then
        echo "⚠️  Directory services/$service not found, skipping..."
        continue
    fi
    
    cd "services/$service"
    
    # Initialize go module if needed
    if [ ! -f "go.mod" ]; then
        info "Initializing Go module..."
        go mod init "$service"
    fi
    
    # Add common dependencies
    info "Installing dependencies..."
    go get github.com/gin-gonic/gin@latest
    go get github.com/joho/godotenv@latest
    go get github.com/lib/pq@latest
    go get gorm.io/gorm@latest
    go get gorm.io/driver/postgres@latest
    go get github.com/google/uuid@latest
    
    # Tidy up
    go mod tidy
    
    cd ../..
    log "✅ $service fixed"
    echo ""
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  All Go Services Fixed!                               ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "🔄 Restart services to apply changes:"
log "   ./stop-complete.sh && ./start-complete.sh"
echo ""
