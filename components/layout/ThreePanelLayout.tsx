'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, ChevronRight, Menu, X, Bell, Search, Settings, 
  User, LogOut, Home, Plus, List, LayoutDashboard, ShoppingCart,
  Package, Users, TrendingUp, DollarSign, FileText, Truck, Factory
} from 'lucide-react';

interface ThreePanelLayoutProps {
  children: React.ReactNode;
}

// Left Sidebar Main Menus with Submenus
const leftSidebarMenus = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    submenus: [
      { title: 'Main Dashboard', path: '/dashboard', icon: Home },
      { title: 'Sales Dashboard', path: '/dashboards/sales', icon: ShoppingCart },
      { title: 'Purchase Dashboard', path: '/dashboards/purchase', icon: Package },
      { title: 'Finance Dashboard', path: '/dashboards/finance', icon: DollarSign },
      { title: 'Inventory Dashboard', path: '/dashboards/inventory', icon: Package },
      { title: 'Order Dashboard', path: '/dashboards/orders', icon: FileText },
      { title: 'Supplier Dashboard', path: '/dashboards/suppliers', icon: Truck },
      { title: 'Customer Dashboard', path: '/dashboards/customers', icon: Users },
      { title: 'Analytics Dashboard', path: '/dashboards/analytics', icon: TrendingUp },
    ]
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    submenus: [
      { title: 'Product List', path: '/products', icon: List },
      { title: 'Add Product', path: '/products/add', icon: Plus },
      { title: 'Categories', path: '/products/categories', icon: List },
      { title: 'Brands', path: '/products/brands', icon: List },
      { title: 'Batches', path: '/products/batches', icon: List },
      { title: 'Price Management', path: '/products/pricing', icon: DollarSign },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Factory,
    submenus: [
      { title: 'Stock List', path: '/inventory/stock', icon: List },
      { title: 'Stock Adjustments', path: '/inventory/adjustments', icon: Plus },
      { title: 'Stock Transfers', path: '/inventory/transfers', icon: Truck },
      { title: 'Low Stock Report', path: '/inventory/low-stock', icon: FileText },
      { title: 'Batch Tracking', path: '/inventory/batches', icon: List },
    ]
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    submenus: [
      { title: 'POS', path: '/pos', icon: Plus },
      { title: 'Sales Invoices', path: '/sales/invoices', icon: List },
      { title: 'Sales Orders', path: '/sales/orders', icon: FileText },
      { title: 'Credit Sales', path: '/sales/credit', icon: DollarSign },
      { title: 'Returns', path: '/sales/returns', icon: List },
    ]
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: Truck,
    submenus: [
      { title: 'Purchase Orders', path: '/purchases', icon: List },
      { title: 'Create PO', path: '/purchases/create', icon: Plus },
      { title: 'GRN', path: '/purchases/grn', icon: FileText },
      { title: 'Purchase Bills', path: '/purchases/bills', icon: List },
      { title: 'Vendor Payments', path: '/purchases/payments', icon: DollarSign },
    ]
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    submenus: [
      { title: 'Customer List', path: '/customers', icon: List },
      { title: 'Add Customer', path: '/customers/add', icon: Plus },
      { title: 'Customer Groups', path: '/customers/groups', icon: List },
      { title: 'Loyalty Points', path: '/customers/loyalty', icon: TrendingUp },
    ]
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: Truck,
    submenus: [
      { title: 'Vendor List', path: '/vendors', icon: List },
      { title: 'Add Vendor', path: '/vendors/add', icon: Plus },
      { title: 'Vendor Types', path: '/vendors/types', icon: List },
      { title: 'Outstanding', path: '/vendors/outstanding', icon: DollarSign },
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: DollarSign,
    submenus: [
      { title: 'Sales Ledger', path: '/finance/sales-ledger', icon: FileText },
      { title: 'Purchase Ledger', path: '/finance/purchase-ledger', icon: FileText },
      { title: 'Cash Book', path: '/finance/cashbook', icon: List },
      { title: 'Expenses', path: '/finance/expenses', icon: List },
      { title: 'GST Reports', path: '/finance/gst', icon: FileText },
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: FileText,
    submenus: [
      { title: 'Sales Reports', path: '/reports/sales', icon: ShoppingCart },
      { title: 'Purchase Reports', path: '/reports/purchase', icon: Truck },
      { title: 'Stock Reports', path: '/reports/stock', icon: Package },
      { title: 'Financial Reports', path: '/reports/financial', icon: DollarSign },
    ]
  },
];

// Right Sidebar Quick Access
const rightSidebarQuickAccess = {
  masters: [
    { title: 'Add Product', path: '/products/add', icon: Package },
    { title: 'Add Customer', path: '/customers/add', icon: Users },
    { title: 'Add Vendor', path: '/vendors/add', icon: Truck },
    { title: 'Add Category', path: '/masters/categories/add', icon: Plus },
    { title: 'Add Brand', path: '/masters/brands/add', icon: Plus },
    { title: 'Add Branch', path: '/masters/branches/add', icon: Plus },
  ],
  quickViews: [
    { title: 'Product List', path: '/products', icon: List },
    { title: 'Customer List', path: '/customers', icon: List },
    { title: 'Vendor List', path: '/vendors', icon: List },
    { title: 'Sales Invoices', path: '/sales/invoices', icon: List },
    { title: 'Purchase Orders', path: '/purchases', icon: List },
    { title: 'Stock List', path: '/inventory/stock', icon: List },
  ]
};

export default function ThreePanelLayout({ children }: ThreePanelLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const pathname = usePathname();

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR - Main Menus with Submenus */}
      <aside className={`${leftOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r shadow-sm overflow-hidden flex flex-col`}>
        {leftOpen && (
          <>
            {/* Logo */}
            <div className="p-4 border-b">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="text-2xl">🏥</div>
                <div>
                  <h1 className="text-lg font-bold text-blue-600">Yeelo ERP</h1>
                  <p className="text-xs text-gray-500">Homeopathy</p>
                </div>
              </Link>
            </div>

            {/* Scrollable Menu */}
            <div className="flex-1 overflow-y-auto py-4">
              {leftSidebarMenus.map((menu) => {
                const Icon = menu.icon;
                const isExpanded = expandedMenus.includes(menu.id);
                
                return (
                  <div key={menu.id} className="mb-1">
                    {/* Parent Menu */}
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">{menu.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {/* Submenus */}
                    {isExpanded && (
                      <div className="bg-gray-50">
                        {menu.submenus.map((submenu) => {
                          const SubIcon = submenu.icon;
                          const isActive = pathname === submenu.path;
                          
                          return (
                            <Link
                              key={submenu.path}
                              href={submenu.path}
                              className={`flex items-center gap-3 px-4 py-2 pl-12 text-sm transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              {submenu.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR - Lightweight */}
        <header className="h-14 bg-white border-b shadow-sm flex items-center justify-between px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb or Quick Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/pos" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                + New Sale
              </Link>
              <Link href="/purchases/create" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                + New PO
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* RIGHT SIDEBAR - Quick Access */}
      <aside className={`${rightOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-l shadow-sm overflow-hidden flex flex-col`}>
        {rightOpen && (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800">Quick Access</h3>
              <p className="text-xs text-gray-500">Create & View</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Create Masters */}
              <div className="mb-6">
                <div className="px-4 mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Create New</h4>
                </div>
                {rightSidebarQuickAccess.masters.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>

              {/* Quick Views */}
              <div>
                <div className="px-4 mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Quick Views</h4>
                </div>
                {rightSidebarQuickAccess.quickViews.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
