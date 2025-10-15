#!/bin/bash
cd /var/www/homeopathy-business-platform/app/\(dashboard\)

# Create simple page template function
create_page() {
  local folder=$1
  local title=$2
  local icon=$3
  local description=$4
  
  cat > "$folder/page.tsx" << PAGEFILE
"use client"

export default function ${title// /}Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">$icon $title</h1>
        <p className="text-gray-500 mt-1">$description</p>
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
          <div className="text-6xl mb-4">$icon</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">$title Module</div>
          <div className="text-gray-500 mb-6">$description</div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
PAGEFILE
}

# Create all pages
create_page "inventory" "Inventory Management" "📋" "Track stock levels and manage warehouse"
create_page "analytics" "Analytics & Reports" "📈" "Business insights and performance metrics"
create_page "purchases" "Purchase Orders" "🛒" "Manage vendor orders and procurement"
create_page "finance" "Finance & Billing" "💵" "Invoices, payments, and financial tracking"
create_page "marketing" "Marketing Campaigns" "📢" "Promotions and customer engagement"
create_page "ai-insights" "AI Insights" "🤖" "ML-powered predictions and recommendations"
create_page "crm" "CRM" "🎯" "Advanced customer relationship management"
create_page "prescriptions" "Prescriptions" "📝" "Medical prescriptions and consultations"
create_page "sales" "Sales Tracking" "💰" "Sales orders and revenue tracking"
create_page "reports" "Business Reports" "��" "Comprehensive business reports"
create_page "settings" "System Settings" "⚙️" "Configure system preferences"
create_page "notifications" "Notifications" "🔔" "System alerts and notifications"
create_page "hr" "Human Resources" "👔" "Employee management and payroll"
create_page "warehouse" "Warehouse Management" "🏭" "Warehouse operations and logistics"
create_page "manufacturing" "Manufacturing" "🏭" "Production and quality control"
create_page "schemes" "Loyalty & Schemes" "🎁" "Customer loyalty programs"
create_page "user" "User Profile" "👤" "Manage your account and preferences"
create_page "daily-register" "Daily Register" "📅" "Daily transaction records"
create_page "active-batches" "Active Batches" "📦" "Track product batches and expiry"
create_page "ai-campaigns" "AI Campaigns" "🤖" "AI-powered marketing automation"
create_page "ai-chat" "AI Assistant" "💬" "Chat with AI for business insights"
create_page "ai-demos" "AI Demonstrations" "🎮" "Explore AI capabilities"
create_page "retail-pos" "Retail POS" "🏪" "Retail point of sale system"
create_page "quick-stats" "Quick Statistics" "⚡" "Real-time business metrics"

echo "✅ Created 24 pages!"
