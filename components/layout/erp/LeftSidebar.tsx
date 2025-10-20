'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  UserCheck,
  Megaphone,
  Brain,
  TrendingUp,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Pill,
  Beaker,
  FlaskConical,
  Droplet,
  BookOpen,
  Stethoscope,
  Activity
} from 'lucide-react';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

// Homeopathy-specific menu structure
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/app/dashboard',
  },
  {
    id: 'medicines',
    label: 'Medicines',
    icon: Pill,
    path: '/app/medicines',
    children: [
      { id: 'medicines-list', label: 'Medicine List', icon: null, path: '/app/medicines/list' },
      { id: 'medicines-add', label: 'Add Medicine', icon: null, path: '/app/medicines/add' },
      { id: 'potencies', label: 'Potencies', icon: null, path: '/app/medicines/potencies' },
      { id: 'mother-tinctures', label: 'Mother Tinctures', icon: null, path: '/app/medicines/mother-tinctures' },
      { id: 'biochemic', label: 'Biochemic Salts', icon: null, path: '/app/medicines/biochemic' },
      { id: 'combinations', label: 'Combinations', icon: null, path: '/app/medicines/combinations' },
      { id: 'dilutions', label: 'Dilutions', icon: null, path: '/app/medicines/dilutions' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    path: '/app/inventory',
    children: [
      { id: 'stock-list', label: 'Stock List', icon: null, path: '/app/inventory/stock-list' },
      { id: 'batch-management', label: 'Batch Management', icon: null, path: '/app/inventory/batches' },
      { id: 'expiry-tracking', label: 'Expiry Tracking', icon: null, path: '/app/inventory/expiry' },
      { id: 'stock-adjustments', label: 'Stock Adjustments', icon: null, path: '/app/inventory/adjustments' },
      { id: 'stock-transfers', label: 'Stock Transfers', icon: null, path: '/app/inventory/transfers' },
      { id: 'reconciliation', label: 'Reconciliation', icon: null, path: '/app/inventory/reconciliation' },
      { id: 'low-stock-alerts', label: 'Low Stock Alerts', icon: null, path: '/app/inventory/alerts' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    path: '/app/sales',
    children: [
      { id: 'pos', label: 'POS Billing', icon: null, path: '/app/sales/pos', badge: 'Hot' },
      { id: 'prescriptions', label: 'Prescriptions', icon: null, path: '/app/sales/prescriptions' },
      { id: 'sales-orders', label: 'Sales Orders', icon: null, path: '/app/sales/orders' },
      { id: 'invoices', label: 'Invoices', icon: null, path: '/app/sales/invoices' },
      { id: 'sales-returns', label: 'Sales Returns', icon: null, path: '/app/sales/returns' },
      { id: 'credit-sales', label: 'Credit Sales/Dues', icon: null, path: '/app/sales/credit' },
      { id: 'quotations', label: 'Quotations', icon: null, path: '/app/sales/quotations' },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingBag,
    path: '/app/purchases',
    children: [
      { id: 'purchase-orders', label: 'Purchase Orders', icon: null, path: '/app/purchases/orders' },
      { id: 'grn', label: 'Goods Receipt (GRN)', icon: null, path: '/app/purchases/grn' },
      { id: 'purchase-invoices', label: 'Purchase Invoices', icon: null, path: '/app/purchases/invoices' },
      { id: 'purchase-returns', label: 'Purchase Returns', icon: null, path: '/app/purchases/returns' },
      { id: 'vendor-pricing', label: 'Vendor Pricing', icon: null, path: '/app/purchases/pricing' },
    ],
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Stethoscope,
    path: '/app/patients',
    children: [
      { id: 'patient-list', label: 'Patient List', icon: null, path: '/app/patients/list' },
      { id: 'add-patient', label: 'Add Patient', icon: null, path: '/app/patients/add' },
      { id: 'case-history', label: 'Case History', icon: null, path: '/app/patients/case-history' },
      { id: 'follow-ups', label: 'Follow-ups', icon: null, path: '/app/patients/follow-ups' },
      { id: 'patient-groups', label: 'Patient Groups', icon: null, path: '/app/patients/groups' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/app/customers',
    children: [
      { id: 'customer-list', label: 'Customer List', icon: null, path: '/app/customers/list' },
      { id: 'add-customer', label: 'Add Customer', icon: null, path: '/app/customers/add' },
      { id: 'customer-groups', label: 'Customer Groups', icon: null, path: '/app/customers/groups' },
      { id: 'loyalty-program', label: 'Loyalty Program', icon: null, path: '/app/customers/loyalty' },
    ],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Truck,
    path: '/app/vendors',
    children: [
      { id: 'vendor-list', label: 'Vendor List', icon: null, path: '/app/vendors/list' },
      { id: 'add-vendor', label: 'Add Vendor', icon: null, path: '/app/vendors/add' },
      { id: 'vendor-performance', label: 'Vendor Performance', icon: null, path: '/app/vendors/performance' },
      { id: 'vendor-payments', label: 'Vendor Payments', icon: null, path: '/app/vendors/payments' },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Beaker,
    path: '/app/manufacturing',
    children: [
      { id: 'formulations', label: 'Formulations', icon: null, path: '/app/manufacturing/formulations' },
      { id: 'production-orders', label: 'Production Orders', icon: null, path: '/app/manufacturing/orders' },
      { id: 'raw-materials', label: 'Raw Materials', icon: null, path: '/app/manufacturing/raw-materials' },
      { id: 'quality-control', label: 'Quality Control', icon: null, path: '/app/manufacturing/quality' },
      { id: 'batch-production', label: 'Batch Production', icon: null, path: '/app/manufacturing/batch' },
    ],
  },
  {
    id: 'laboratory',
    label: 'Laboratory',
    icon: FlaskConical,
    path: '/app/laboratory',
    children: [
      { id: 'lab-tests', label: 'Lab Tests', icon: null, path: '/app/laboratory/tests' },
      { id: 'test-results', label: 'Test Results', icon: null, path: '/app/laboratory/results' },
      { id: 'lab-equipment', label: 'Equipment', icon: null, path: '/app/laboratory/equipment' },
      { id: 'reagents', label: 'Reagents', icon: null, path: '/app/laboratory/reagents' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    path: '/app/finance',
    children: [
      { id: 'ledgers', label: 'Ledgers', icon: null, path: '/app/finance/ledgers' },
      { id: 'gst-tax', label: 'GST/Tax Management', icon: null, path: '/app/finance/gst' },
      { id: 'eway-bills', label: 'E-Way Bills', icon: null, path: '/app/finance/eway-bills' },
      { id: 'pl-statement', label: 'P&L Statement', icon: null, path: '/app/finance/pl' },
      { id: 'balance-sheet', label: 'Balance Sheet', icon: null, path: '/app/finance/balance-sheet' },
      { id: 'payments', label: 'Payments', icon: null, path: '/app/finance/payments' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: UserCheck,
    path: '/app/hr',
    children: [
      { id: 'employees', label: 'Employees', icon: null, path: '/app/hr/employees' },
      { id: 'attendance', label: 'Attendance', icon: null, path: '/app/hr/attendance' },
      { id: 'payroll', label: 'Payroll', icon: null, path: '/app/hr/payroll' },
      { id: 'shifts', label: 'Shift Management', icon: null, path: '/app/hr/shifts' },
      { id: 'leave', label: 'Leave Management', icon: null, path: '/app/hr/leave' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    path: '/app/marketing',
    children: [
      { id: 'campaigns', label: 'Campaigns', icon: null, path: '/app/marketing/campaigns' },
      { id: 'templates', label: 'Message Templates', icon: null, path: '/app/marketing/templates' },
      { id: 'bulk-send', label: 'Bulk Send', icon: null, path: '/app/marketing/bulk-send' },
      { id: 'email-marketing', label: 'Email Marketing', icon: null, path: '/app/marketing/email' },
      { id: 'sms-campaigns', label: 'SMS Campaigns', icon: null, path: '/app/marketing/sms' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: BookOpen,
    path: '/app/knowledge',
    children: [
      { id: 'materia-medica', label: 'Materia Medica', icon: null, path: '/app/knowledge/materia-medica' },
      { id: 'repertory', label: 'Repertory', icon: null, path: '/app/knowledge/repertory' },
      { id: 'case-studies', label: 'Case Studies', icon: null, path: '/app/knowledge/case-studies' },
      { id: 'research', label: 'Research Papers', icon: null, path: '/app/knowledge/research' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Brain,
    path: '/app/ai',
    badge: 'New',
    children: [
      { id: 'ai-chat', label: 'AI Chat', icon: null, path: '/app/ai/chat' },
      { id: 'prescription-ai', label: 'Prescription AI', icon: null, path: '/app/ai/prescription' },
      { id: 'remedy-finder', label: 'Remedy Finder', icon: null, path: '/app/ai/remedy-finder' },
      { id: 'campaign-generator', label: 'Campaign Generator', icon: null, path: '/app/ai/campaigns' },
      { id: 'insights', label: 'Business Insights', icon: null, path: '/app/ai/insights' },
      { id: 'forecast', label: 'Sales Forecasting', icon: null, path: '/app/ai/forecast' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    path: '/app/analytics',
    children: [
      { id: 'kpis', label: 'KPI Dashboard', icon: null, path: '/app/analytics/kpis' },
      { id: 'sales-analytics', label: 'Sales Analytics', icon: null, path: '/app/analytics/sales' },
      { id: 'inventory-analytics', label: 'Inventory Analytics', icon: null, path: '/app/analytics/inventory' },
      { id: 'patient-analytics', label: 'Patient Analytics', icon: null, path: '/app/analytics/patients' },
      { id: 'financial-analytics', label: 'Financial Analytics', icon: null, path: '/app/analytics/financial' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/app/reports',
    children: [
      { id: 'sales-reports', label: 'Sales Reports', icon: null, path: '/app/reports/sales' },
      { id: 'purchase-reports', label: 'Purchase Reports', icon: null, path: '/app/reports/purchases' },
      { id: 'inventory-reports', label: 'Inventory Reports', icon: null, path: '/app/reports/inventory' },
      { id: 'financial-reports', label: 'Financial Reports', icon: null, path: '/app/reports/finance' },
      { id: 'patient-reports', label: 'Patient Reports', icon: null, path: '/app/reports/patients' },
      { id: 'custom-reports', label: 'Custom Reports', icon: null, path: '/app/reports/custom' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/app/settings',
    children: [
      { id: 'company', label: 'Company Profile', icon: null, path: '/app/settings/company' },
      { id: 'branches', label: 'Branches', icon: null, path: '/app/settings/branches' },
      { id: 'users', label: 'Users', icon: null, path: '/app/settings/users' },
      { id: 'roles', label: 'Roles & Permissions', icon: null, path: '/app/settings/roles' },
      { id: 'layout', label: 'Layout Preferences', icon: null, path: '/app/settings/layout' },
      { id: 'integrations', label: 'Integrations', icon: null, path: '/app/settings/integrations' },
      { id: 'backup', label: 'Backup & Restore', icon: null, path: '/app/settings/backup' },
    ],
  },
];

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <nav className="space-y-1">
            {filteredMenuItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                pathname={pathname}
                expandedItems={expandedItems}
                onToggleExpand={toggleExpand}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

interface MenuItemProps {
  item: MenuItem;
  pathname: string;
  expandedItems: string[];
  onToggleExpand: (itemId: string) => void;
  level?: number;
}

function MenuItem({
  item,
  pathname,
  expandedItems,
  onToggleExpand,
  level = 0,
}: MenuItemProps) {
  const isExpanded = expandedItems.includes(item.id);
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
  const hasChildren = item.children && item.children.length > 0;

  const Icon = item.icon;

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => onToggleExpand(item.id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${level > 0 ? 'pl-10' : ''}`}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
            <span>{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
        </button>
      ) : (
        <Link
          href={item.path}
          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${level > 0 ? 'pl-10' : ''}`}
        >
          {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
          <span>{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full ml-auto">
              {item.badge}
            </span>
          )}
        </Link>
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
