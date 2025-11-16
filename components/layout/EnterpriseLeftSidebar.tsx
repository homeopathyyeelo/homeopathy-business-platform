'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ShoppingBag, Users, Truck,
  DollarSign, UserCheck, BarChart3, FileText, Megaphone, Share2, Brain, Settings,
  ChevronRight, ChevronDown, Pill, Stethoscope, Factory, Search
} from 'lucide-react';

interface EnterpriseLeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  label: string;
  path: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  color: string;
  badge?: string;
  submenus?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    color: 'from-blue-500 to-blue-600',
    submenus: [
      { label: 'Overview', path: '/dashboard' },
      { label: 'Quick Stats', path: '/dashboard/stats' },
      { label: 'Activity Log', path: '/dashboard/activity' },
      { label: 'Approvals', path: '/admin/approvals' },
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: Pill,
    path: '/products',
    color: 'from-green-500 to-green-600',
    submenus: [
      { label: 'Product List', path: '/products' },
      { label: 'Add Product', path: '/products/add' },
      { label: 'Categories', path: '/products/categories' },
      { label: 'Subcategories', path: '/products/subcategories' },
      { label: 'Brands', path: '/products/brands' },
      { label: 'Potencies', path: '/products/potencies' },
      { label: 'Forms', path: '/products/forms' },
      { label: 'HSN Codes', path: '/products/hsn' },
      { label: 'Units', path: '/products/units' },
      { label: 'Batch Management', path: '/products/batches' },
      { label: 'Barcode Print', path: '/products/barcode' },
      { label: 'Import Export', path: '/products/import-export' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    path: '/inventory',
    color: 'from-purple-500 to-purple-600',
    submenus: [
      { label: 'Purchase Upload', path: '/purchases/upload' },
      { label: 'Inventory Upload', path: '/inventory/upload' },
      { label: 'Current Stock', path: '/inventory/stock' },
      { label: 'Stock Adjustments', path: '/inventory/adjustments' },
      { label: 'Stock Transfers', path: '/inventory/transfers' },
      { label: 'Reconciliation', path: '/inventory/reconciliation' },
      { label: 'Low Stock', path: '/inventory/low-stock' },
      { label: 'Expiry Alerts', path: '/inventory/expiry' },
      { label: 'Stock Valuation', path: '/inventory/valuation' },
      { label: 'AI Reorder', path: '/inventory/ai-reorder' },
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    path: '/sales',
    color: 'from-orange-500 to-orange-600',
    submenus: [
      { label: 'POS Billing', path: '/sales/pos' },
      { label: 'B2B Billing', path: '/sales/b2b' },
      { label: 'Sales Orders', path: '/sales/orders' },
      { label: 'Invoices', path: '/sales/invoices' },
      { label: 'Returns', path: '/sales/returns' },
      { label: 'Hold Bills', path: '/sales/hold-bills' },
      { label: 'e-Invoice', path: '/sales/e-invoice' },
      { label: 'Payments', path: '/sales/payments' },
      { label: 'Commission', path: '/sales/commission' },
    ]
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingBag,
    path: '/purchases',
    color: 'from-pink-500 to-pink-600',
    submenus: [
      { label: 'Purchase Upload', path: '/purchases/upload' },
      { label: 'Purchase Orders', path: '/purchases/orders' },
      { label: 'GRN', path: '/purchases/grn' },
      { label: 'Purchase Bills', path: '/purchases/bills' },
      { label: 'Returns', path: '/purchases/returns' },
      { label: 'Payments', path: '/purchases/payments' },
      { label: 'Price Comparison', path: '/purchases/price-comparison' },
      { label: 'AI Reorder', path: '/purchases/ai-reorder' },
      { label: 'Purchase History', path: '/purchases/history' },
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/customers',
    color: 'from-cyan-500 to-cyan-600',
    submenus: [
      { label: 'Customer List', path: '/customers' },
      { label: 'Add Customer', path: '/customers/add' },
      { label: 'Customer Groups', path: '/customers/groups' },
      { label: 'Loyalty Points', path: '/customers/loyalty' },
      { label: 'Outstanding', path: '/customers/outstanding' },
      { label: 'Credit Limit', path: '/customers/credit-limit' },
      { label: 'Feedback', path: '/customers/feedback' },
      { label: 'Communication', path: '/customers/communication' },
      { label: 'Appointments', path: '/customers/appointments' },
    ]
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Truck,
    path: '/vendors',
    color: 'from-indigo-500 to-indigo-600',
    submenus: [
      { label: 'Vendor List', path: '/vendors' },
      { label: 'Add Vendor', path: '/vendors/add' },
      { label: 'Vendor Types', path: '/vendors/types' },
      { label: 'Payment Terms', path: '/vendors/payment-terms' },
      { label: 'Credit Ledger', path: '/vendors/ledger' },
      { label: 'Performance', path: '/vendors/performance' },
      { label: 'Contracts', path: '/vendors/contracts' },
      { label: 'Supplier Portal', path: '/vendors/portal' },
    ]
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: Stethoscope,
    path: '/prescriptions',
    color: 'from-teal-500 to-teal-600',
    submenus: [
      { label: 'Prescription Entry', path: '/prescriptions/create' },
      { label: 'Patient List', path: '/prescriptions/patients' },
      { label: 'Medicine Mapping', path: '/prescriptions/mapping' },
      { label: 'AI Suggestions', path: '/prescriptions/ai' },
      { label: 'Doctor Dashboard', path: '/prescriptions/dashboard' },
      { label: 'Templates', path: '/prescriptions/templates' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    path: '/finance',
    color: 'from-emerald-500 to-emerald-600',
    submenus: [
      { label: 'Sales Ledger', path: '/finance/sales-ledger' },
      { label: 'Purchase Ledger', path: '/finance/purchase-ledger' },
      { label: 'Cash Book', path: '/finance/cashbook' },
      { label: 'Bank Book', path: '/finance/bankbook' },
      { label: 'Expenses', path: '/finance/expenses' },
      { label: 'Petty Cash', path: '/finance/petty-cash' },
      { label: 'Journal Entries', path: '/finance/journal' },
      { label: 'GST Reports', path: '/finance/gst' },
      { label: 'Trial Balance', path: '/finance/trial-balance' },
      { label: 'Profit Loss', path: '/finance/pl' },
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
      { label: 'Bank Reconciliation', path: '/finance/bank-reconciliation' },
      { label: 'Payment/Receipt Vouchers', path: '/finance/vouchers' },
    ]
  },
  {
    id: 'hr',
    label: 'HR',
    icon: UserCheck,
    path: '/hr',
    color: 'from-violet-500 to-violet-600',
    submenus: [
      { label: 'Employees', path: '/hr/employees' },
      { label: 'Add Employee', path: '/hr/employees/add' },
      { label: 'Roles Permissions', path: '/hr/roles' },
      { label: 'Attendance', path: '/hr/attendance' },
      { label: 'Leave Management', path: '/hr/leaves' },
      { label: 'Shift Scheduling', path: '/hr/shifts' },
      { label: 'Payroll', path: '/hr/payroll' },
      { label: 'Incentives', path: '/hr/incentives' },
      { label: 'Activity Log', path: '/hr/activity' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    color: 'from-amber-500 to-amber-600',
    submenus: [
      { label: 'Sales Reports', path: '/reports/sales' },
      { label: 'Purchase Reports', path: '/reports/purchase' },
      { label: 'Stock Reports', path: '/reports/stock' },
      { label: 'Expiry Reports', path: '/reports/expiry' },
      { label: 'Profit Reports', path: '/reports/profit' },
      { label: 'GST Reports', path: '/reports/gst' },
      { label: 'Customer Reports', path: '/reports/customers' },
      { label: 'Vendor Reports', path: '/reports/vendors' },
      { label: 'Employee Reports', path: '/reports/employees' },
      { label: 'Custom Reports', path: '/reports/custom' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    color: 'from-rose-500 to-rose-600',
    submenus: [
      { label: 'Sales vs Purchase', path: '/analytics/sales-purchase' },
      { label: 'Product Performance', path: '/analytics/products' },
      { label: 'Customer LTV', path: '/analytics/customer-ltv' },
      { label: 'Branch Performance', path: '/analytics/branches' },
      { label: 'Expense vs Profit', path: '/analytics/expense-profit' },
      { label: 'AI Forecasting', path: '/analytics/forecasting' },
      { label: 'Cash Flow', path: '/analytics/cashflow' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    path: '/marketing',
    color: 'from-fuchsia-500 to-fuchsia-600',
    submenus: [
      { label: 'Campaign Dashboard', path: '/marketing/dashboard' },
      { label: 'WhatsApp Campaigns', path: '/marketing/whatsapp' },
      { label: 'SMS Campaigns', path: '/marketing/sms' },
      { label: 'Email Campaigns', path: '/marketing/email' },
      { label: 'Offers Coupons', path: '/marketing/offers' },
      { label: 'Festival Campaigns', path: '/marketing/festivals' },
      { label: 'Templates', path: '/marketing/templates' },
      { label: 'AI Campaign Generator', path: '/marketing/ai-generator' },
      { label: 'Dealer Announcements', path: '/marketing/announcements' },
    ]
  },
  {
    id: 'social',
    label: 'Social',
    icon: Share2,
    path: '/social',
    color: 'from-sky-500 to-sky-600',
    submenus: [
      { label: 'Post Scheduler', path: '/social/scheduler' },
      { label: 'GMB Posts', path: '/social/gmb' },
      { label: 'Instagram', path: '/social/instagram' },
      { label: 'Facebook', path: '/social/facebook' },
      { label: 'AI Content', path: '/social/ai-content' },
      { label: 'YouTube', path: '/social/youtube' },
      { label: 'Blog/WordPress', path: '/social/blog' },
      { label: 'Multi-Account', path: '/social/accounts' },
    ]
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Brain,
    path: '/ai',
    color: 'from-purple-600 to-pink-600',
    badge: 'AI',
    submenus: [
      { label: 'AI Chat', path: '/ai/chat' },
      { label: 'Demand Forecast', path: '/ai/forecasting' },
      { label: 'Sales Insights', path: '/ai/sales-insights' },
      { label: 'PO Generator', path: '/ai/po-generator' },
      { label: 'Price Optimization', path: '/ai/pricing' },
      { label: 'Content Writer', path: '/ai/content' },
      { label: 'Remedy Suggestion', path: '/ai/remedy' },
      { label: 'Workflow Automation', path: '/ai/workflow' },
      { label: 'AI Demos', path: '/ai/demos' },
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    path: '/manufacturing',
    color: 'from-slate-500 to-slate-600',
    submenus: [
      { label: 'Manufacturing Orders', path: '/manufacturing/orders' },
      { label: 'BOM', path: '/manufacturing/bom' },
      { label: 'Production Batches', path: '/manufacturing/batches' },
      { label: 'Warehouse Stock', path: '/manufacturing/warehouse' },
      { label: 'Raw Materials', path: '/manufacturing/raw-materials' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    color: 'from-gray-500 to-gray-600',
    submenus: [
      { label: 'Global ERP Settings', path: '/settings/global' },
      { label: 'Company Profile', path: '/settings/company' },
      { label: 'Branch Management', path: '/settings/branches' },
      { label: 'Roles Permissions', path: '/settings/roles' },
      { label: 'Tax GST Settings', path: '/settings/tax' },
      { label: 'Payment Methods', path: '/settings/payments' },
      { label: 'AI Model Selection', path: '/settings/ai-models' },
      { label: 'Email/WhatsApp Gateway', path: '/settings/gateway' },
      { label: 'Backup Restore', path: '/settings/backup' },
      { label: 'Notifications', path: '/settings/notifications' },
      { label: 'Integration Keys', path: '/settings/integrations' },
      { label: 'User Access Logs', path: '/settings/access-logs' },
    ]
  },
];

export default function EnterpriseLeftSidebar({ isOpen, onClose }: EnterpriseLeftSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.submenus?.some(sub => sub.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white flex flex-col shadow-2xl">
      <div className="p-4 border-b border-blue-500/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
          <input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-blue-500/30 border border-blue-400/30 rounded-lg text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => {
          const isExpanded = expandedItems.includes(item.id);
          const isActive = pathname?.startsWith(item.path);
          const Icon = item.icon;

          return (
            <div key={item.id}>
              <button
                onClick={() => item.submenus ? toggleExpand(item.id) : null}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive ? 'bg-white text-blue-700 shadow-lg' : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} ${isActive ? 'shadow-md' : 'opacity-80 group-hover:opacity-100'}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="flex-1 font-medium text-sm text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.submenus && (
                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {item.submenus && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenus.map((submenu) => {
                    const isSubActive = pathname === submenu.path;
                    return (
                      <Link
                        key={submenu.path}
                        href={submenu.path}
                        className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                          isSubActive 
                            ? 'bg-blue-500/50 text-white font-medium' 
                            : 'text-blue-200 hover:bg-blue-500/30 hover:text-white'
                        }`}
                      >
                        {submenu.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-500/30">
        <div className="bg-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-100 font-medium">HomeoERP v2.1.0</p>
          <p className="text-xs text-blue-200/70 mt-1">2025 Yeelo</p>
        </div>
      </div>
    </aside>
  );
}
