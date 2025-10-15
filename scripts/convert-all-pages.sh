#!/bin/bash

# Script to convert all React pages to Next.js pages
# Preserving all business logic and components

SOURCE_DIR="/var/www/homeopathy-business-platform/homeopathy-erp-nexus-main/src/pages"
TARGET_DIR="/var/www/homeopathy-business-platform/app"

echo "🔄 Converting ALL React pages to Next.js..."
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo ""

# List of all pages to convert
PAGES=(
  "Customers"
  "DailyBilling"
  "Delivery"
  "Email"
  "Features"
  "GST"
  "LoyaltyProgram"
  "Marketing"
  "Prescriptions"
  "Reports"
  "Settings"
  "BusinessIntelligence"
)

for PAGE in "${PAGES[@]}"; do
  SOURCE_FILE="$SOURCE_DIR/${PAGE}.tsx"
  TARGET_FILE="$TARGET_DIR/$(echo $PAGE | tr '[:upper:]' '[:lower:]' | sed 's/dailybilling/daily-billing/; s/loyaltyprogram/loyalty/; s/businessintelligence/analytics/')/page.tsx"
  
  if [ -f "$SOURCE_FILE" ]; then
    echo "✅ Found: $PAGE"
    
    # Create target directory if it doesn't exist
    mkdir -p "$(dirname "$TARGET_FILE")"
    
    # Check if target already exists
    if [ -f "$TARGET_FILE" ]; then
      echo "   ⚠️  Target exists - will need manual review"
    else
      echo "   📝 Target: $TARGET_FILE"
    fi
  else
    echo "❌ Not found: $PAGE"
  fi
done

echo ""
echo "✅ Conversion mapping complete!"
echo ""
echo "Next steps:"
echo "1. Review each page for React Router → Next.js navigation changes"
echo "2. Update useNavigate() → useRouter() from 'next/navigation'"
echo "3. Ensure all components are marked with 'use client'"
echo "4. Update database hooks to use API routes"
