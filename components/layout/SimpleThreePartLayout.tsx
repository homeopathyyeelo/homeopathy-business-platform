'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, X, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// TOP BAR - 6 Major Modules
const topMenus = [
  { title: 'Sales', icon: '💰', path: '/sales' },
  { title: 'Purchases', icon: '🛒', path: '/purchases' },
  { title: 'Inventory', icon: '📦', path: '/inventory' },
  { title: 'Reports', icon: '📊', path: '/reports' },
  { title: 'Finance', icon: '💵', path: '/finance' },
  { title: 'More', icon: '⋯', path: '/more' },
];

// LEFT SIDEBAR - Quick Access
const leftMenu = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Products', path: '/products', icon: '📦' },
  { name: 'Customers', path: '/customers', icon: '👥' },
  { name: 'Vendors', path: '/vendors', icon: '🏭' },
  { name: 'POS', path: '/pos', icon: '💳' },
  { name: 'CRM', path: '/crm', icon: '🎯' },
  { name: 'Marketing', path: '/marketing', icon: '📢' },
  { name: 'Analytics', path: '/analytics', icon: '📈' },
];

export default function SimpleThreePartLayout({ children }: LayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const pathname = usePathname();

  // Skip layout for login page
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BAR */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
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
            {topMenus.map((menu) => (
              <Link
                key={menu.path}
                href={menu.path}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <span>{menu.icon}</span>
                {menu.title}
              </Link>
            ))}
          </nav>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex">
        {/* LEFT SIDEBAR */}
        {leftOpen && (
          <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Quick Access
              </div>
              {leftMenu.map((item) => {
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
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        {rightOpen && (
          <aside className="w-80 bg-white border-l min-h-[calc(100vh-4rem)]">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <button onClick={() => setRightOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg border-l-4 border-yellow-500 bg-yellow-50">
                  <div className="font-medium text-sm">Low Stock Alert</div>
                  <div className="text-xs text-gray-600 mt-1">5 products running low</div>
                  <div className="text-xs text-gray-500 mt-1">2m ago</div>
                </div>
                <div className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                  <div className="font-medium text-sm">New Order</div>
                  <div className="text-xs text-gray-600 mt-1">Order #1234 received</div>
                  <div className="text-xs text-gray-500 mt-1">5m ago</div>
                </div>
                <div className="p-3 rounded-lg border-l-4 border-red-500 bg-red-50">
                  <div className="font-medium text-sm">Expiry Alert</div>
                  <div className="text-xs text-gray-600 mt-1">3 batches expiring soon</div>
                  <div className="text-xs text-gray-500 mt-1">10m ago</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t mt-4 pt-4">
                <h4 className="font-semibold text-sm mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/pos" className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-medium">New Sale</span>
                  </Link>
                  <Link href="/products" className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg">
                    <span className="text-2xl">📦</span>
                    <span className="text-xs font-medium">Add Product</span>
                  </Link>
                  <Link href="/reports" className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs font-medium">Reports</span>
                  </Link>
                  <Link href="/settings" className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg">
                    <span className="text-2xl">⚙️</span>
                    <span className="text-xs font-medium">Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
