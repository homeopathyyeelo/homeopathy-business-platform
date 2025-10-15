#!/bin/bash

# Script to create all missing dashboard pages
cd "$(dirname "$0")"

echo "🎨 Creating all dashboard pages..."

# Array of pages to create
pages=(
  "inventory:📋 Inventory:Stock management and tracking"
  "analytics:📈 Analytics:Business reports and insights"
  "purchases:🛒 Purchases:Purchase orders and vendors"
  "finance:💵 Finance:Billing and payments"
  "marketing:📢 Marketing:Campaigns and promotions"
  "ai-insights:🤖 AI Insights:ML predictions and recommendations"
  "crm:🎯 CRM:Advanced customer management"
  "prescriptions:📝 Prescriptions:Medical prescriptions"
  "sales:💰 Sales:Sales tracking and orders"
  "reports:📊 Reports:Business reports"
  "settings:⚙️ Settings:System settings"
  "notifications:🔔 Notifications:System notifications"
  "hr:👔 HR:Human resources"
  "warehouse:🏭 Warehouse:Warehouse management"
  "manufacturing:🏭 Manufacturing:Production management"
  "schemes:🎁 Schemes:Loyalty and schemes"
  "user:👤 User:User profile"
  "daily-register:📅 Daily Register:Daily transactions"
  "active-batches:📦 Active Batches:Batch tracking"
  "ai-campaigns:🤖 AI Campaigns:AI-powered campaigns"
  "ai-chat:💬 AI Chat:AI assistant"
  "ai-demos:🎮 AI Demos:AI demonstrations"
  "retail-pos:🏪 Retail POS:Retail point of sale"
  "quick-stats:⚡ Quick Stats:Quick statistics"
)

for page_info in "${pages[@]}"; do
  IFS=':' read -r folder icon title description <<< "$page_info"
  
  echo "Creating $folder page..."
  
  cat > "app/(dashboard)/$folder/page.tsx" << 'PAGEFILE'
"use client"

import { useState, useEffect } from "react"

export default function PAGE_NAME() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PAGE_TITLE</h1>
        <p className="text-gray-500 mt-1">PAGE_DESCRIPTION</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">0</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">PAGE_ICON</div>
          <div className="text-xl font-medium">PAGE_TITLE Module</div>
          <div className="mt-2">This module is ready for development</div>
          <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
PAGEFILE

  # Replace placeholders
  sed -i "s/PAGE_NAME/${folder^}Page/g" "app/(dashboard)/$folder/page.tsx"
  sed -i "s/PAGE_TITLE/$title/g" "app/(dashboard)/$folder/page.tsx"
  sed -i "s/PAGE_DESCRIPTION/$description/g" "app/(dashboard)/$folder/page.tsx"
  sed -i "s/PAGE_ICON/$icon/g" "app/(dashboard)/$folder/page.tsx"
  
  echo "✅ Created $folder"
done

echo ""
echo "🎉 All pages created!"
echo "📊 Total pages: 27"
echo ""
echo "Test them:"
echo "http://localhost:3000/inventory"
echo "http://localhost:3000/analytics"
echo "http://localhost:3000/finance"
echo "... and 24 more!"
