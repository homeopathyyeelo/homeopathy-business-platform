'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface MegaMenuProps {
  children: React.ReactNode;
}

const menuData = {
  core: {
    title: 'Core Operations',
    icon: '🏢',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: '📊', desc: 'Overview & Analytics' },
      { name: 'Master Data', path: '/master', icon: '🗂️', desc: 'Products, Customers, Suppliers' },
      { name: 'Inventory', path: '/inventory', icon: '📦', desc: 'Stock & Batch Management' },
      { name: 'Sales', path: '/sales', icon: '💰', desc: 'Invoices & Billing' },
      { name: 'Purchases', path: '/purchases', icon: '🛒', desc: 'PO & Supplier Orders' },
    ]
  },
  pos: {
    title: 'Point of Sale',
    icon: '💳',
    items: [
      { name: 'POS System', path: '/pos', icon: '💳', desc: 'Standard POS Interface' },
      { name: 'Retail POS', path: '/retail-pos', icon: '🏪', desc: 'Retail Optimized' },
      { name: 'Daily Billing', path: '/daily-register', icon: '📝', desc: 'Cash Register' },
    ]
  },
  customers: {
    title: 'Customer Management',
    icon: '👥',
    items: [
      { name: 'Customers', path: '/customers', icon: '👥', desc: 'Customer Database' },
      { name: 'CRM', path: '/crm', icon: '🎯', desc: 'Relationship Management' },
      { name: 'Prescriptions', path: '/prescriptions', icon: '💊', desc: 'Digital Rx' },
      { name: 'Loyalty Program', path: '/loyalty', icon: '⭐', desc: 'Points & Rewards' },
    ]
  },
  marketing: {
    title: 'Marketing',
    icon: '📢',
    items: [
      { name: 'Campaigns', path: '/marketing', icon: '📢', desc: 'Marketing Campaigns' },
      { name: 'Email', path: '/email', icon: '✉️', desc: 'Email Automation' },
      { name: 'AI Campaigns', path: '/ai-campaigns', icon: '🤖', desc: 'AI-Powered Marketing' },
    ]
  },
  analytics: {
    title: 'Analytics & Reports',
    icon: '📊',
    items: [
      { name: 'Reports', path: '/reports', icon: '📈', desc: 'Business Reports' },
      { name: 'Analytics', path: '/analytics', icon: '📊', desc: 'Business Intelligence' },
      { name: 'Dashboards', path: '/dashboards', icon: '📉', desc: 'Executive Dashboards' },
      { name: 'Quick Stats', path: '/quick-stats', icon: '⚡', desc: 'Real-time Stats' },
    ]
  },
  operations: {
    title: 'Operations',
    icon: '⚙️',
    items: [
      { name: 'Delivery', path: '/delivery', icon: '🚚', desc: 'Order Delivery' },
      { name: 'Warehouse', path: '/warehouse', icon: '🏭', desc: 'Multi-warehouse' },
      { name: 'Manufacturing', path: '/manufacturing', icon: '⚙️', desc: 'Production' },
      { name: 'Active Batches', path: '/active-batches', icon: '🔄', desc: 'Batch Tracking' },
    ]
  },
  ai: {
    title: 'AI & Automation',
    icon: '🤖',
    items: [
      { name: 'AI Insights', path: '/ai-insights', icon: '🧠', desc: 'ML Insights' },
      { name: 'AI Chat', path: '/ai-chat', icon: '💬', desc: 'Business Assistant' },
      { name: 'AI Demos', path: '/ai-demos', icon: '🎨', desc: 'Feature Demos' },
    ]
  },
  admin: {
    title: 'Administration',
    icon: '⚙️',
    items: [
      { name: 'GST', path: '/gst', icon: '📋', desc: 'GST Compliance' },
      { name: 'Finance', path: '/finance', icon: '💵', desc: 'Financial Management' },
      { name: 'HR', path: '/hr', icon: '👔', desc: 'Employee Management' },
      { name: 'Users', path: '/user', icon: '👤', desc: 'User Management' },
      { name: 'Schemes', path: '/schemes', icon: '🎁', desc: 'Offers & Discounts' },
      { name: 'Notifications', path: '/notifications', icon: '🔔', desc: 'Alert System' },
      { name: 'Settings', path: '/settings', icon: '⚙️', desc: 'System Settings' },
    ]
  },
};

export default function MegaMenu({ children }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const handleMenuEnter = (key: string) => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
    setActiveMenu(key);
    setIsMenuOpen(true);
  };

  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      setIsMenuOpen(false);
    }, 300); // 300ms delay before closing
  };

  const handleMenuClick = () => {
    setActiveMenu(null);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, []);

  // Don't show menu on login page or homepage
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  const topCategories = [
    { key: 'core', label: 'Core Operations' },
    { key: 'pos', label: 'POS' },
    { key: 'customers', label: 'Customers' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'operations', label: 'Operations' },
    { key: 'ai', label: 'AI & Automation' },
    { key: 'admin', label: 'Administration' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav 
        ref={navRef}
        className="bg-white shadow-md relative z-50"
        onMouseLeave={handleMenuLeave}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Logo and Main Menu */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-3xl">🏥</div>
              <div>
                <h1 className="text-xl font-bold text-blue-600">Yeelo</h1>
                <p className="text-xs text-gray-500">Homeopathy ERP</p>
              </div>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {topCategories.map((cat) => (
                <div
                  key={cat.key}
                  className="relative"
                  onMouseEnter={() => handleMenuEnter(cat.key)}
                >
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                      activeMenu === cat.key
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{menuData[cat.key as keyof typeof menuData].icon}</span>
                    {cat.label}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      activeMenu === cat.key ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-medium">
                + New Sale
              </button>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown - Enhanced with stable hover */}
        {isMenuOpen && activeMenu && (
          <div
            className="absolute left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            onMouseEnter={() => {
              if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
            }}
            onMouseLeave={handleMenuLeave}
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Category Header */}
              <div className="mb-8 flex items-center gap-3">
                <span className="text-4xl">{menuData[activeMenu as keyof typeof menuData].icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {menuData[activeMenu as keyof typeof menuData].title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select any module below to get started
                  </p>
                </div>
              </div>

              {/* Menu Items Grid - Enhanced */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {menuData[activeMenu as keyof typeof menuData].items.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={handleMenuClick}
                      className={`group p-5 rounded-xl transition-all duration-200 border-2 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg'
                          : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-4xl transition-transform duration-200 ${
                            isActive ? 'scale-110' : 'group-hover:scale-110'
                          }`}>
                            {item.icon}
                          </span>
                          <div className="flex-1">
                            <h4 className={`font-bold text-base mb-1 transition-colors ${
                              isActive ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                            }`}>
                              {item.name}
                            </h4>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pl-1">
                          {item.desc}
                        </p>
                        {isActive && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            Currently Active
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer with stats */}
              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {menuData[activeMenu as keyof typeof menuData].items.length}
                    </span> modules available
                  </div>
                </div>
                <button 
                  onClick={handleMenuClick}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group"
                >
                  Close Menu
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
