'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ShoppingBag, Users, Truck,
  DollarSign, UserCheck, BarChart3, FileText, Megaphone, Share2, Brain, Settings,
  ChevronRight, ChevronDown, Pill, Stethoscope, Factory, Activity, Search
} from 'lucide-react';

interface FinalLeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  color: string;
  badge?: string;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    color: 'from-blue-500 to-blue-600',
    children: [
      { label: 'Overview', path: '/dashboard' },
      { label: 'Quick Stats', path: '/dashboard/stats' },
      { label: 'Activity Log', path: '/dashboard/activity' },
    ]
  },
  {
    id: 'products',
    label: 'Products & Masters',
    icon: Pill,
    path: '/products',
    color: 'from-green-500 to-green-600',
    children: [
      { label: 'Product List', path: '/products' },
      { label: 'Add Product', path: '/products/add' },
      { label: 'Categories', path: '/products/categories' },
      { label: 'Brands', path: '/products/brands' },
      { label: 'Potencies', path: '/products/potencies' },
      { label: 'Forms', path: '/products/forms' },
      { label: 'Batch Management', path: '/products/batches' },
      { label: 'Barcodes', path: '/products/barcodes' },
      { label: 'Import/Export', path: '/products/import-export' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    path: '/inventory',
    color: 'from-purple-500 to-purple-600',
    children: [
      { label: 'Current Stock', path: '/inventory/stock' },
      { label: 'Stock Adjustments', path: '/inventory/adjustments' },
      { label: 'Stock Transfers', path: '/inventory/transfers' },
      { label: 'Reconciliation', path: '/inventory/reconciliation' },
      { label: 'Low Stock Alerts', path: '/inventory/low-stock' },
      { label: 'Expiry Alerts', path: '/inventory/expiry-alerts' },
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
    children: [
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
    children: [
      { label: 'Purchase Dashboard', path: '/purchases/dashboard' },
      { label: 'Purchase Orders', path: '/purchases/orders' },
      { label: 'GRN', path: '/purchases/grn' },
      { label: 'Purchase Bills', path: '/purchases/bills' },
      { label: 'Returns', path: '/purchases/returns' },
      { label: 'Payments', path: '/purchases/payments' },
      { label: 'Price Comparison', path: '/purchases/price-comparison' },
      { label: 'AI Reorder', path: '/purchases/ai-reorder' },
    ]
  },
  {
    id: 'customers',
    label: 'Customers / CRM',
    icon: Users,
    path: '/customers',
    color: 'from-cyan-500 to-cyan-600',
    children: [
      { label: 'Customer List', path: '/customers' },
      { label: 'Customer Groups', path: '/customers/groups' },
      { label: 'Loyalty Program', path: '/customers/loyalty' },
      { label: 'Outstanding', path: '/customers/outstanding' },
      { label: 'Feedback', path: '/customers/feedback' },
      { label: 'Communication', path: '/customers/communication' },
    ]
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Truck,
    path: '/vendors',
    color: 'from-indigo-500 to-indigo-600',
    children: [
      { label: 'Vendor List', path: '/vendors' },
      { label: 'Vendor Types', path: '/vendors/types' },
      { label: 'Payment Terms', path: '/vendors/payment-terms' },
      { label: 'Performance', path: '/vendors/performance' },
      { label: 'Contracts', path: '/vendors/contracts' },
    ]
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: Stethoscope,
    path: '/prescriptions',
    color: 'from-teal-500 to-teal-600',
    children: [
      { label: 'Prescription Entry', path: '/prescriptions/create' },
      { label: 'Patient List', path: '/prescriptions/patients' },
      { label: 'Templates', path: '/prescriptions/templates' },
      { label: 'AI Suggestions', path: '/prescriptions/ai-suggestions' },
      { label: 'Doctor Dashboard', path: '/prescriptions/doctor-dashboard' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    path: '/finance',
    color: 'from-emerald-500 to-emerald-600',
    children: [
      { label: 'Sales Ledger', path: '/finance/sales-ledger' },
      { label: 'Purchase Ledger', path: '/finance/purchase-ledger' },
      { label: 'Cash Book', path: '/finance/cashbook' },
      { label: 'Bank Book', path: '/finance/bankbook' },
      { label: 'Expenses', path: '/finance/expenses' },
      { label: 'GST Reports', path: '/finance/gst' },
      { label: 'Trial Balance', path: '/finance/trial-balance' },
      { label: 'P&L Statement', path: '/finance/pl' },
      { label: 'Balance Sheet', path: '/finance/balance-sheet' },
    ]
  },
  {
    id: 'hr',
    label: 'HR & Staff',
    icon: UserCheck,
    path: '/hr',
    color: 'from-violet-500 to-violet-600',
    children: [
      { label: 'Employees', path: '/hr/employees' },
      { label: 'Attendance', path: '/hr/attendance' },
      { label: 'Leave Management', path: '/hr/leaves' },
      { label: 'Payroll', path: '/hr/payroll' },
      { label: 'Incentives', path: '/hr/incentives' },
      { label: 'Shifts', path: '/hr/shifts' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    color: 'from-amber-500 to-amber-600',
    children: [
      { label: 'Sales Reports', path: '/reports/sales' },
      { label: 'Purchase Reports', path: '/reports/purchase' },
      { label: 'Stock Reports', path: '/reports/stock' },
      { label: 'Expiry Reports', path: '/reports/expiry' },
      { label: 'Profit Reports', path: '/reports/profit' },
      { label: 'GST Reports', path: '/reports/gst' },
      { label: 'Custom Reports', path: '/reports/custom' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    color: 'from-rose-500 to-rose-600',
    children: [
      { label: 'KPI Dashboard', path: '/analytics/kpi' },
      { label: 'Sales Analytics', path: '/analytics/sales-purchase' },
      { label: 'Product Performance', path: '/analytics/products' },
      { label: 'Branch Performance', path: '/analytics/branches' },
      { label: 'Forecasting', path: '/analytics/forecasting' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    path: '/marketing',
    color: 'from-fuchsia-500 to-fuchsia-600',
    children: [
      { label: 'Campaigns', path: '/marketing/campaigns' },
      { label: 'WhatsApp', path: '/marketing/whatsapp' },
      { label: 'SMS', path: '/marketing/sms' },
      { label: 'Email', path: '/marketing/email' },
      { label: 'Offers', path: '/marketing/offers' },
      { label: 'AI Campaigns', path: '/marketing/ai-campaigns' },
    ]
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: Share2,
    path: '/social',
    color: 'from-sky-500 to-sky-600',
    children: [
      { label: 'Post Scheduler', path: '/social/scheduler' },
      { label: 'GMB', path: '/social/gmb' },
      { label: 'Instagram', path: '/social/instagram' },
      { label: 'AI Content', path: '/social/ai-content' },
    ]
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Brain,
    path: '/ai',
    color: 'from-purple-600 to-pink-600',
    badge: 'AI',
    children: [
      { label: 'AI Chat', path: '/ai/chat' },
      { label: 'Demand Forecast', path: '/ai/forecasting' },
      { label: 'Sales Insights', path: '/ai/sales-insights' },
      { label: 'PO Generator', path: '/ai/po-generator' },
      { label: 'Price Optimization', path: '/ai/pricing' },
      { label: 'Content Writer', path: '/ai/content' },
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    path: '/manufacturing',
    color: 'from-slate-500 to-slate-600',
    children: [
      { label: 'Manufacturing Orders', path: '/manufacturing/orders' },
      { label: 'BOM', path: '/manufacturing/bom' },
      { label: 'Production Batches', path: '/manufacturing/batches' },
      { label: 'Warehouse', path: '/manufacturing/warehouse' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    color: 'from-gray-500 to-gray-600',
    children: [
      { label: 'Company Profile', path: '/settings/company' },
      { label: 'Branches', path: '/settings/branches' },
      { label: 'Roles & Permissions', path: '/settings/roles' },
      { label: 'Tax Settings', path: '/settings/tax' },
      { label: 'Integrations', path: '/settings/integrations' },
      { label: 'Backup', path: '/settings/backup' },
    ]
  },
];

export default function FinalLeftSidebar({ isOpen, onClose }: FinalLeftSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.children?.some(child => child.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white flex flex-col shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-500/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
          <input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-blue-500/30 border border-blue-400/30 rounded-lg text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const isExpanded = expandedItems.includes(item.id);
          const isActive = pathname?.startsWith(item.path);
          const Icon = item.icon;

          return (
            <div key={item.id}>
              {/* Main Menu Item */}
              <button
                onClick={() => item.children ? toggleExpand(item.id) : null}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-white text-blue-700 shadow-lg' : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'}
                `}
              >
                <div className={`
                  p-2 rounded-lg bg-gradient-to-br ${item.color} 
                  ${isActive ? 'shadow-md' : 'opacity-80 group-hover:opacity-100'}
                `}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <span className="flex-1 font-medium text-sm text-left">{item.label}</span>
                
                {item.badge && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {item.children && (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                )}
              </button>

              {/* Submenu Items */}
              {item.children && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={`
                          block px-4 py-2 text-sm rounded-lg transition-colors
                          ${isChildActive 
                            ? 'bg-blue-500/50 text-white font-medium' 
                            : 'text-blue-200 hover:bg-blue-500/30 hover:text-white'
                          }
                        `}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-blue-500/30">
        <div className="bg-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-100 font-medium">HomeoERP v2.1.0</p>
          <p className="text-xs text-blue-200/70 mt-1">© 2025 Yeelo</p>
        </div>
      </div>
    </aside>
  );
}
