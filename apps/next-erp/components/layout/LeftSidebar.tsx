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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/app/dashboard',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/app/products',
    children: [
      { id: 'products-list', label: 'Product List', icon: null, path: '/app/products/list' },
      { id: 'products-add', label: 'Add Product', icon: null, path: '/app/products/add' },
      { id: 'products-categories', label: 'Categories', icon: null, path: '/app/products/categories' },
      { id: 'products-brands', label: 'Brands', icon: null, path: '/app/products/brands' },
      { id: 'products-barcodes', label: 'Barcode Manager', icon: null, path: '/app/products/barcodes' },
      { id: 'products-import', label: 'Bulk Import/Export', icon: null, path: '/app/products/import' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    path: '/app/inventory',
    children: [
      { id: 'inventory-stock', label: 'Stock List', icon: null, path: '/app/inventory/stock-list' },
      { id: 'inventory-adjustments', label: 'Stock Adjustments', icon: null, path: '/app/inventory/adjustments' },
      { id: 'inventory-transfers', label: 'Stock Transfers', icon: null, path: '/app/inventory/transfers' },
      { id: 'inventory-batches', label: 'Batch/Expiry', icon: null, path: '/app/inventory/batches' },
      { id: 'inventory-reconciliation', label: 'Reconciliation', icon: null, path: '/app/inventory/reconciliation' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    path: '/app/sales',
    children: [
      { id: 'sales-pos', label: 'POS Billing', icon: null, path: '/app/sales/pos', badge: 'Hot' },
      { id: 'sales-orders', label: 'Sales Orders', icon: null, path: '/app/sales/orders' },
      { id: 'sales-invoices', label: 'Invoices', icon: null, path: '/app/sales/invoices' },
      { id: 'sales-returns', label: 'Sales Returns', icon: null, path: '/app/sales/returns' },
      { id: 'sales-credit', label: 'Credit Sales/Dues', icon: null, path: '/app/sales/credit' },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingBag,
    path: '/app/purchases',
    children: [
      { id: 'purchases-orders', label: 'Purchase Orders', icon: null, path: '/app/purchases/orders' },
      { id: 'purchases-grn', label: 'Goods Receipt (GRN)', icon: null, path: '/app/purchases/grn' },
      { id: 'purchases-invoices', label: 'Purchase Invoices', icon: null, path: '/app/purchases/invoices' },
      { id: 'purchases-returns', label: 'Purchase Returns', icon: null, path: '/app/purchases/returns' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/app/customers',
    children: [
      { id: 'customers-list', label: 'Customer List', icon: null, path: '/app/customers/list' },
      { id: 'customers-add', label: 'Add Customer', icon: null, path: '/app/customers/add' },
      { id: 'customers-groups', label: 'Customer Groups', icon: null, path: '/app/customers/groups' },
      { id: 'customers-loyalty', label: 'Loyalty Program', icon: null, path: '/app/customers/loyalty' },
    ],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Truck,
    path: '/app/vendors',
    children: [
      { id: 'vendors-list', label: 'Vendor List', icon: null, path: '/app/vendors/list' },
      { id: 'vendors-add', label: 'Add Vendor', icon: null, path: '/app/vendors/add' },
      { id: 'vendors-performance', label: 'Vendor Performance', icon: null, path: '/app/vendors/performance' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    path: '/app/finance',
    children: [
      { id: 'finance-ledgers', label: 'Ledgers', icon: null, path: '/app/finance/ledgers' },
      { id: 'finance-gst', label: 'GST/Tax Management', icon: null, path: '/app/finance/gst' },
      { id: 'finance-eway', label: 'E-Way Bills', icon: null, path: '/app/finance/eway-bills' },
      { id: 'finance-pl', label: 'P&L Statement', icon: null, path: '/app/finance/pl' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: UserCheck,
    path: '/app/hr',
    children: [
      { id: 'hr-employees', label: 'Employees', icon: null, path: '/app/hr/employees' },
      { id: 'hr-attendance', label: 'Attendance', icon: null, path: '/app/hr/attendance' },
      { id: 'hr-payroll', label: 'Payroll', icon: null, path: '/app/hr/payroll' },
      { id: 'hr-shifts', label: 'Shift Management', icon: null, path: '/app/hr/shifts' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    path: '/app/marketing',
    children: [
      { id: 'marketing-campaigns', label: 'Campaigns', icon: null, path: '/app/marketing/campaigns' },
      { id: 'marketing-templates', label: 'Message Templates', icon: null, path: '/app/marketing/templates' },
      { id: 'marketing-bulk-send', label: 'Bulk Send', icon: null, path: '/app/marketing/bulk-send' },
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
      { id: 'ai-campaigns', label: 'Campaign Generator', icon: null, path: '/app/ai/campaigns' },
      { id: 'ai-insights', label: 'Business Insights', icon: null, path: '/app/ai/insights' },
      { id: 'ai-forecast', label: 'Sales Forecasting', icon: null, path: '/app/ai/forecast' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    path: '/app/analytics',
    children: [
      { id: 'analytics-kpis', label: 'KPI Dashboard', icon: null, path: '/app/analytics/kpis' },
      { id: 'analytics-sales', label: 'Sales Analytics', icon: null, path: '/app/analytics/sales' },
      { id: 'analytics-inventory', label: 'Inventory Analytics', icon: null, path: '/app/analytics/inventory' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/app/reports',
    children: [
      { id: 'reports-sales', label: 'Sales Reports', icon: null, path: '/app/reports/sales' },
      { id: 'reports-purchases', label: 'Purchase Reports', icon: null, path: '/app/reports/purchases' },
      { id: 'reports-inventory', label: 'Inventory Reports', icon: null, path: '/app/reports/inventory' },
      { id: 'reports-finance', label: 'Financial Reports', icon: null, path: '/app/reports/finance' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/app/settings',
    children: [
      { id: 'settings-company', label: 'Company Profile', icon: null, path: '/app/settings/company' },
      { id: 'settings-branches', label: 'Branches', icon: null, path: '/app/settings/branches' },
      { id: 'settings-users', label: 'Users', icon: null, path: '/app/settings/users' },
      { id: 'settings-roles', label: 'Roles & Permissions', icon: null, path: '/app/settings/roles' },
      { id: 'settings-integrations', label: 'Integrations', icon: null, path: '/app/settings/integrations' },
    ],
  },
];

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
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
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 pb-4">
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
        </ScrollArea>
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
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            level > 0 && 'pl-10'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <Link
          href={item.path}
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            level > 0 && 'pl-10'
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {item.badge}
            </Badge>
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
