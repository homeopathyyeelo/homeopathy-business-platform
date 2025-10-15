#!/bin/bash
cd /var/www/homeopathy-business-platform/app/\(dashboard\)

# Create proper page template
create_page() {
  local folder=$1
  local componentName=$2
  local title=$3
  local icon=$4
  local desc=$5
  
  cat > "$folder/page.tsx" << 'PAGEFILE'
"use client"

export default function COMPONENT_NAME() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ICON_HERE TITLE_HERE</h1>
        <p className="text-gray-500 mt-1">DESC_HERE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total</div>
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
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">₹0</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">ICON_HERE</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">TITLE_HERE</div>
          <div className="text-gray-500 mb-6">DESC_HERE</div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
PAGEFILE

  sed -i "s/COMPONENT_NAME/$componentName/g" "$folder/page.tsx"
  sed -i "s/ICON_HERE/$icon/g" "$folder/page.tsx"
  sed -i "s/TITLE_HERE/$title/g" "$folder/page.tsx"
  sed -i "s/DESC_HERE/$desc/g" "$folder/page.tsx"
}

# Create all pages with proper component names
create_page "analytics" "AnalyticsPage" "Analytics" "📈" "Business insights and performance metrics"
create_page "purchases" "PurchasesPage" "Purchase Orders" "🛒" "Manage vendor orders and procurement"
create_page "finance" "FinancePage" "Finance" "💵" "Invoices, payments, and financial tracking"
create_page "marketing" "MarketingPage" "Marketing" "📢" "Promotions and customer engagement"
create_page "ai-insights" "AIInsightsPage" "AI Insights" "🤖" "ML-powered predictions"
create_page "crm" "CRMPage" "CRM" "🎯" "Customer relationship management"
create_page "prescriptions" "PrescriptionsPage" "Prescriptions" "📝" "Medical prescriptions"
create_page "sales" "SalesPage" "Sales" "💰" "Sales tracking"
create_page "reports" "ReportsPage" "Reports" "📊" "Business reports"
create_page "settings" "SettingsPage" "Settings" "⚙️" "System settings"
create_page "notifications" "NotificationsPage" "Notifications" "🔔" "Alerts and notifications"
create_page "hr" "HRPage" "HR" "👔" "Human resources"
create_page "warehouse" "WarehousePage" "Warehouse" "🏭" "Warehouse management"
create_page "manufacturing" "ManufacturingPage" "Manufacturing" "🏭" "Production management"
create_page "schemes" "SchemesPage" "Schemes" "🎁" "Loyalty programs"
create_page "user" "UserPage" "Profile" "👤" "User profile"
create_page "daily-register" "DailyRegisterPage" "Daily Register" "📅" "Daily transactions"
create_page "active-batches" "ActiveBatchesPage" "Active Batches" "📦" "Batch tracking"
create_page "ai-campaigns" "AICampaignsPage" "AI Campaigns" "🤖" "AI marketing"
create_page "ai-chat" "AIChatPage" "AI Chat" "💬" "AI assistant"
create_page "ai-demos" "AIDemosPage" "AI Demos" "🎮" "AI demonstrations"
create_page "retail-pos" "RetailPOSPage" "Retail POS" "🏪" "Retail point of sale"
create_page "quick-stats" "QuickStatsPage" "Quick Stats" "⚡" "Real-time metrics"

echo "✅ Fixed all 23 pages!"
