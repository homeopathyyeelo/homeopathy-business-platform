#!/bin/bash
echo "🧪 Testing All Dashboard Routes..."
echo "=================================="

routes=(
  "dashboard"
  "products"
  "customers"
  "pos"
  "inventory"
  "analytics"
  "purchases"
  "finance"
  "marketing"
  "ai-insights"
  "crm"
  "prescriptions"
  "sales"
  "reports"
  "settings"
  "notifications"
  "hr"
  "warehouse"
  "manufacturing"
  "schemes"
  "user"
  "daily-register"
  "active-batches"
  "ai-campaigns"
  "ai-chat"
  "ai-demos"
  "retail-pos"
  "quick-stats"
)

success=0
failed=0

for route in "${routes[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$route")
  if [ "$response" = "200" ]; then
    echo "✅ /$route - OK"
    ((success++))
  else
    echo "❌ /$route - Failed ($response)"
    ((failed++))
  fi
done

echo ""
echo "=================================="
echo "✅ Success: $success/$((success + failed))"
echo "❌ Failed: $failed/$((success + failed))"
