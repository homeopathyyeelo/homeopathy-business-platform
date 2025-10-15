'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, Menu, X, Bell, Search, Settings, User, 
  LogOut, Shield, Activity, HelpCircle, ChevronRight
} from 'lucide-react';

interface NavigationProps {
  children: React.ReactNode;
}

// TOP BAR - Main Business Menus (6 key categories)
const topMenus = {
  sales: {
    title: 'Sales',
    icon: '💰',
    items: [
      { name: 'POS', path: '/pos', icon: '💳' },
      { name: 'Retail POS', path: '/retail-pos', icon: '🏪' },
      { name: 'Sales Invoices', path: '/sales', icon: '📝' },
      { name: 'Sales Orders', path: '/sales/orders', icon: '📋' },
      { name: 'Returns', path: '/sales/returns', icon: '↩️' },
    ]
  },
  purchases: {
    title: 'Purchases',
    icon: '🛒',
    items: [
      { name: 'Purchase Orders', path: '/purchases', icon: '📋' },
      { name: 'GRN', path: '/purchases/grn', icon: '📦' },
      { name: 'Bills', path: '/purchases/bills', icon: '📄' },
      { name: 'Payments', path: '/purchases/payments', icon: '💵' },
    ]
  },
  inventory: {
    title: 'Inventory',
    icon: '📦',
    items: [
      { name: 'Stock List', path: '/inventory', icon: '📋' },
      { name: 'Warehouse', path: '/warehouse', icon: '🏭' },
      { name: 'Stock Transfer', path: '/inventory/transfers', icon: '🔄' },
      { name: 'Stock Adjustment', path: '/inventory/adjustments', icon: '⚖️' },
    ]
  },
  reports: {
    title: 'Reports',
    icon: '📊',
    items: [
      { name: 'Sales Reports', path: '/reports', icon: '💰' },
      { name: 'Purchase Reports', path: '/reports/purchase', icon: '🛒' },
      { name: 'Stock Reports', path: '/reports/stock', icon: '📦' },
      { name: 'GST Reports', path: '/reports/gst', icon: '📋' },
    ]
  },
  finance: {
    title: 'Finance',
    icon: '💵',
    items: [
      { name: 'Dashboard', path: '/finance', icon: '📊' },
      { name: 'GST', path: '/gst', icon: '📋' },
      { name: 'Ledger', path: '/finance/ledger', icon: '📖' },
      { name: 'Expenses', path: '/finance/expenses', icon: '💸' },
    ]
  },
  more: {
    title: 'More',
    icon: '⋯',
    items: [
      { name: 'Manufacturing', path: '/manufacturing', icon: '⚙️' },
      { name: 'Delivery', path: '/delivery', icon: '🚚' },
      { name: 'HR', path: '/hr', icon: '👔' },
      { name: 'Analytics', path: '/analytics', icon: '📊' },
    ]
  },
};

// LEFT SIDEBAR - Daily Operations (Always visible)
const leftSidebarItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊', badge: null },
  { name: 'Products', path: '/products', icon: '📦', badge: null },
  { name: 'Master Data', path: '/master', icon: '🗂️', badge: null },
  { name: 'Customers', path: '/customers', icon: '👥', badge: null },
  { name: 'Vendors', path: '/vendors', icon: '🏭', badge: null },
  { name: 'Quick Stats', path: '/quick-stats', icon: '⚡', badge: null },
  { name: 'AI Chat', path: '/ai-chat', icon: '🤖', badge: 'NEW' },
  { name: 'CRM', path: '/crm', icon: '🎯', badge: null },
];

// RIGHT SIDEBAR - Settings & User
const rightSidebarSections = {
  notifications: [
    { title: 'Low Stock Alert', desc: '5 products running low', time: '2m ago', type: 'warning' },
    { title: 'New Order', desc: 'Order #1234 received', time: '5m ago', type: 'info' },
    { title: 'Expiry Alert', desc: '3 batches expiring soon', time: '10m ago', type: 'danger' },
  ],
  quickActions: [
    { name: 'New Sale', icon: '💰', path: '/pos' },
    { name: 'Add Product', icon: '📦', path: '/products' },
    { name: 'View Reports', icon: '📊', path: '/reports' },
    { name: 'Settings', icon: '⚙️', path: '/settings' },
  ]
};

export default function ThreePartNavigation({ children }: NavigationProps) {
  const [activeTopMenu, setActiveTopMenu] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-white border-b-2 border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <div>
                <h1 className="text-lg font-bold text-blue-600">Yeelo ERP</h1>
                <p className="text-xs text-gray-500">Homeopathy</p>
              </div>
            </Link>
          </div>

          {/* Center: Main Menus */}
          <nav className="hidden md:flex items-center gap-2">
            {Object.entries(topMenus).map(([key, menu]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => setActiveTopMenu(key)}
                onMouseLeave={() => setActiveTopMenu(null)}
              >
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1 transition-colors ${
                    activeTopMenu === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{menu.icon}</span>
                  {menu.title}
                  <ChevronDown className={`w-4 h-4 transition-transform ${
                    activeTopMenu === key ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown */}
                {activeTopMenu === key && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] py-2">
                    {menu.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Search + Notifications + Profile */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
              A
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT: Left Sidebar + Content + Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          leftSidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}>
          <div className="p-4 space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Quick Access
            </div>
            {leftSidebarItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Marketing & AI Section */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Marketing & AI
            </div>
            <Link href="/marketing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <span className="text-xl">📢</span>
              <span className="text-sm">Campaigns</span>
            </Link>
            <Link href="/ai-campaigns" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <span className="text-xl">🤖</span>
              <span className="text-sm">AI Campaigns</span>
            </Link>
            <Link href="/ai-insights" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              <span className="text-xl">🧠</span>
              <span className="text-sm">AI Insights</span>
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className={`bg-white border-l border-gray-200 transition-all duration-300 ${
          rightSidebarOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <button onClick={() => setRightSidebarOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Notifications */}
            <div className="space-y-3 mb-6">
              {rightSidebarSections.notifications.map((notif, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                  notif.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  notif.type === 'danger' ? 'border-red-500 bg-red-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="font-medium text-sm text-gray-900">{notif.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{notif.desc}</div>
                  <div className="text-xs text-gray-500 mt-1">{notif.time}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {rightSidebarSections.quickActions.map((action) => (
                  <Link
                    key={action.path}
                    href={action.path}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{action.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Settings Links */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                <User className="w-4 h-4" />
                <span className="text-sm">Profile</span>
              </Link>
              <Link href="/profile/security" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Security</span>
              </Link>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
