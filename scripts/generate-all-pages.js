#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All pages to generate
const pages = [
  // Products Module (10 pages)
  { path: 'products', title: 'Product List', desc: 'View all products', api: '/api/products' },
  { path: 'products/add', title: 'Add Product', desc: 'Create new product', api: '/api/products' },
  { path: 'products/categories', title: 'Categories', desc: 'Manage categories', api: '/api/products/categories' },
  { path: 'products/brands', title: 'Brands', desc: 'Manage brands', api: '/api/products/brands' },
  { path: 'products/batches', title: 'Batches', desc: 'Batch management', api: '/api/products/batches' },
  { path: 'products/barcodes', title: 'Barcodes', desc: 'Generate barcodes', api: '/api/products/barcodes' },
  { path: 'products/pricing', title: 'Price Management', desc: 'Manage pricing', api: '/api/products/pricing' },
  { path: 'products/tax', title: 'Tax Settings', desc: 'GST configuration', api: '/api/products/tax' },
  { path: 'products/variants', title: 'Product Variants', desc: 'Size, potency', api: '/api/products/variants' },
  { path: 'products/import-export', title: 'Import/Export', desc: 'Bulk operations', api: '/api/products/import' },

  // Inventory Module (10 pages)
  { path: 'inventory', title: 'Inventory Dashboard', desc: 'Overview', api: '/api/inventory' },
  { path: 'inventory/stock', title: 'Stock List', desc: 'All stock', api: '/api/inventory/stock' },
  { path: 'inventory/batches', title: 'Batch Tracking', desc: 'Track batches', api: '/api/inventory/batches' },
  { path: 'inventory/adjustments', title: 'Stock Adjustments', desc: 'Adjust stock', api: '/api/inventory/adjustments' },
  { path: 'inventory/transfers', title: 'Stock Transfers', desc: 'Branch transfers', api: '/api/inventory/transfers' },
  { path: 'inventory/reconciliation', title: 'Reconciliation', desc: 'Stock audit', api: '/api/inventory/reconciliation' },
  { path: 'inventory/low-stock', title: 'Low Stock', desc: 'Alerts', api: '/api/inventory/low-stock' },
  { path: 'inventory/dead-stock', title: 'Dead Stock', desc: 'Non-moving items', api: '/api/inventory/dead-stock' },
  { path: 'inventory/valuation', title: 'Stock Valuation', desc: 'Real-time value', api: '/api/inventory/valuation' },
  { path: 'inventory/history', title: 'History Log', desc: 'All changes', api: '/api/inventory/history' },

  // Sales Module (11 pages)
  { path: 'sales/b2c', title: 'B2C Sales', desc: 'Retail billing', api: '/api/sales/b2c' },
  { path: 'sales/b2b', title: 'B2B Sales', desc: 'Dealer sales', api: '/api/sales/b2b' },
  { path: 'sales/d2d', title: 'D2D Sales', desc: 'Dealer to dealer', api: '/api/sales/d2d' },
  { path: 'sales/orders', title: 'Sales Orders', desc: 'Quotations', api: '/api/sales/orders' },
  { path: 'sales/invoices', title: 'Sales Invoices', desc: 'All invoices', api: '/api/sales/invoices' },
  { path: 'sales/credit', title: 'Credit Sales', desc: 'Due management', api: '/api/sales/credit' },
  { path: 'sales/returns', title: 'Sales Returns', desc: 'Credit notes', api: '/api/sales/returns' },
  { path: 'sales/receipts', title: 'Receipts', desc: 'Payments', api: '/api/sales/receipts' },
  { path: 'sales/e-invoice', title: 'e-Invoice', desc: 'Digital invoices', api: '/api/sales/e-invoice' },
  { path: 'sales/history', title: 'Sales History', desc: 'Customer-wise', api: '/api/sales/history' },

  // Purchases Module (9 pages)
  { path: 'purchases/grn', title: 'GRN', desc: 'Goods receipt notes', api: '/api/purchases/grn' },
  { path: 'purchases/bills', title: 'Purchase Bills', desc: 'Invoices', api: '/api/purchases/bills' },
  { path: 'purchases/payments', title: 'Vendor Payments', desc: 'Pay vendors', api: '/api/purchases/payments' },
  { path: 'purchases/returns', title: 'Purchase Returns', desc: 'Returns', api: '/api/purchases/returns' },
  { path: 'purchases/price-comparison', title: 'Price Comparison', desc: 'Vendor-wise', api: '/api/purchases/price-comparison' },
  { path: 'purchases/history', title: 'Purchase History', desc: 'All purchases', api: '/api/purchases/history' },
  { path: 'purchases/credit', title: 'Credit Management', desc: 'Vendor credit', api: '/api/purchases/credit' },
  { path: 'purchases/ai-reorder', title: 'AI Reorder', desc: 'Auto suggestions', api: '/api/purchases/ai-reorder' },

  // Customers Module (9 pages)
  { path: 'customers/groups', title: 'Customer Groups', desc: 'Retail/B2B/VIP', api: '/api/customers/groups' },
  { path: 'customers/contacts', title: 'Contact Details', desc: 'Manage contacts', api: '/api/customers/contacts' },
  { path: 'customers/history', title: 'Purchase History', desc: 'Past orders', api: '/api/customers/history' },
  { path: 'customers/loyalty', title: 'Loyalty Points', desc: 'Points program', api: '/api/loyalty' },
  { path: 'customers/outstanding', title: 'Outstanding', desc: 'Credit limits', api: '/api/customers/outstanding' },
  { path: 'customers/feedback', title: 'Feedback', desc: 'Reviews', api: '/api/customers/feedback' },
  { path: 'customers/gst', title: 'GST Details', desc: 'Tax info', api: '/api/customers/gst' },
  { path: 'customers/addresses', title: 'Address Book', desc: 'Addresses', api: '/api/customers/addresses' },
  { path: 'customers/communication', title: 'Communication', desc: 'WhatsApp/SMS', api: '/api/customers/communication' },

  // Vendors Module (9 pages)
  { path: 'vendors/types', title: 'Vendor Types', desc: 'Mfg/Distributor', api: '/api/vendors/types' },
  { path: 'vendors/contacts', title: 'Contact Details', desc: 'Manage contacts', api: '/api/vendors/contacts' },
  { path: 'vendors/history', title: 'Purchase History', desc: 'Past purchases', api: '/api/vendors/history' },
  { path: 'vendors/payment-terms', title: 'Payment Terms', desc: 'Terms', api: '/api/vendors/payment-terms' },
  { path: 'vendors/credit', title: 'Credit Management', desc: 'Vendor credit', api: '/api/vendors/credit' },
  { path: 'vendors/outstanding', title: 'Outstanding', desc: 'Ledger', api: '/api/vendors/outstanding' },
  { path: 'vendors/contracts', title: 'Contracts', desc: 'Agreements', api: '/api/vendors/contracts' },
  { path: 'vendors/performance', title: 'Performance', desc: 'Rating', api: '/api/vendors/performance' },

  // HR Module (9 pages)
  { path: 'hr/employees', title: 'Employee List', desc: 'All staff', api: '/api/hr/employees' },
  { path: 'hr/roles', title: 'Roles & Permissions', desc: 'RBAC', api: '/api/hr/roles' },
  { path: 'hr/attendance', title: 'Attendance', desc: 'Check-in/out', api: '/api/hr/attendance' },
  { path: 'hr/leaves', title: 'Leave Management', desc: 'Leave requests', api: '/api/hr/leaves' },
  { path: 'hr/shifts', title: 'Shift Scheduling', desc: 'Shift roster', api: '/api/hr/shifts' },
  { path: 'hr/payroll', title: 'Payroll', desc: 'Salary', api: '/api/hr/payroll' },
  { path: 'hr/incentives', title: 'Incentives', desc: 'Commission', api: '/api/hr/incentives' },
  { path: 'hr/performance', title: 'Performance', desc: 'Tracking', api: '/api/hr/performance' },
  { path: 'hr/activity', title: 'Activity Log', desc: 'Audit', api: '/api/hr/activity' },

  // Finance Module (13 pages)
  { path: 'finance/sales-ledger', title: 'Sales Ledger', desc: 'Sales accounts', api: '/api/finance/sales-ledger' },
  { path: 'finance/purchase-ledger', title: 'Purchase Ledger', desc: 'Purchase accounts', api: '/api/finance/purchase-ledger' },
  { path: 'finance/cashbook', title: 'Cash Book', desc: 'Cash transactions', api: '/api/finance/cashbook' },
  { path: 'finance/bankbook', title: 'Bank Book', desc: 'Bank transactions', api: '/api/finance/bankbook' },
  { path: 'finance/expenses', title: 'Expenses', desc: 'Expense management', api: '/api/finance/expenses' },
  { path: 'finance/petty-cash', title: 'Petty Cash', desc: 'Small cash', api: '/api/finance/petty-cash' },
  { path: 'finance/gst', title: 'GST Reports', desc: 'Tax reports', api: '/api/finance/gst' },
  { path: 'finance/pl', title: 'P&L', desc: 'Profit & Loss', api: '/api/finance/pl' },
  { path: 'finance/balance-sheet', title: 'Balance Sheet', desc: 'Balance sheet', api: '/api/finance/balance-sheet' },
  { path: 'finance/trial-balance', title: 'Trial Balance', desc: 'Trial balance', api: '/api/finance/trial-balance' },
  { path: 'finance/payment-vouchers', title: 'Payment Vouchers', desc: 'Payments', api: '/api/finance/payment-vouchers' },
  { path: 'finance/receipt-vouchers', title: 'Receipt Vouchers', desc: 'Receipts', api: '/api/finance/receipt-vouchers' },
  { path: 'finance/bank-reconciliation', title: 'Bank Reconciliation', desc: 'Reconcile', api: '/api/finance/bank-reconciliation' },

  // Reports Module (11 pages)
  { path: 'reports/sales', title: 'Sales Reports', desc: 'Sales analytics', api: '/api/reports/sales' },
  { path: 'reports/purchase', title: 'Purchase Reports', desc: 'Purchase data', api: '/api/reports/purchase' },
  { path: 'reports/stock', title: 'Stock Reports', desc: 'Inventory', api: '/api/reports/stock' },
  { path: 'reports/batch-expiry', title: 'Batch & Expiry', desc: 'Expiry tracking', api: '/api/reports/batch-expiry' },
  { path: 'reports/profit', title: 'Profit Analysis', desc: 'Profit metrics', api: '/api/reports/profit' },
  { path: 'reports/gst', title: 'GST Reports', desc: 'Tax reports', api: '/api/reports/gst' },
  { path: 'reports/customers', title: 'Customer Reports', desc: 'Customer data', api: '/api/reports/customers' },
  { path: 'reports/vendors', title: 'Vendor Reports', desc: 'Vendor data', api: '/api/reports/vendors' },
  { path: 'reports/employees', title: 'Employee Reports', desc: 'HR reports', api: '/api/reports/employees' },
  { path: 'reports/financial', title: 'Financial Statements', desc: 'Financials', api: '/api/reports/financial' },
  { path: 'reports/custom', title: 'Custom Reports', desc: 'Report builder', api: '/api/reports/custom' },

  // Marketing Module (9 pages)
  { path: 'marketing/whatsapp', title: 'WhatsApp Campaign', desc: 'Bulk WhatsApp', api: '/api/marketing/whatsapp' },
  { path: 'marketing/sms', title: 'SMS Campaign', desc: 'SMS bulk', api: '/api/marketing/sms' },
  { path: 'marketing/email', title: 'Email Campaign', desc: 'Email marketing', api: '/api/marketing/email' },
  { path: 'marketing/offers', title: 'Offers & Coupons', desc: 'Promotions', api: '/api/marketing/offers' },
  { path: 'marketing/segments', title: 'Customer Segments', desc: 'Segmentation', api: '/api/marketing/segments' },
  { path: 'marketing/followup', title: 'Auto Follow-up', desc: 'Auto messages', api: '/api/marketing/followup' },
  { path: 'marketing/festival', title: 'Festival Campaigns', desc: 'Seasonal', api: '/api/marketing/festival' },
  { path: 'marketing/announcements', title: 'Dealer Announcements', desc: 'Dealer comms', api: '/api/marketing/announcements' },
  { path: 'marketing/templates', title: 'Templates', desc: 'Message templates', api: '/api/marketing/templates' },

  // Social Media Module (7 pages)
  { path: 'social/gmb', title: 'GMB Scheduler', desc: 'Google My Business', api: '/api/social/gmb' },
  { path: 'social/instagram', title: 'Instagram/Facebook', desc: 'Social posts', api: '/api/social/instagram' },
  { path: 'social/youtube', title: 'YouTube', desc: 'Video posts', api: '/api/social/youtube' },
  { path: 'social/wordpress', title: 'WordPress', desc: 'Blog auto-publish', api: '/api/social/wordpress' },
  { path: 'social/ai-content', title: 'AI Content Gen', desc: 'Auto content', api: '/api/social/ai-content' },
  { path: 'social/hashtags', title: 'Hashtags/SEO', desc: 'Keywords', api: '/api/social/hashtags' },
  { path: 'social/accounts', title: 'Multi-Account', desc: 'Manage accounts', api: '/api/social/accounts' },

  // CRM Module (7 pages)
  { path: 'crm/tickets', title: 'Tickets', desc: 'Complaint system', api: '/api/crm/tickets' },
  { path: 'crm/reminders', title: 'Follow-up Reminders', desc: 'Auto reminders', api: '/api/crm/reminders' },
  { path: 'crm/appointments', title: 'Appointments', desc: 'Booking system', api: '/api/crm/appointments' },
  { path: 'crm/chat', title: 'Chat', desc: 'WhatsApp/Web', api: '/api/crm/chat' },
  { path: 'crm/history', title: 'Interaction History', desc: 'Customer interactions', api: '/api/crm/history' },
  { path: 'crm/feedback', title: 'Feedback', desc: 'Collect feedback', api: '/api/crm/feedback' },
  { path: 'crm/chatbot', title: 'AI Chatbot', desc: 'AI integration', api: '/api/crm/chatbot' },

  // AI Module (10 pages)
  { path: 'ai/chat', title: 'AI Chat', desc: 'Business assistant', api: '/api/ai/chat' },
  { path: 'ai/product-suggestions', title: 'Product Suggestions', desc: 'Cross-sell', api: '/api/ai/product-suggestions' },
  { path: 'ai/forecasting', title: 'Demand Forecasting', desc: 'Predict demand', api: '/api/ai/forecasting' },
  { path: 'ai/po-generator', title: 'PO Generator', desc: 'Auto PO', api: '/api/ai/po-generator' },
  { path: 'ai/sales-insights', title: 'Sales Insights', desc: 'AI analytics', api: '/api/ai/sales-insights' },
  { path: 'ai/pricing', title: 'Price Optimization', desc: 'Dynamic pricing', api: '/api/ai/pricing' },
  { path: 'ai/content', title: 'Content Writer', desc: 'Posts/Blogs', api: '/api/ai/content' },
  { path: 'ai/segmentation', title: 'Customer Segmentation', desc: 'AI segments', api: '/api/ai/segmentation' },
  { path: 'ai/health', title: 'Health Suggestions', desc: 'Doctor support', api: '/api/ai/health' },
  { path: 'ai/automation', title: 'Workflow Automation', desc: 'Auto workflows', api: '/api/ai/automation' },

  // Analytics Module (9 pages)
  { path: 'analytics/kpi', title: 'KPI Dashboards', desc: 'Key metrics', api: '/api/analytics/kpi' },
  { path: 'analytics/sales-purchase', title: 'Sales vs Purchase', desc: 'Comparison', api: '/api/analytics/sales-purchase' },
  { path: 'analytics/products', title: 'Product Performance', desc: 'Product metrics', api: '/api/analytics/products' },
  { path: 'analytics/ltv', title: 'Customer LTV', desc: 'Lifetime value', api: '/api/analytics/ltv' },
  { path: 'analytics/forecasting', title: 'Forecasting', desc: 'AI forecasts', api: '/api/analytics/forecasting' },
  { path: 'analytics/branches', title: 'Branch Comparison', desc: 'Branch performance', api: '/api/analytics/branches' },
  { path: 'analytics/marketing-roi', title: 'Marketing ROI', desc: 'Marketing metrics', api: '/api/analytics/marketing-roi' },
  { path: 'analytics/expense-profit', title: 'Expense vs Profit', desc: 'Financial graphs', api: '/api/analytics/expense-profit' },

  // AI Campaigns Module (5 pages)
  { path: 'ai-campaigns/create', title: 'Create Campaign', desc: 'AI-generated', api: '/api/ai-campaigns/create' },
  { path: 'ai-campaigns/multi-channel', title: 'Multi-Channel', desc: 'Deploy everywhere', api: '/api/ai-campaigns/multi-channel' },
  { path: 'ai-campaigns/auto-content', title: 'Auto Content', desc: 'Content + Images', api: '/api/ai-campaigns/auto-content' },
  { path: 'ai-campaigns/schedule', title: 'Scheduling', desc: 'Trigger-based', api: '/api/ai-campaigns/schedule' },
  { path: 'ai-campaigns/performance', title: 'Performance', desc: 'Campaign analysis', api: '/api/ai-campaigns/performance' },

  // AI Insights Module (6 pages)
  { path: 'ai-insights/daily', title: 'Daily Summary', desc: 'Auto summary', api: '/api/ai-insights/daily' },
  { path: 'ai-insights/products', title: 'Product Performance', desc: 'Top/Low products', api: '/api/ai-insights/products' },
  { path: 'ai-insights/actions', title: 'Action Suggestions', desc: 'Reorder/Discount', api: '/api/ai-insights/actions' },
  { path: 'ai-insights/cashflow', title: 'Cash Flow', desc: 'Predictions', api: '/api/ai-insights/cashflow' },
  { path: 'ai-insights/profit-leaks', title: 'Profit Leaks', desc: 'AI alerts', api: '/api/ai-insights/profit-leaks' },
  { path: 'ai-insights/customer-behavior', title: 'Customer Behavior', desc: 'Insights', api: '/api/ai-insights/customer-behavior' },

  // AI Lab Module (6 pages)
  { path: 'ai-lab/test', title: 'Test Features', desc: 'Experiment', api: '/api/ai-lab/test' },
  { path: 'ai-lab/playground', title: 'Prompt Playground', desc: 'Test prompts', api: '/api/ai-lab/playground' },
  { path: 'ai-lab/models', title: 'Model Comparisons', desc: 'Compare LLMs', api: '/api/ai-lab/models' },
  { path: 'ai-lab/training', title: 'Data Training', desc: 'Train models', api: '/api/ai-lab/training' },
  { path: 'ai-lab/integration', title: 'LLM Integration', desc: 'Test APIs', api: '/api/ai-lab/integration' },
  { path: 'ai-lab/fine-tune', title: 'Fine-tune', desc: 'Domain models', api: '/api/ai-lab/fine-tune' },

  // Settings Module (11 pages)
  { path: 'settings/company', title: 'Company Profile', desc: 'Company info', api: '/api/settings/company' },
  { path: 'settings/branches', title: 'Branch Management', desc: 'Stores', api: '/api/settings/branches' },
  { path: 'settings/roles', title: 'Roles & Permissions', desc: 'Access control', api: '/api/settings/roles' },
  { path: 'settings/tax', title: 'Tax/GST Config', desc: 'Tax settings', api: '/api/settings/tax' },
  { path: 'settings/units', title: 'Units & Measures', desc: 'UOM', api: '/api/settings/units' },
  { path: 'settings/payments', title: 'Payment Methods', desc: 'Payment options', api: '/api/settings/payments' },
  { path: 'settings/gateway', title: 'Email/WhatsApp Gateway', desc: 'API settings', api: '/api/settings/gateway' },
  { path: 'settings/ai-models', title: 'AI Model Selection', desc: 'Choose AI', api: '/api/settings/ai-models' },
  { path: 'settings/backup', title: 'Backup & Restore', desc: 'Data backup', api: '/api/settings/backup' },
  { path: 'settings/notifications', title: 'Notifications', desc: 'Alert preferences', api: '/api/settings/notifications' },
  { path: 'settings/integrations', title: 'Integrations', desc: 'API keys', api: '/api/settings/integrations' },
];

const pageTemplate = (title, desc, api) => `'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';

export default function ${title.replace(/[^a-zA-Z]/g, '')}Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('${api}')
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
        <h1 className="text-2xl font-bold">${title}</h1>
        <p className="text-gray-600">${desc}</p>
      </div>

      <DataTable
        title="${title}"
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
`;

let created = 0;
let skipped = 0;

pages.forEach(({ path: pagePath, title, desc, api }) => {
  const filePath = `app/${pagePath}/page.tsx`;
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pageTemplate(title, desc, api));
    created++;
  } else {
    skipped++;
  }
});

console.log(`✅ Generated ${created} pages`);
console.log(`⏭️  Skipped ${skipped} existing pages`);
console.log(`📊 Total: ${created + skipped} pages`);
