#!/bin/bash

echo "================================================"
echo "Fixing Supabase Imports Across Codebase"
echo "================================================"
echo ""

# List of files to fix
FILES=(
  "components/loyalty/LoyaltyDashboard.tsx"
  "components/settings/EmailManagement.tsx"
  "components/delivery/DeliveryManagement.tsx"
  "components/inventory/CSVImport.tsx"
  "components/marketing/InstagramCampaign.tsx"
  "components/marketing/SMSCampaign.tsx"
  "components/marketing/EmailCampaign.tsx"
  "components/marketing/FacebookCampaign.tsx"
  "components/marketing/SocialMediaCampaign.tsx"
  "components/marketing/WhatsAppCampaign.tsx"
  "components/prescriptions/PrescriptionsList.tsx"
  "components/loyalty/LoyaltyProgramSettings.tsx"
  "hooks/useProductionConfig.ts"
  "components/prescriptions/RefillReminders.tsx"
)

cd /var/www/homeopathy-business-platform

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ Fixing: $file"
    
    # Replace supabase import with golangAPI import
    sed -i 's|import { supabase } from "@/integrations/supabase/client";|import { golangAPI } from "@/lib/api";|g' "$file"
    
    # Also check for any direct supabase usage patterns
    # This will need manual review but we'll flag them
    if grep -q "supabase\." "$file"; then
      echo "  ⚠  WARNING: File still contains 'supabase.' usage - needs manual review"
    fi
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "================================================"
echo "✅ Import Replacement Complete"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Review each file for 'supabase.' method calls"
echo "2. Replace with appropriate golangAPI calls"
echo "3. Test each component individually"
echo ""
echo "Common replacements needed:"
echo "  supabase.from('table').select() → golangAPI.get('/api/erp/resource')"
echo "  supabase.from('table').insert() → golangAPI.post('/api/erp/resource', data)"
echo "  supabase.from('table').update() → golangAPI.put('/api/erp/resource/:id', data)"
echo "  supabase.from('table').delete() → golangAPI.delete('/api/erp/resource/:id')"
echo ""
