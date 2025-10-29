// Complete Navigation Configuration for HomeoERP 4-Side Layout
import { 
  Home, Package, Warehouse, ShoppingCart, ShoppingBag, Users, Building2,
  DollarSign, UserCircle, FileText, TrendingUp, Megaphone, Share2, Bot,
  Factory, Stethoscope, BarChart3, Settings, Boxes, ClipboardList,
  CreditCard, Receipt, FileBarChart, Calendar, Award, Mail, MessageSquare,
  Instagram, Facebook, Youtube, Newspaper, Sparkles, Brain, TrendingDown,
  AlertCircle, Bell, Search, Zap, RefreshCw, User, LogOut, Moon, Sun,
  Plus, ShoppingBasket, MessageCircle, Activity, Clock, Database, Wifi,
  HardDrive, Info, ChevronDown, ChevronRight, LucideIcon
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  badge?: string | number;
  children?: MenuItem[];
  permissions?: string[];
  roles?: string[];
}

export const navigationMenu: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
    permissions: ['dashboard.view'],
    children: [
      { id: 'overview', label: 'Overview', icon: TrendingUp, path: '/dashboard/overview' },
      { id: 'quick-stats', label: 'Quick Stats', icon: Zap, path: '/dashboard/stats' },
      { id: 'branch-selector', label: 'Branch Selector', icon: Building2, path: '/dashboard/branches' },
      { id: 'ai-insights', label: 'AI Insights', icon: Brain, path: '/dashboard/ai-insights' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
      { id: 'activity-log', label: 'Activity Log', icon: Activity, path: '/dashboard/activity' },
    ]
  },
  {
    id: 'products',
    label: 'Products & Masters',
    icon: Package,
    permissions: ['products.view'],
    children: [
      { id: 'product-list', label: 'Product List', icon: Boxes, path: '/products' },
      { id: 'add-product', label: 'Add Product', icon: Plus, path: '/products/new' },
      { id: 'categories', label: 'Categories', icon: Boxes, path: '/master/categories' },
      { id: 'subcategories', label: 'Subcategories', icon: Boxes, path: '/master/subcategories' },
      { id: 'brands', label: 'Brands', icon: Award, path: '/master/brands' },
      { id: 'potencies', label: 'Potencies', icon: Sparkles, path: '/master/potencies' },
      { id: 'forms', label: 'Forms', icon: ClipboardList, path: '/master/forms' },
      { id: 'pack-sizes', label: 'Pack Sizes', icon: Package, path: '/master/pack-sizes' },
      { id: 'hsn-codes', label: 'HSN/GST Codes', icon: FileText, path: '/master/hsn-codes' },
      { id: 'units', label: 'Units & Measures', icon: Boxes, path: '/master/units' },
      { id: 'locations', label: 'Rack/Shelf/Location', icon: Warehouse, path: '/master/locations' },
      { id: 'product-images', label: 'Product Images', icon: Package, path: '/products/images' },
      { id: 'batch-management', label: 'Batch Management', icon: ClipboardList, path: '/products/batches' },
      { id: 'barcode-print', label: 'Barcode/QR Print', icon: Package, path: '/products/barcode' },
      { id: 'product-import', label: 'Import/Export', icon: RefreshCw, path: '/products/import-export' },
      { id: 'master-sync', label: 'Master Data Sync', icon: Database, path: '/products/sync' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    permissions: ['inventory.view'],
    children: [
      { id: 'inventory-dashboard', label: 'Inventory Dashboard', icon: BarChart3, path: '/inventory/dashboard' },
      { id: 'current-stock', label: 'Current Stock', icon: Boxes, path: '/inventory/stock' },
      { id: 'stock-adjustments', label: 'Stock Adjustments', icon: RefreshCw, path: '/inventory/adjustments' },
      { id: 'stock-transfers', label: 'Stock Transfers', icon: TrendingUp, path: '/inventory/transfers' },
      { id: 'stock-reconciliation', label: 'Stock Reconciliation', icon: ClipboardList, path: '/inventory/reconciliation' },
      { id: 'low-stock', label: 'Low Stock/Dead Stock', icon: AlertCircle, path: '/inventory/low-stock' },
      { id: 'expiry-alerts', label: 'Expiry & Batch Alerts', icon: Bell, path: '/inventory/expiry-alerts' },
      { id: 'stock-valuation', label: 'Stock Valuation', icon: DollarSign, path: '/inventory/valuation' },
      { id: 'ai-reorder', label: 'AI Reorder Suggestions', icon: Bot, path: '/inventory/ai-reorder' },
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    permissions: ['sales.view'],
    children: [
      { id: 'pos-billing', label: 'POS/Retail Billing', icon: CreditCard, path: '/sales/pos' },
      { id: 'b2b-billing', label: 'B2B/Wholesale Billing', icon: ShoppingBag, path: '/sales/b2b' },
      { id: 'sales-orders', label: 'Sales Orders', icon: ClipboardList, path: '/sales/orders' },
      { id: 'quotations', label: 'Quotations', icon: FileText, path: '/sales/quotations' },
      { id: 'sales-invoices', label: 'Sales Invoices', icon: Receipt, path: '/sales/invoices' },
      { id: 'sales-returns', label: 'Returns/Credit Notes', icon: TrendingDown, path: '/sales/returns' },
      { id: 'hold-bill', label: 'Hold/Resume Bill', icon: Clock, path: '/sales/hold-bills' },
      { id: 'e-invoice', label: 'e-Invoice Generation', icon: FileBarChart, path: '/sales/e-invoice' },
      { id: 'payment-collection', label: 'Payment Collection', icon: DollarSign, path: '/sales/payments' },
      { id: 'commission', label: 'Salesman Commission', icon: Award, path: '/sales/commission' },
      { id: 'sales-reports', label: 'Sales Reports', icon: BarChart3, path: '/sales/reports' },
    ]
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingBag,
    permissions: ['purchases.view'],
    children: [
      { id: 'purchase-dashboard', label: 'Purchase Dashboard', icon: BarChart3, path: '/purchases/dashboard' },
      { id: 'purchase-orders', label: 'Purchase Orders (PO)', icon: ClipboardList, path: '/purchases/orders' },
      { id: 'grn', label: 'Goods Receipts (GRN)', icon: Package, path: '/purchases/grn' },
      { id: 'purchase-bills', label: 'Purchase Bills', icon: Receipt, path: '/purchases/bills' },
      { id: 'purchase-returns', label: 'Purchase Returns', icon: TrendingDown, path: '/purchases/returns' },
      { id: 'vendor-payments', label: 'Vendor Payments', icon: DollarSign, path: '/purchases/payments' },
      { id: 'price-comparison', label: 'Vendor Price Comparison', icon: BarChart3, path: '/purchases/price-comparison' },
      { id: 'auto-reorder', label: 'Auto Reorder', icon: Bot, path: '/purchases/auto-reorder' },
      { id: 'purchase-history', label: 'Purchase History', icon: FileText, path: '/purchases/history' },
    ]
  },
  {
    id: 'customers',
    label: 'Customers/CRM',
    icon: Users,
    permissions: ['customers.view'],
    children: [
      { id: 'customer-list', label: 'Customer List', icon: Users, path: '/customers' },
      { id: 'add-customer', label: 'Add Customer', icon: Plus, path: '/customers/new' },
      { id: 'customer-groups', label: 'Customer Groups', icon: Users, path: '/customers/groups' },
      { id: 'loyalty-points', label: 'Loyalty Points', icon: Award, path: '/customers/loyalty' },
      { id: 'outstanding-ledger', label: 'Outstanding Ledger', icon: FileText, path: '/customers/outstanding' },
      { id: 'credit-limit', label: 'Credit Limit Tracker', icon: DollarSign, path: '/customers/credit-limit' },
      { id: 'feedback', label: 'Feedback & Reviews', icon: MessageSquare, path: '/customers/feedback' },
      { id: 'communication', label: 'WhatsApp/Email Logs', icon: MessageCircle, path: '/customers/communication' },
      { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/customers/appointments' },
    ]
  },
  {
    id: 'vendors',
    label: 'Vendors/Suppliers',
    icon: Building2,
    permissions: ['vendors.view'],
    children: [
      { id: 'vendor-list', label: 'Vendor List', icon: Building2, path: '/vendors' },
      { id: 'add-vendor', label: 'Add Vendor', icon: Plus, path: '/vendors/new' },
      { id: 'vendor-types', label: 'Vendor Types', icon: ClipboardList, path: '/vendors/types' },
      { id: 'payment-terms', label: 'Payment Terms', icon: FileText, path: '/vendors/payment-terms' },
      { id: 'vendor-ledger', label: 'Credit Ledger', icon: FileBarChart, path: '/vendors/ledger' },
      { id: 'performance', label: 'Performance Rating', icon: TrendingUp, path: '/vendors/performance' },
      { id: 'contracts', label: 'Contracts/Documents', icon: FileText, path: '/vendors/contracts' },
      { id: 'supplier-portal', label: 'Supplier Portal', icon: Wifi, path: '/vendors/portal' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Accounting',
    icon: DollarSign,
    permissions: ['finance.view'],
    children: [
      { id: 'finance-dashboard', label: 'Finance Dashboard', icon: BarChart3, path: '/finance/dashboard' },
      { id: 'sales-ledger', label: 'Sales Ledger', icon: FileText, path: '/finance/sales-ledger' },
      { id: 'purchase-ledger', label: 'Purchase Ledger', icon: FileText, path: '/finance/purchase-ledger' },
      { id: 'cash-book', label: 'Cash Book', icon: DollarSign, path: '/finance/cash-book' },
      { id: 'bank-book', label: 'Bank Book', icon: Building2, path: '/finance/bank-book' },
      { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/finance/expenses' },
      { id: 'petty-cash', label: 'Petty Cash', icon: DollarSign, path: '/finance/petty-cash' },
      { id: 'journal-entries', label: 'Journal Entries', icon: FileText, path: '/finance/journal' },
      { id: 'gst-reports', label: 'GST/Tax Reports', icon: FileBarChart, path: '/finance/gst-reports' },
      { id: 'trial-balance', label: 'Trial Balance', icon: BarChart3, path: '/finance/trial-balance' },
      { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp, path: '/finance/profit-loss' },
      { id: 'balance-sheet', label: 'Balance Sheet', icon: FileBarChart, path: '/finance/balance-sheet' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', icon: RefreshCw, path: '/finance/bank-reconciliation' },
      { id: 'vouchers', label: 'Payment/Receipt Vouchers', icon: Receipt, path: '/finance/vouchers' },
    ]
  },
  {
    id: 'hr',
    label: 'HR & Staff',
    icon: UserCircle,
    permissions: ['hr.view'],
    children: [
      { id: 'employee-list', label: 'Employee List', icon: Users, path: '/hr/employees' },
      { id: 'add-employee', label: 'Add Employee', icon: Plus, path: '/hr/employees/new' },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: Settings, path: '/settings/roles' },
      { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/hr/attendance' },
      { id: 'leave-management', label: 'Leave Management', icon: Calendar, path: '/hr/leaves' },
      { id: 'shift-scheduling', label: 'Shift Scheduling', icon: Clock, path: '/hr/shifts' },
      { id: 'payroll', label: 'Payroll/Salary', icon: DollarSign, path: '/hr/payroll' },
      { id: 'incentives', label: 'Incentives & Commission', icon: Award, path: '/hr/incentives' },
      { id: 'hr-activity', label: 'Activity/Audit Log', icon: Activity, path: '/hr/activity' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    permissions: ['reports.view'],
    children: [
      { id: 'sales-reports', label: 'Sales Reports', icon: TrendingUp, path: '/reports/sales' },
      { id: 'purchase-reports', label: 'Purchase Reports', icon: ShoppingBag, path: '/reports/purchases' },
      { id: 'inventory-reports', label: 'Inventory Reports', icon: Warehouse, path: '/reports/inventory' },
      { id: 'expiry-reports', label: 'Expiry Reports', icon: AlertCircle, path: '/reports/expiry' },
      { id: 'profit-reports', label: 'Profit/Loss Reports', icon: BarChart3, path: '/reports/profit-loss' },
      { id: 'gst-tax-reports', label: 'GST/Tax Reports', icon: FileBarChart, path: '/reports/gst' },
      { id: 'customer-reports', label: 'Customer Reports', icon: Users, path: '/reports/customers' },
      { id: 'vendor-reports', label: 'Vendor Reports', icon: Building2, path: '/reports/vendors' },
      { id: 'employee-reports', label: 'Employee Reports', icon: UserCircle, path: '/reports/employees' },
      { id: 'financial-statements', label: 'Financial Statements', icon: FileBarChart, path: '/reports/financial' },
      { id: 'custom-reports', label: 'Custom Report Builder', icon: Sparkles, path: '/reports/custom' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing & Schemes',
    icon: Megaphone,
    permissions: ['marketing.view'],
    children: [
      { id: 'campaign-dashboard', label: 'Campaign Dashboard', icon: BarChart3, path: '/marketing/dashboard' },
      { id: 'whatsapp-campaigns', label: 'WhatsApp Campaigns', icon: MessageCircle, path: '/marketing/whatsapp' },
      { id: 'sms-campaigns', label: 'SMS Campaigns', icon: MessageSquare, path: '/marketing/sms' },
      { id: 'email-campaigns', label: 'Email Campaigns', icon: Mail, path: '/marketing/email' },
      { id: 'offers', label: 'Offer/Coupon Management', icon: Award, path: '/marketing/offers' },
      { id: 'festival-campaigns', label: 'Festival Campaigns', icon: Sparkles, path: '/marketing/festivals' },
      { id: 'dealer-announcements', label: 'Dealer Announcements', icon: Megaphone, path: '/marketing/announcements' },
      { id: 'templates', label: 'Templates Library', icon: FileText, path: '/marketing/templates' },
      { id: 'ai-campaigns', label: 'AI Campaign Generator', icon: Bot, path: '/marketing/ai-generator' },
      { id: 'gift-cards', label: 'Gift Cards/Loyalty', icon: Award, path: '/marketing/gift-cards' },
    ]
  },
  {
    id: 'social',
    label: 'Social Automation',
    icon: Share2,
    permissions: ['social.view'],
    children: [
      { id: 'post-scheduler', label: 'Post Scheduler', icon: Calendar, path: '/social/scheduler' },
      { id: 'gmb', label: 'Google My Business', icon: Search, path: '/social/gmb' },
      { id: 'instagram', label: 'Instagram', icon: Instagram, path: '/social/instagram' },
      { id: 'facebook', label: 'Facebook', icon: Facebook, path: '/social/facebook' },
      { id: 'youtube', label: 'YouTube', icon: Youtube, path: '/social/youtube' },
      { id: 'blog', label: 'Blog/WordPress', icon: Newspaper, path: '/social/blog' },
      { id: 'ai-content', label: 'AI Content & Hashtags', icon: Sparkles, path: '/social/ai-content' },
      { id: 'multi-account', label: 'Multi-Account Management', icon: Users, path: '/social/accounts' },
    ]
  },
  {
    id: 'ai',
    label: 'AI & Analytics',
    icon: Bot,
    permissions: ['ai.view'],
    children: [
      { id: 'ai-chat', label: 'AI Chat', icon: MessageCircle, path: '/ai/chat' },
      { id: 'demand-forecast', label: 'Demand Forecast', icon: TrendingUp, path: '/ai/forecast' },
      { id: 'sales-insights', label: 'Sales Insights', icon: BarChart3, path: '/ai/sales-insights' },
      { id: 'po-generator', label: 'PO Generator', icon: Bot, path: '/ai/po-generator' },
      { id: 'price-optimization', label: 'Price Optimization', icon: DollarSign, path: '/ai/pricing' },
      { id: 'content-writer', label: 'Content Writer', icon: FileText, path: '/ai/content-writer' },
      { id: 'remedy-suggestion', label: 'Remedy Suggestion', icon: Stethoscope, path: '/ai/remedy' },
      { id: 'workflow-automation', label: 'Workflow Automation', icon: Zap, path: '/ai/workflows' },
      { id: 'ai-demos', label: 'AI Demos/Sandbox', icon: Sparkles, path: '/ai/demos' },
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing/Warehouse',
    icon: Factory,
    permissions: ['manufacturing.view'],
    roles: ['admin', 'manufacturer'],
    children: [
      { id: 'manufacturing-orders', label: 'Manufacturing Orders', icon: ClipboardList, path: '/manufacturing/orders' },
      { id: 'bom', label: 'Bill of Materials', icon: FileText, path: '/manufacturing/bom' },
      { id: 'production-batches', label: 'Production Batches', icon: Package, path: '/manufacturing/batches' },
      { id: 'warehouse-stock', label: 'Warehouse Stock', icon: Warehouse, path: '/manufacturing/warehouse' },
      { id: 'raw-materials', label: 'Raw Material Tracking', icon: Boxes, path: '/manufacturing/raw-materials' },
    ]
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions/Doctor',
    icon: Stethoscope,
    permissions: ['prescriptions.view'],
    roles: ['admin', 'doctor', 'pharmacist'],
    children: [
      { id: 'prescription-entry', label: 'Prescription Entry', icon: FileText, path: '/prescriptions/entry' },
      { id: 'patient-list', label: 'Patient List', icon: Users, path: '/prescriptions/patients' },
      { id: 'medicine-mapping', label: 'Medicine Mapping', icon: Package, path: '/prescriptions/mapping' },
      { id: 'ai-remedy', label: 'AI Remedy Suggestion', icon: Brain, path: '/prescriptions/ai-remedy' },
      { id: 'doctor-dashboard', label: 'Doctor Dashboard', icon: BarChart3, path: '/prescriptions/dashboard' },
      { id: 'prescription-templates', label: 'Prescription Templates', icon: FileText, path: '/prescriptions/templates' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics/BI',
    icon: BarChart3,
    permissions: ['analytics.view'],
    children: [
      { id: 'sales-vs-purchase', label: 'Sales vs Purchase', icon: TrendingUp, path: '/analytics/sales-purchase' },
      { id: 'product-performance', label: 'Product Performance', icon: Package, path: '/analytics/products' },
      { id: 'customer-ltv', label: 'Customer LTV', icon: Users, path: '/analytics/customer-ltv' },
      { id: 'branch-performance', label: 'Branch Performance', icon: Building2, path: '/analytics/branches' },
      { id: 'expense-profit', label: 'Expense vs Profit', icon: BarChart3, path: '/analytics/expense-profit' },
      { id: 'forecasting', label: 'Forecasting (AI)', icon: Brain, path: '/analytics/forecasting' },
      { id: 'cashflow', label: 'Cash Flow Insights', icon: DollarSign, path: '/analytics/cashflow' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    permissions: ['settings.view'],
    children: [
      { id: 'company-profile', label: 'Company Profile', icon: Building2, path: '/settings/company' },
      { id: 'branch-management', label: 'Branch Management', icon: Building2, path: '/settings/branches' },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: UserCircle, path: '/settings/roles' },
      { id: 'global-settings', label: 'Global ERP Settings', icon: Settings, path: '/settings/global' },
      { id: 'tax-settings', label: 'Tax/GST Settings', icon: FileBarChart, path: '/settings/tax' },
      { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, path: '/settings/payment-methods' },
      { id: 'ai-model', label: 'AI Model Selection', icon: Bot, path: '/settings/ai-model' },
      { id: 'gateways', label: 'Email/WhatsApp Gateway', icon: Mail, path: '/settings/gateways' },
      { id: 'backup-restore', label: 'Backup & Restore', icon: HardDrive, path: '/settings/backup' },
      { id: 'notifications-pref', label: 'Notification Preferences', icon: Bell, path: '/settings/notifications' },
      { id: 'integration-keys', label: 'Integration Keys (API)', icon: Wifi, path: '/settings/integrations' },
      { id: 'access-logs', label: 'User Access Logs', icon: Activity, path: '/settings/access-logs' },
    ]
  },
];

// Role-based menu visibility
export const roleMenuAccess: Record<string, string[]> = {
  'admin': ['*'], // All menus
  'owner': ['*'], // All menus
  'cashier': ['dashboard', 'sales', 'customers'],
  'inventory-manager': ['dashboard', 'products', 'inventory', 'purchases'],
  'accountant': ['dashboard', 'finance', 'reports', 'vendors'],
  'doctor': ['dashboard', 'prescriptions', 'products', 'inventory'],
  'pharmacist': ['dashboard', 'prescriptions', 'products', 'inventory', 'sales'],
  'marketing-staff': ['dashboard', 'marketing', 'social', 'customers'],
  'salesman': ['dashboard', 'sales', 'customers'],
};

// Helper function to filter menu based on role and permissions
export function filterMenuByRole(menu: MenuItem[], userRole: string, userPermissions: string[]): MenuItem[] {
  const allowedMenus = roleMenuAccess[userRole] || [];
  
  if (allowedMenus.includes('*')) {
    return menu;
  }
  
  return menu.filter(item => {
    // Check if menu is allowed for role
    if (!allowedMenus.includes(item.id)) {
      return false;
    }
    
    // Check permissions
    if (item.permissions && item.permissions.length > 0) {
      return item.permissions.some(perm => userPermissions.includes(perm));
    }
    
    // Check role-specific menus
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(userRole);
    }
    
    return true;
  }).map(item => ({
    ...item,
    children: item.children ? filterMenuByRole(item.children, userRole, userPermissions) : undefined
  }));
}
