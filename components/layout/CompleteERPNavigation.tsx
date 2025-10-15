'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, X, ChevronDown, Search, Settings, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// TOP BAR - 10 Major Business Modules
const topMenus = {
  sales: {
    title: 'Sales',
    icon: '💰',
    items: [
      { name: 'POS', path: '/pos', desc: 'Point of Sale' },
      { name: 'Sales Invoices', path: '/sales', desc: 'All invoices' },
      { name: 'Sales Orders', path: '/sales/orders', desc: 'Quotations' },
      { name: 'Returns', path: '/sales/returns', desc: 'Credit notes' },
      { name: 'Receipts', path: '/sales/receipts', desc: 'Payments' },
    ]
  },
  purchases: {
    title: 'Purchases',
    icon: '🛒',
    items: [
      { name: 'Purchase Orders', path: '/purchases', desc: 'PO management' },
      { name: 'GRN', path: '/purchases/grn', desc: 'Goods receipt' },
      { name: 'Bills', path: '/purchases/bills', desc: 'Invoices' },
      { name: 'Payments', path: '/purchases/payments', desc: 'Vendor payments' },
      { name: 'Returns', path: '/purchases/returns', desc: 'Purchase returns' },
    ]
  },
  inventory: {
    title: 'Inventory',
    icon: '📦',
    items: [
      { name: 'Stock List', path: '/inventory', desc: 'All inventory' },
      { name: 'Batches', path: '/inventory/batches', desc: 'Batch tracking' },
      { name: 'Transfers', path: '/inventory/transfers', desc: 'Branch transfer' },
      { name: 'Adjustments', path: '/inventory/adjustments', desc: 'Stock adjust' },
      { name: 'Warehouse', path: '/warehouse', desc: 'Warehouse mgmt' },
    ]
  },
  customers: {
    title: 'Customers',
    icon: '👥',
    items: [
      { name: 'Customer List', path: '/customers', desc: 'All customers' },
      { name: 'Groups', path: '/customers/groups', desc: 'B2B/Retail' },
      { name: 'Loyalty', path: '/loyalty', desc: 'Points program' },
      { name: 'Outstanding', path: '/customers/outstanding', desc: 'Credit mgmt' },
      { name: 'Feedback', path: '/customers/feedback', desc: 'Reviews' },
    ]
  },
  vendors: {
    title: 'Vendors',
    icon: '🏭',
    items: [
      { name: 'Vendor List', path: '/vendors', desc: 'All suppliers' },
      { name: 'Types', path: '/vendors/types', desc: 'Manufacturer/Dist' },
      { name: 'Outstanding', path: '/vendors/outstanding', desc: 'Payments due' },
      { name: 'Performance', path: '/vendors/performance', desc: 'Rating' },
      { name: 'Terms', path: '/vendors/terms', desc: 'Agreements' },
    ]
  },
  reports: {
    title: 'Reports',
    icon: '📊',
    items: [
      { name: 'Sales Reports', path: '/reports', desc: 'Sales analytics' },
      { name: 'Purchase Reports', path: '/reports/purchase', desc: 'Purchase data' },
      { name: 'Stock Reports', path: '/reports/stock', desc: 'Inventory' },
      { name: 'GST Reports', path: '/reports/gst', desc: 'Tax reports' },
      { name: 'Custom Reports', path: '/reports/custom', desc: 'Report builder' },
    ]
  },
  finance: {
    title: 'Finance',
    icon: '💵',
    items: [
      { name: 'Dashboard', path: '/finance', desc: 'Financial overview' },
      { name: 'Ledger', path: '/finance/ledger', desc: 'Account ledger' },
      { name: 'Cash Book', path: '/finance/cashbook', desc: 'Cash/Bank' },
      { name: 'Expenses', path: '/finance/expenses', desc: 'Expense mgmt' },
      { name: 'P&L', path: '/finance/pl', desc: 'Profit & Loss' },
      { name: 'Balance Sheet', path: '/finance/balance', desc: 'Balance sheet' },
    ]
  },
  marketing: {
    title: 'Marketing',
    icon: '📢',
    items: [
      { name: 'Campaigns', path: '/marketing', desc: 'All campaigns' },
      { name: 'WhatsApp', path: '/marketing/whatsapp', desc: 'Bulk messages' },
      { name: 'SMS', path: '/marketing/sms', desc: 'SMS campaigns' },
      { name: 'Email', path: '/email', desc: 'Email marketing' },
      { name: 'Segments', path: '/marketing/segments', desc: 'Customer groups' },
    ]
  },
  ai: {
    title: 'AI Tools',
    icon: '🤖',
    items: [
      { name: 'AI Chat', path: '/ai-chat', desc: 'Business assistant' },
      { name: 'AI Insights', path: '/ai-insights', desc: 'Smart analytics' },
      { name: 'AI Campaigns', path: '/ai-campaigns', desc: 'Auto campaigns' },
      { name: 'Forecasting', path: '/ai/forecasting', desc: 'Demand predict' },
      { name: 'Pricing', path: '/ai/pricing', desc: 'Smart pricing' },
      { name: 'Content', path: '/ai/content', desc: 'AI writer' },
    ]
  },
  more: {
    title: 'More',
    icon: '⋯',
    items: [
      { name: 'HR & Staff', path: '/hr', desc: 'Employee mgmt' },
      { name: 'Manufacturing', path: '/manufacturing', desc: 'Production' },
      { name: 'Delivery', path: '/delivery', desc: 'Logistics' },
      { name: 'CRM Service', path: '/crm', desc: 'Customer service' },
      { name: 'Social Media', path: '/social', desc: 'Auto posting' },
    ]
  },
};

// LEFT SIDEBAR - Quick Access (Most Used)
const leftMenu = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊', badge: null },
  { name: 'Products', path: '/products', icon: '📦', badge: null },
  { name: 'Master Data', path: '/master', icon: '🗂️', badge: null },
  { name: 'POS', path: '/pos', icon: '💳', badge: 'HOT' },
  { name: 'Customers', path: '/customers', icon: '👥', badge: null },
  { name: 'Vendors', path: '/vendors', icon: '🏭', badge: null },
  { name: 'Quick Reports', path: '/reports', icon: '📊', badge: null },
  { name: 'AI Assistant', path: '/ai-chat', icon: '🤖', badge: 'NEW' },
  { name: 'Analytics', path: '/analytics', icon: '📈', badge: null },
  { name: 'Settings', path: '/settings', icon: '⚙️', badge: null },
];

// RIGHT SIDEBAR - Notifications + Quick Actions
const notifications = [
  { title: 'Low Stock Alert', desc: '15 products below minimum', type: 'warning', time: '2m ago' },
  { title: 'New Orders', desc: '3 new orders received', type: 'info', time: '5m ago' },
  { title: 'Expiry Alert', desc: '8 batches expiring in 30 days', type: 'danger', time: '10m ago' },
  { title: 'Payment Due', desc: '₹45,000 payment pending', type: 'warning', time: '1h ago' },
];

const quickActions = [
  { name: 'New Sale', icon: '💰', path: '/pos' },
  { name: 'Add Product', icon: '📦', path: '/products' },
  { name: 'Stock Transfer', icon: '🔄', path: '/inventory/transfers' },
  { name: 'Create Campaign', icon: '📢', path: '/marketing' },
  { name: 'AI Insights', icon: '🤖', path: '/ai-insights' },
  { name: 'Reports', icon: '📊', path: '/reports' },
];

export default function CompleteERPNavigation({ children }: LayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Skip layout for login page
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BAR */}
      <header className="bg-white border-b-2 border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🏥</span>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Yeelo ERP
                </h1>
                <p className="text-xs text-gray-500">Complete Homeopathy Platform</p>
              </div>
            </Link>
          </div>

          {/* Center: Main Menus with Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1">
            {Object.entries(topMenus).map(([key, menu]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => setActiveDropdown(key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all ${
                    activeDropdown === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{menu.icon}</span>
                  <span>{menu.title}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                    activeDropdown === key ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {activeDropdown === key && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[220px] py-2 z-50">
                    {menu.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex flex-col px-4 py-2.5 hover:bg-blue-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Search + Notifications + Profile */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Search">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-lg transition-shadow">
              A
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex">
        {/* LEFT SIDEBAR */}
        {leftOpen && (
          <aside className="w-64 bg-white border-r shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-4 space-y-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 px-3">
                Quick Access
              </div>
              {leftMenu.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        item.badge === 'NEW' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        {rightOpen && (
          <aside className="w-80 bg-white border-l shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                <button 
                  onClick={() => setRightOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                      notif.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      notif.type === 'danger' ? 'border-red-500 bg-red-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900">{notif.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{notif.desc}</div>
                    <div className="text-xs text-gray-500 mt-2">{notif.time}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-sm text-gray-900 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.path}
                      href={action.path}
                      className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all hover:shadow-md"
                    >
                      <span className="text-2xl">{action.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 text-center">{action.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* User Menu */}
              <div className="border-t mt-4 pt-4 space-y-1">
                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
