'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, X, ChevronDown, Search, Settings, User, LogOut, Home } from 'lucide-react';
import { MENU_STRUCTURE } from '@/lib/menu-structure';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ProductionERPLayout({ children }: LayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Skip layout for login
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP MEGA MENU BAR */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b">
          {/* Left: Logo + Toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">🏥</span>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-blue-600">Yeelo ERP</h1>
                <p className="text-xs text-gray-500">Homeopathy</p>
              </div>
            </Link>
          </div>

          {/* Right: Search + Notifications + Profile */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setRightOpen(!rightOpen)}
              className="p-1.5 hover:bg-gray-100 rounded relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
          </div>
        </div>

        {/* Mega Menu Navigation */}
        <nav className="flex items-center gap-0.5 px-3 py-1 overflow-x-auto bg-gray-50">
          {MENU_STRUCTURE.topMenu.map((menu) => (
            <div
              key={menu.id}
              className="relative"
              onMouseEnter={() => menu.hasSubmenu && setActiveDropdown(menu.id)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={menu.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded hover:bg-white transition-colors whitespace-nowrap ${
                  pathname.startsWith(menu.path) ? 'bg-white text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-sm">{menu.icon}</span>
                <span>{menu.title}</span>
                {menu.hasSubmenu && <ChevronDown className="w-3 h-3" />}
              </Link>

              {/* Mega Menu Dropdown */}
              {menu.hasSubmenu && activeDropdown === menu.id && menu.submenu && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border min-w-[240px] max-w-[300px] py-2 z-50">
                  {menu.submenu.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="flex flex-col px-4 py-2 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex">
        {/* LEFT SIDEBAR - Quick Access */}
        {leftOpen && (
          <aside className="w-56 bg-white border-r min-h-[calc(100vh-7rem)] sticky top-28">
            <div className="p-3 space-y-0.5">
              <div className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">
                Quick Access
              </div>
              {MENU_STRUCTURE.leftSidebar.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center justify-between gap-2 px-2 py-2 rounded transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs">{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
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
        <main className="flex-1 p-4 bg-gray-50 min-h-[calc(100vh-7rem)]">
          {children}
        </main>

        {/* RIGHT SIDEBAR - Quick Actions + Notifications */}
        {rightOpen && (
          <aside className="w-72 bg-white border-l min-h-[calc(100vh-7rem)] sticky top-28">
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Notifications</h3>
                <button onClick={() => setRightOpen(false)}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Notifications */}
              <div className="space-y-2 mb-4 max-h-[250px] overflow-y-auto">
                <div className="p-2 rounded border-l-4 border-yellow-500 bg-yellow-50 text-xs">
                  <div className="font-semibold">Low Stock Alert</div>
                  <div className="text-gray-600">15 products below minimum</div>
                  <div className="text-gray-500 mt-1">2m ago</div>
                </div>
                <div className="p-2 rounded border-l-4 border-blue-500 bg-blue-50 text-xs">
                  <div className="font-semibold">New Orders</div>
                  <div className="text-gray-600">3 new orders received</div>
                  <div className="text-gray-500 mt-1">5m ago</div>
                </div>
                <div className="p-2 rounded border-l-4 border-red-500 bg-red-50 text-xs">
                  <div className="font-semibold">Expiry Alert</div>
                  <div className="text-gray-600">8 batches expiring soon</div>
                  <div className="text-gray-500 mt-1">10m ago</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-3">
                <h4 className="font-bold text-xs mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MENU_STRUCTURE.rightSidebar.quickActions.map((action) => (
                    <Link
                      key={action.path}
                      href={action.path}
                      className="flex flex-col items-center gap-1 p-2 bg-gray-50 hover:bg-blue-50 rounded transition-all"
                    >
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-xs font-medium text-center">{action.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* User Menu */}
              <div className="border-t mt-3 pt-3 space-y-0.5">
                <Link href="/settings" className="flex items-center gap-2 px-2 py-1.5 rounded text-gray-700 hover:bg-gray-50 text-xs">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded text-gray-700 hover:bg-gray-50 text-xs">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded text-red-600 hover:bg-red-50 w-full text-xs">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
