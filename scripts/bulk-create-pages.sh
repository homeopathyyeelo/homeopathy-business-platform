#!/bin/bash

# Bulk create all missing pages for complete ERP

create_page() {
  local path=$1
  local title=$2
  local desc=$3
  local api=$4
  
  local file="app/$path/page.tsx"
  local dir=$(dirname "$file")
  
  mkdir -p "$dir"
  
  if [ ! -f "$file" ]; then
    cat > "$file" << 'PAGEEOF'
'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';

export default function PAGE_TITLE_PLACEHOLDERPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('API_PLACEHOLDER')
      .then(res => res.json())
      .then(data => {
        setData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'createdAt', title: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">TITLE_PLACEHOLDER</h1>
        <p className="text-gray-600">DESC_PLACEHOLDER</p>
      </div>

      <DataTable
        title="TITLE_PLACEHOLDER"
        columns={columns}
        data={data}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
PAGEEOF

    # Replace placeholders
    sed -i "s/PAGE_TITLE_PLACEHOLDER/${title//[^a-zA-Z]/}/g" "$file"
    sed -i "s|API_PLACEHOLDER|$api|g" "$file"
    sed -i "s/TITLE_PLACEHOLDER/$title/g" "$file"
    sed -i "s/DESC_PLACEHOLDER/$desc/g" "$file"
    
    echo "✅ Created: $path"
  fi
}

# HR Module
create_page "hr/employees" "Employee List" "All staff" "/api/hr/employees"
create_page "hr/roles" "Roles & Permissions" "RBAC" "/api/hr/roles"
create_page "hr/attendance" "Attendance" "Check-in/out" "/api/hr/attendance"
create_page "hr/leaves" "Leave Management" "Leave requests" "/api/hr/leaves"
create_page "hr/shifts" "Shift Scheduling" "Shift roster" "/api/hr/shifts"
create_page "hr/payroll" "Payroll" "Salary" "/api/hr/payroll"
create_page "hr/incentives" "Incentives" "Commission" "/api/hr/incentives"
create_page "hr/performance" "Performance" "Tracking" "/api/hr/performance"
create_page "hr/activity" "Activity Log" "Audit" "/api/hr/activity"

# Finance Module
create_page "finance/sales-ledger" "Sales Ledger" "Sales accounts" "/api/finance/sales-ledger"
create_page "finance/purchase-ledger" "Purchase Ledger" "Purchase accounts" "/api/finance/purchase-ledger"
create_page "finance/cashbook" "Cash Book" "Cash transactions" "/api/finance/cashbook"
create_page "finance/bankbook" "Bank Book" "Bank transactions" "/api/finance/bankbook"
create_page "finance/expenses" "Expenses" "Expense management" "/api/finance/expenses"
create_page "finance/petty-cash" "Petty Cash" "Small cash" "/api/finance/petty-cash"
create_page "finance/gst" "GST Reports" "Tax reports" "/api/finance/gst"
create_page "finance/pl" "P&L" "Profit & Loss" "/api/finance/pl"
create_page "finance/balance-sheet" "Balance Sheet" "Balance sheet" "/api/finance/balance-sheet"
create_page "finance/trial-balance" "Trial Balance" "Trial balance" "/api/finance/trial-balance"
create_page "finance/payment-vouchers" "Payment Vouchers" "Payments" "/api/finance/payment-vouchers"
create_page "finance/receipt-vouchers" "Receipt Vouchers" "Receipts" "/api/finance/receipt-vouchers"
create_page "finance/bank-reconciliation" "Bank Reconciliation" "Reconcile" "/api/finance/bank-reconciliation"

# Reports Module
create_page "reports/sales" "Sales Reports" "Sales analytics" "/api/reports/sales"
create_page "reports/purchase" "Purchase Reports" "Purchase data" "/api/reports/purchase"
create_page "reports/stock" "Stock Reports" "Inventory" "/api/reports/stock"
create_page "reports/batch-expiry" "Batch & Expiry" "Expiry tracking" "/api/reports/batch-expiry"
create_page "reports/profit" "Profit Analysis" "Profit metrics" "/api/reports/profit"
create_page "reports/gst" "GST Reports" "Tax reports" "/api/reports/gst"
create_page "reports/customers" "Customer Reports" "Customer data" "/api/reports/customers"
create_page "reports/vendors" "Vendor Reports" "Vendor data" "/api/reports/vendors"
create_page "reports/employees" "Employee Reports" "HR reports" "/api/reports/employees"
create_page "reports/financial" "Financial Statements" "Financials" "/api/reports/financial"
create_page "reports/custom" "Custom Reports" "Report builder" "/api/reports/custom"

# Marketing Module
create_page "marketing/whatsapp" "WhatsApp Campaign" "Bulk WhatsApp" "/api/marketing/whatsapp"
create_page "marketing/sms" "SMS Campaign" "SMS bulk" "/api/marketing/sms"
create_page "marketing/email" "Email Campaign" "Email marketing" "/api/marketing/email"
create_page "marketing/offers" "Offers & Coupons" "Promotions" "/api/marketing/offers"
create_page "marketing/segments" "Customer Segments" "Segmentation" "/api/marketing/segments"
create_page "marketing/followup" "Auto Follow-up" "Auto messages" "/api/marketing/followup"
create_page "marketing/festival" "Festival Campaigns" "Seasonal" "/api/marketing/festival"
create_page "marketing/announcements" "Dealer Announcements" "Dealer comms" "/api/marketing/announcements"
create_page "marketing/templates" "Templates" "Message templates" "/api/marketing/templates"

# Social Media Module
create_page "social/gmb" "GMB Scheduler" "Google My Business" "/api/social/gmb"
create_page "social/instagram" "Instagram/Facebook" "Social posts" "/api/social/instagram"
create_page "social/youtube" "YouTube" "Video posts" "/api/social/youtube"
create_page "social/wordpress" "WordPress" "Blog auto-publish" "/api/social/wordpress"
create_page "social/ai-content" "AI Content Gen" "Auto content" "/api/social/ai-content"
create_page "social/hashtags" "Hashtags/SEO" "Keywords" "/api/social/hashtags"
create_page "social/accounts" "Multi-Account" "Manage accounts" "/api/social/accounts"

# CRM Module
create_page "crm/tickets" "Tickets" "Complaint system" "/api/crm/tickets"
create_page "crm/reminders" "Follow-up Reminders" "Auto reminders" "/api/crm/reminders"
create_page "crm/appointments" "Appointments" "Booking system" "/api/crm/appointments"
create_page "crm/chat" "Chat" "WhatsApp/Web" "/api/crm/chat"
create_page "crm/history" "Interaction History" "Customer interactions" "/api/crm/history"
create_page "crm/feedback" "Feedback" "Collect feedback" "/api/crm/feedback"
create_page "crm/chatbot" "AI Chatbot" "AI integration" "/api/crm/chatbot"

# AI Module
create_page "ai/chat" "AI Chat" "Business assistant" "/api/ai/chat"
create_page "ai/product-suggestions" "Product Suggestions" "Cross-sell" "/api/ai/product-suggestions"
create_page "ai/forecasting" "Demand Forecasting" "Predict demand" "/api/ai/forecasting"
create_page "ai/po-generator" "PO Generator" "Auto PO" "/api/ai/po-generator"
create_page "ai/sales-insights" "Sales Insights" "AI analytics" "/api/ai/sales-insights"
create_page "ai/pricing" "Price Optimization" "Dynamic pricing" "/api/ai/pricing"
create_page "ai/content" "Content Writer" "Posts/Blogs" "/api/ai/content"
create_page "ai/segmentation" "Customer Segmentation" "AI segments" "/api/ai/segmentation"
create_page "ai/health" "Health Suggestions" "Doctor support" "/api/ai/health"
create_page "ai/automation" "Workflow Automation" "Auto workflows" "/api/ai/automation"

# Analytics Module
create_page "analytics/kpi" "KPI Dashboards" "Key metrics" "/api/analytics/kpi"
create_page "analytics/sales-purchase" "Sales vs Purchase" "Comparison" "/api/analytics/sales-purchase"
create_page "analytics/products" "Product Performance" "Product metrics" "/api/analytics/products"
create_page "analytics/ltv" "Customer LTV" "Lifetime value" "/api/analytics/ltv"
create_page "analytics/forecasting" "Forecasting" "AI forecasts" "/api/analytics/forecasting"
create_page "analytics/branches" "Branch Comparison" "Branch performance" "/api/analytics/branches"
create_page "analytics/marketing-roi" "Marketing ROI" "Marketing metrics" "/api/analytics/marketing-roi"
create_page "analytics/expense-profit" "Expense vs Profit" "Financial graphs" "/api/analytics/expense-profit"

# AI Campaigns Module
create_page "ai-campaigns/create" "Create Campaign" "AI-generated" "/api/ai-campaigns/create"
create_page "ai-campaigns/multi-channel" "Multi-Channel" "Deploy everywhere" "/api/ai-campaigns/multi-channel"
create_page "ai-campaigns/auto-content" "Auto Content" "Content + Images" "/api/ai-campaigns/auto-content"
create_page "ai-campaigns/schedule" "Scheduling" "Trigger-based" "/api/ai-campaigns/schedule"
create_page "ai-campaigns/performance" "Performance" "Campaign analysis" "/api/ai-campaigns/performance"

# AI Insights Module
create_page "ai-insights/daily" "Daily Summary" "Auto summary" "/api/ai-insights/daily"
create_page "ai-insights/products" "Product Performance" "Top/Low products" "/api/ai-insights/products"
create_page "ai-insights/actions" "Action Suggestions" "Reorder/Discount" "/api/ai-insights/actions"
create_page "ai-insights/cashflow" "Cash Flow" "Predictions" "/api/ai-insights/cashflow"
create_page "ai-insights/profit-leaks" "Profit Leaks" "AI alerts" "/api/ai-insights/profit-leaks"
create_page "ai-insights/customer-behavior" "Customer Behavior" "Insights" "/api/ai-insights/customer-behavior"

# AI Lab Module
create_page "ai-lab/test" "Test Features" "Experiment" "/api/ai-lab/test"
create_page "ai-lab/playground" "Prompt Playground" "Test prompts" "/api/ai-lab/playground"
create_page "ai-lab/models" "Model Comparisons" "Compare LLMs" "/api/ai-lab/models"
create_page "ai-lab/training" "Data Training" "Train models" "/api/ai-lab/training"
create_page "ai-lab/integration" "LLM Integration" "Test APIs" "/api/ai-lab/integration"
create_page "ai-lab/fine-tune" "Fine-tune" "Domain models" "/api/ai-lab/fine-tune"

# Settings Module
create_page "settings/company" "Company Profile" "Company info" "/api/settings/company"
create_page "settings/branches" "Branch Management" "Stores" "/api/settings/branches"
create_page "settings/roles" "Roles & Permissions" "Access control" "/api/settings/roles"
create_page "settings/tax" "Tax/GST Config" "Tax settings" "/api/settings/tax"
create_page "settings/units" "Units & Measures" "UOM" "/api/settings/units"
create_page "settings/payments" "Payment Methods" "Payment options" "/api/settings/payments"
create_page "settings/gateway" "Email/WhatsApp Gateway" "API settings" "/api/settings/gateway"
create_page "settings/ai-models" "AI Model Selection" "Choose AI" "/api/settings/ai-models"
create_page "settings/backup" "Backup & Restore" "Data backup" "/api/settings/backup"
create_page "settings/notifications" "Notifications" "Alert preferences" "/api/settings/notifications"
create_page "settings/integrations" "Integrations" "API keys" "/api/settings/integrations"

echo ""
echo "✅ Complete! Total pages: $(find app -name 'page.tsx' | wc -l)"
