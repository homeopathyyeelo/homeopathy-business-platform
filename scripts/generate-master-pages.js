#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const masterDataConfigs = [
  // System Masters
  { endpoint: 'company-profile', title: 'Company Profile', category: 'system' },
  { endpoint: 'branches', title: 'Branches', category: 'system' },
  { endpoint: 'departments', title: 'Departments', category: 'system' },
  { endpoint: 'roles', title: 'Roles & Permissions', category: 'system' },
  { endpoint: 'users', title: 'Users', category: 'system' },
  { endpoint: 'currencies', title: 'Currencies', category: 'system' },
  { endpoint: 'tax-slabs', title: 'Tax Slabs', category: 'system' },
  { endpoint: 'uoms', title: 'Units of Measure', category: 'system' },
  { endpoint: 'payment-methods', title: 'Payment Methods', category: 'system' },

  // Product Masters
  { endpoint: 'products', title: 'Products', category: 'product' },
  { endpoint: 'categories', title: 'Categories', category: 'product' },
  { endpoint: 'brands', title: 'Brands', category: 'product' },
  { endpoint: 'product-groups', title: 'Product Groups', category: 'product' },
  { endpoint: 'potencies', title: 'Potencies', category: 'product' },
  { endpoint: 'packing-sizes', title: 'Packing Sizes', category: 'product' },
  { endpoint: 'product-variants', title: 'Product Variants', category: 'product' },
  { endpoint: 'batches', title: 'Batches', category: 'product' },
  { endpoint: 'rack-locations', title: 'Rack Locations', category: 'product' },
  { endpoint: 'warehouses', title: 'Warehouses', category: 'product' },
  { endpoint: 'hsn-codes', title: 'HSN Codes', category: 'product' },
  { endpoint: 'price-lists', title: 'Price Lists', category: 'product' },

  // Sales Masters
  { endpoint: 'sales-types', title: 'Sales Types', category: 'sales' },
  { endpoint: 'invoice-series', title: 'Invoice Series', category: 'sales' },
  { endpoint: 'price-levels', title: 'Price Levels', category: 'sales' },
  { endpoint: 'salespeople', title: 'Salespeople', category: 'sales' },
  { endpoint: 'payment-terms', title: 'Payment Terms', category: 'sales' },
  { endpoint: 'credit-limits', title: 'Credit Limits', category: 'sales' },
  { endpoint: 'pos-settings', title: 'POS Settings', category: 'sales' },
  { endpoint: 'return-reasons', title: 'Return Reasons', category: 'sales' },

  // Purchase Masters
  { endpoint: 'vendors', title: 'Vendors', category: 'purchase' },
  { endpoint: 'vendor-types', title: 'Vendor Types', category: 'purchase' },
  { endpoint: 'purchase-order-terms', title: 'Purchase Order Terms', category: 'purchase' },
  { endpoint: 'po-statuses', title: 'PO Statuses', category: 'purchase' },
  { endpoint: 'freight-charges', title: 'Freight Charges', category: 'purchase' },
  { endpoint: 'purchase-return-reasons', title: 'Purchase Return Reasons', category: 'purchase' },
  { endpoint: 'price-comparisons', title: 'Price Comparisons', category: 'purchase' },
  { endpoint: 'grn-templates', title: 'GRN Templates', category: 'purchase' },
  { endpoint: 'purchase-taxes', title: 'Purchase Taxes', category: 'purchase' },

  // Customer Masters
  { endpoint: 'customers', title: 'Customers', category: 'customer' },
  { endpoint: 'customer-groups', title: 'Customer Groups', category: 'customer' },
  { endpoint: 'contact-types', title: 'Contact Types', category: 'customer' },
  { endpoint: 'address-books', title: 'Address Books', category: 'customer' },
  { endpoint: 'loyalty-programs', title: 'Loyalty Programs', category: 'customer' },
  { endpoint: 'feedback-types', title: 'Feedback Types', category: 'customer' },
  { endpoint: 'lead-sources', title: 'Lead Sources', category: 'customer' },
  { endpoint: 'followup-statuses', title: 'Follow-up Statuses', category: 'customer' },
  { endpoint: 'ticket-categories', title: 'Ticket Categories', category: 'customer' },

  // HR Masters
  { endpoint: 'employees', title: 'Employees', category: 'hr' },
  { endpoint: 'designations', title: 'Designations', category: 'hr' },
  { endpoint: 'shifts', title: 'Shifts', category: 'hr' },
  { endpoint: 'attendance-rules', title: 'Attendance Rules', category: 'hr' },
  { endpoint: 'leave-types', title: 'Leave Types', category: 'hr' },
  { endpoint: 'salary-structures', title: 'Salary Structures', category: 'hr' },
  { endpoint: 'commission-rules', title: 'Commission Rules', category: 'hr' },
  { endpoint: 'performance-metrics', title: 'Performance Metrics', category: 'hr' },

  // Finance Masters
  { endpoint: 'ledger-accounts', title: 'Ledger Accounts', category: 'finance' },
  { endpoint: 'cost-centers', title: 'Cost Centers', category: 'finance' },
  { endpoint: 'expense-categories', title: 'Expense Categories', category: 'finance' },
  { endpoint: 'banks', title: 'Banks', category: 'finance' },
  { endpoint: 'payment-voucher-types', title: 'Payment Voucher Types', category: 'finance' },
  { endpoint: 'gst-return-periods', title: 'GST Return Periods', category: 'finance' },
  { endpoint: 'cheque-books', title: 'Cheque Books', category: 'finance' },
  { endpoint: 'vendor-customer-ledgers', title: 'Vendor Customer Ledgers', category: 'finance' },

  // Marketing Masters
  { endpoint: 'campaign-types', title: 'Campaign Types', category: 'marketing' },
  { endpoint: 'marketing-templates', title: 'Marketing Templates', category: 'marketing' },
  { endpoint: 'offer-coupons', title: 'Offer Coupons', category: 'marketing' },
  { endpoint: 'target-segments', title: 'Target Segments', category: 'marketing' },
  { endpoint: 'channel-configs', title: 'Channel Configs', category: 'marketing' },
  { endpoint: 'post-schedulers', title: 'Post Schedulers', category: 'marketing' },
  { endpoint: 'ai-prompt-templates', title: 'AI Prompt Templates', category: 'marketing' },
  { endpoint: 'festival-events', title: 'Festival Events', category: 'marketing' },

  // Social Media Masters
  { endpoint: 'social-accounts', title: 'Social Accounts', category: 'social' },
  { endpoint: 'hashtag-libraries', title: 'Hashtag Libraries', category: 'social' },
  { endpoint: 'blog-categories', title: 'Blog Categories', category: 'social' },
  { endpoint: 'auto-post-schedules', title: 'Auto Post Schedules', category: 'social' },
  { endpoint: 'media-libraries', title: 'Media Libraries', category: 'social' },
  { endpoint: 'workflow-rules', title: 'Workflow Rules', category: 'social' },

  // AI Masters
  { endpoint: 'ai-agents', title: 'AI Agents', category: 'ai' },
  { endpoint: 'ai-tasks', title: 'AI Tasks', category: 'ai' },
  { endpoint: 'ai-prompt-libraries', title: 'AI Prompt Libraries', category: 'ai' },
  { endpoint: 'model-versions', title: 'Model Versions', category: 'ai' },
  { endpoint: 'vector-indexes', title: 'Vector Indexes', category: 'ai' },
  { endpoint: 'ai-action-templates', title: 'AI Action Templates', category: 'ai' },
  { endpoint: 'business-rules', title: 'Business Rules', category: 'ai' },

  // Settings Masters
  { endpoint: 'system-settings', title: 'System Settings', category: 'settings' },
  { endpoint: 'sms-gateways', title: 'SMS Gateways', category: 'settings' },
  { endpoint: 'email-gateways', title: 'Email Gateways', category: 'settings' },
  { endpoint: 'whatsapp-gateways', title: 'WhatsApp Gateways', category: 'settings' },
  { endpoint: 'backup-settings', title: 'Backup Settings', category: 'settings' },
  { endpoint: 'notification-preferences', title: 'Notification Preferences', category: 'settings' },
  { endpoint: 'audit-log-settings', title: 'Audit Log Settings', category: 'settings' },
  { endpoint: 'security-policies', title: 'Security Policies', category: 'settings' },

  // Security Masters
  { endpoint: 'user-profiles', title: 'User Profiles', category: 'security' },
  { endpoint: 'permissions', title: 'Permissions', category: 'security' },
  { endpoint: 'activity-logs', title: 'Activity Logs', category: 'security' },
  { endpoint: 'two-factor-settings', title: '2FA Settings', category: 'security' },
  { endpoint: 'session-management', title: 'Session Management', category: 'security' },
]

const getIconForCategory = (category) => {
  const icons = {
    system: 'Building2',
    product: 'Package',
    sales: 'ShoppingCart',
    purchase: 'Truck',
    customer: 'Users',
    hr: 'UserCheck',
    finance: 'Calculator',
    marketing: 'TrendingUp',
    social: 'MessageSquare',
    ai: 'Bot',
    settings: 'Settings',
    security: 'Shield'
  }
  return icons[category] || 'Settings'
}

const generateMasterPage = (config) => {
  const { endpoint, title, category } = config

  const pageContent = `import { ${getIconForCategory(category)} } from "lucide-react"
import GenericMasterPage from "@/components/generic-master-page"

const ${endpoint.replace('-', '')}Config = {
  endpoint: '${endpoint}',
  title: '${title}',
  description: 'Manage ${title.toLowerCase()} for your ERP system',
  icon: <${getIconForCategory(category)} className="w-8 h-8 text-blue-600" />,
  tableColumns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Status', render: (value) => value ? 'Active' : 'Inactive' },
  ],
  searchFields: ['name', 'code'],
  formFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter ${title.toLowerCase()} name' },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter ${title.toLowerCase()} code' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],
  actions: {
    canEdit: true,
    canDelete: true,
    canView: true,
  }
}

export default function ${title.replace(/\s+/g, '')}Page() {
  return <GenericMasterPage config={${endpoint.replace('-', '')}Config} />
}`

  return pageContent
}

const createMasterPages = () => {
  const appDir = path.join(__dirname, '..', 'app', 'masters')

  masterDataConfigs.forEach(config => {
    const { endpoint, title, category } = config

    // Create category directory if it doesn't exist
    const categoryDir = path.join(appDir, category)
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    // Create the page file
    const pagePath = path.join(categoryDir, `${endpoint}`, 'page.tsx')
    if (!fs.existsSync(pagePath)) {
      fs.mkdirSync(path.dirname(pagePath), { recursive: true })
      const content = generateMasterPage(config)
      fs.writeFileSync(pagePath, content)
      console.log(`Created: ${pagePath}`)
    } else {
      console.log(`Skipped (already exists): ${pagePath}`)
    }
  })
}

// Run the script
createMasterPages()
console.log('Master pages generation completed!')
