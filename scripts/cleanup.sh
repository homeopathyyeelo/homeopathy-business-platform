#!/bin/bash

# Homeopathy ERP - Cleanup Script
# Stops all services and optionally removes data

set -e

echo "🧹 Homeopathy ERP - Cleanup Script"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
REMOVE_DATA=false
REMOVE_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --remove-data)
            REMOVE_DATA=true
            shift
            ;;
        --remove-images)
            REMOVE_IMAGES=true
            shift
            ;;
        --all)
            REMOVE_DATA=true
            REMOVE_IMAGES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--remove-data] [--remove-images] [--all]"
            exit 1
            ;;
    esac
done

# Stop all services
echo "🛑 Stopping all services..."
docker-compose down
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

# Remove data volumes
if [ "$REMOVE_DATA" = true ]; then
    echo -e "${YELLOW}⚠️  Removing data volumes...${NC}"
    read -p "This will delete all data. Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker-compose down -v
        echo -e "${GREEN}✓ Data volumes removed${NC}"
    else
        echo "Skipping data removal"
    fi
    echo ""
fi

# Remove Docker images
if [ "$REMOVE_IMAGES" = true ]; then
    echo -e "${YELLOW}⚠️  Removing Docker images...${NC}"
    read -p "This will delete all built images. Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker-compose down --rmi all
        echo -e "${GREEN}✓ Docker images removed${NC}"
    else
        echo "Skipping image removal"
    fi
    echo ""
fi

# Clean frontend
echo "🧹 Cleaning frontend build artifacts..."
if [ -d "apps/next-erp/.next" ]; then
    rm -rf apps/next-erp/.next
    echo -e "${GREEN}✓ Frontend build cleaned${NC}"
fi
echo ""

# Clean Go build artifacts
echo "🧹 Cleaning Go build artifacts..."
for service in services/product-service services/inventory-service services/sales-service; do
    if [ -d "$service" ]; then
        cd "$service"
        go clean -cache -modcache 2>/dev/null || true
        cd ../..
    fi
done
echo -e "${GREEN}✓ Go artifacts cleaned${NC}"
echo ""

# Summary
echo "✅ Cleanup complete!"
echo ""
echo "To restart the system:"
echo "  ./scripts/setup.sh"
echo ""
