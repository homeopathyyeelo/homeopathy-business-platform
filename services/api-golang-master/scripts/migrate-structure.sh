#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Industry Standards Structure Migration Script         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo -e "${RED}❌ Error: go.mod not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will reorganize your project structure.${NC}"
echo -e "${YELLOW}   A backup will be created before making changes.${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Migration cancelled.${NC}"
    exit 1
fi

# Create backup
BACKUP_DIR="../api-golang-master-backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}📦 Creating backup in: $BACKUP_DIR${NC}"
cp -r . "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup created${NC}"

# Create required directories if they don't exist
echo -e "\n${BLUE}📁 Creating directory structure...${NC}"
mkdir -p internal/handlers
mkdir -p internal/services
mkdir -p internal/models
mkdir -p cmd/api
mkdir -p cmd/seed
mkdir -p tests
mkdir -p scripts
mkdir -p docs

# Move handlers to internal/handlers/
echo -e "\n${BLUE}📦 Moving handlers...${NC}"
HANDLER_FILES=(
    "company_branch_handlers.go"
    "finance_handlers.go"
    "hardware_integration_handlers.go"
    "hr_handlers.go"
    "loyalty_handlers.go"
    "marketing_handlers.go"
    "master_handlers.go"
    "multi_pc_sharing_handlers.go"
    "offline_handlers.go"
    "payment_gateway_handlers.go"
    "purchases_handlers.go"
    "reports_handlers.go"
    "sales_handlers.go"
    "settings_handlers.go"
)

for file in "${HANDLER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  Moving $file → internal/handlers/"
        mv "$file" internal/handlers/
    fi
done

# Move services to internal/services/
echo -e "\n${BLUE}📦 Moving services...${NC}"
SERVICE_FILES=(
    "customer_service.go"
    "hardware_services.go"
    "inventory_service.go"
    "multi_pc_sharing_services.go"
    "offline_services.go"
    "payment_services.go"
    "products_service.go"
    "sales_service.go"
    "services.go"
)

for file in "${SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  Moving $file → internal/services/"
        mv "$file" internal/services/
    fi
done

# Move models to internal/models/
echo -e "\n${BLUE}📦 Moving models...${NC}"
MODEL_FILES=(
    "erp_models.go"
    "masters.go"
    "models.go"
)

for file in "${MODEL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  Moving $file → internal/models/"
        mv "$file" internal/models/
    fi
done

# Move test files
echo -e "\n${BLUE}📦 Moving test files...${NC}"
if [ -f "workflow_test.go" ]; then
    echo -e "  Moving workflow_test.go → tests/"
    mv workflow_test.go tests/
fi

# Move seed.go to cmd/seed/
echo -e "\n${BLUE}📦 Moving seed.go...${NC}"
if [ -f "seed.go" ]; then
    echo -e "  Moving seed.go → cmd/seed/main.go"
    mv seed.go cmd/seed/main.go
fi

# Delete duplicate folders
echo -e "\n${BLUE}🗑️  Removing duplicate folders...${NC}"
if [ -d "handlers" ] && [ "$(ls -A handlers)" ]; then
    echo -e "  ${YELLOW}⚠️  handlers/ folder exists with files. Manually merge if needed.${NC}"
    echo -e "     Then run: rm -rf handlers/"
elif [ -d "handlers" ]; then
    echo -e "  Removing empty handlers/ folder"
    rmdir handlers 2>/dev/null || true
fi

if [ -d "middleware" ] && [ "$(ls -A middleware)" ]; then
    echo -e "  ${YELLOW}⚠️  middleware/ folder exists with files. Manually merge if needed.${NC}"
    echo -e "     Then run: rm -rf middleware/"
elif [ -d "middleware" ]; then
    echo -e "  Removing empty middleware/ folder"
    rmdir middleware 2>/dev/null || true
fi

# Delete binaries
echo -e "\n${BLUE}🗑️  Removing binaries...${NC}"
BINARIES=("main" "api-golang" "test_unified_schema" "verify_schema")
for binary in "${BINARIES[@]}"; do
    if [ -f "$binary" ]; then
        echo -e "  Removing $binary"
        rm -f "$binary"
    fi
done

# Remove old cmd/main.go if cmd/main.go exists
echo -e "\n${BLUE}🔄 Checking cmd structure...${NC}"
if [ -f "cmd/main.go" ] && [ -f "cmd/main.go" ]; then
    echo -e "  ${GREEN}✓ cmd/main.go exists${NC}"
    echo -e "  Removing old cmd/main.go"
    rm -f cmd/main.go
elif [ -f "cmd/main.go" ] && [ ! -f "cmd/main.go" ]; then
    echo -e "  Moving cmd/main.go → cmd/main.go"
    mv cmd/main.go cmd/main.go
fi

# Update go.mod if needed
echo -e "\n${BLUE}📦 Tidying dependencies...${NC}"
go mod tidy

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Migration Complete!                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Update import paths: ${YELLOW}goimports -w .${NC}"
echo -e "  2. Test compilation: ${YELLOW}go build cmd/main.go${NC}"
echo -e "  3. Run structure check: ${YELLOW}bash scripts/check-structure.sh${NC}"
echo -e "  4. Review changes and commit"

echo -e "\n${BLUE}🔍 Manual Review Required:${NC}"
echo -e "  • Check if handlers/ and middleware/ folders need manual merge"
echo -e "  • Verify all import paths are correct"
echo -e "  • Test that application still runs"

echo -e "\n${GREEN}Backup location: $BACKUP_DIR${NC}"
echo ""
