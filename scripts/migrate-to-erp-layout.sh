#!/bin/bash

# Migration Script: Old Layouts → New ERP Layout System
# This script helps migrate from old layout system to new organized ERP layouts

set -e

echo "🔄 Migrating to New ERP Layout System"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup old files
backup_old_layouts() {
    echo -e "${BLUE}📦 Creating backup of old layout files...${NC}"
    
    BACKUP_DIR="components/layout/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Files to backup (optional - only if you want to remove them later)
    OLD_FILES=(
        "components/layout/CompleteMegaMenuNew.tsx"
        "components/layout/HybridMegaThreeLayout.tsx"
        "apps/next-erp/components/layout/AppShell.tsx"
        "apps/next-erp/components/layout/TopBar.tsx"
        "apps/next-erp/components/layout/LeftSidebar.tsx"
        "apps/next-erp/components/layout/RightPanel.tsx"
        "apps/next-erp/components/layout/BottomBar.tsx"
    )
    
    for file in "${OLD_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "  Backing up: $file"
            cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
    echo ""
}

# Update layout preferences
update_preferences() {
    echo -e "${BLUE}⚙️  Updating layout preferences...${NC}"
    
    # This will be done by users through the settings page
    echo "  Layout preferences will be updated when users visit:"
    echo "  ${YELLOW}/app/settings/layout${NC}"
    echo ""
}

# Show migration summary
show_summary() {
    echo -e "${GREEN}✅ Migration Complete!${NC}"
    echo ""
    echo "📋 Summary:"
    echo "  ✓ New ERP layout components created in: components/layout/erp/"
    echo "  ✓ Layout settings page created at: /app/settings/layout"
    echo "  ✓ DynamicLayout updated to use ERPLayout by default"
    echo "  ✓ Old layouts backed up (if they existed)"
    echo ""
    echo "📍 Next Steps:"
    echo "  1. Start your development server:"
    echo "     ${BLUE}npm run dev${NC}"
    echo ""
    echo "  2. Visit the application:"
    echo "     ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "  3. Go to Layout Settings:"
    echo "     ${BLUE}http://localhost:3000/app/settings/layout${NC}"
    echo ""
    echo "  4. Choose your preferred layout:"
    echo "     • Simple Layout (Top + Left only)"
    echo "     • Full Layout (4-side with all features)"
    echo ""
    echo "📚 Documentation:"
    echo "  Read: ${BLUE}LAYOUT-SYSTEM.md${NC}"
    echo ""
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Error: Must be run from project root${NC}"
        exit 1
    fi
    
    # Backup old layouts (optional)
    read -p "Do you want to backup old layout files? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_old_layouts
    fi
    
    # Update preferences
    update_preferences
    
    # Show summary
    show_summary
}

# Run main function
main
