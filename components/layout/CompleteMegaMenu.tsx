'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Bell, Search, Settings } from 'lucide-react';

interface MegaMenuProps {
  children: React.ReactNode;
}

// COMPLETE MENU STRUCTURE - All 20 Major Modules
const menuData = {
  dashboard: {
    title: 'Dashboard',
    icon: '📊',
    items: [
      { name: 'Overview', path: '/dashboard', icon: '📈', desc: 'Sales, Purchase, Stock, Profit' },
      { name: 'Quick Stats', path: '/quick-stats', icon: '⚡', desc: 'Today / Week / Month' },
      { name: 'Alerts', path: '/notifications', icon: '🔔', desc: 'Expiry & Low Stock' },
      { name: 'Analytics', path: '/analytics', icon: '📊', desc: 'Advanced BI' },
    ]
  },
  products: {
    title: 'Products',
    icon: '📦',
    items: [
      { name: 'Product List', path: '/products', icon: '📋', desc: 'All Products CRUD' },
      { name: 'Master Data', path: '/master', icon: '🗂️', desc: 'Products, Categories, Brands' },
      { name: 'Batch Management', path: '/active-batches', icon: '🔄', desc: 'Batch & Expiry Tracking' },
      { name: 'Price Management', path: '/products/pricing', icon: '💰', desc: 'MRP, Purchase, Selling' },
      { name: 'Import/Export', path: '/products/import', icon: '📤', desc: 'Excel/CSV' },
    ]
  },
  inventory: {
    title: 'Inventory',
    icon: '🏪',
    items: [
      { name: 'Inventory Dashboard', path: '/inventory', icon: '📦', desc: 'Stock Overview' },
      { name: 'Stock List', path: '/inventory/stock', icon: '📋', desc: 'Per Branch/Warehouse' },
      { name: 'Warehouse', path: '/warehouse', icon: '🏭', desc: 'Multi-warehouse Mgmt' },
      { name: 'Stock Adjustment', path: '/inventory/adjustments', icon: '⚖️', desc: 'Stock Reconciliation' },
      { name: 'Stock Transfer', path: '/inventory/transfers', icon: '🔄', desc: 'Branch to Branch' },
      { name: 'Valuation', path: '/inventory/valuation', icon: '💵', desc: 'Real-time Stock Value' },
    ]
  },
  sales: {
    title: 'Sales',
    icon: '💰',
    items: [
      { name: 'POS System', path: '/pos', icon: '💳', desc: 'Point of Sale' },
      { name: 'Retail POS', path: '/retail-pos', icon: '🏪', desc: 'B2C Billing' },
      { name: 'Sales Invoices', path: '/sales', icon: '📝', desc: 'All Sales CRUD' },
      { name: 'Sales Orders', path: '/sales/orders', icon: '📋', desc: 'Quotations & Draft' },
      { name: 'Daily Register', path: '/daily-register', icon: '📖', desc: 'Daily Billing' },
      { name: 'Credit Sales', path: '/sales/credit', icon: '💳', desc: 'Due Management' },
      { name: 'Returns', path: '/sales/returns', icon: '↩️', desc: 'Credit Notes' },
    ]
  },
  purchases: {
    title: 'Purchases',
    icon: '🛒',
    items: [
      { name: 'Purchase Orders', path: '/purchases', icon: '📋', desc: 'PO Management' },
      { name: 'GRN', path: '/purchases/grn', icon: '📦', desc: 'Goods Receipt Note' },
      { name: 'Purchase Bills', path: '/purchases/bills', icon: '📄', desc: 'Vendor Invoices' },
      { name: 'Returns', path: '/purchases/returns', icon: '↩️', desc: 'Purchase Returns' },
      { name: 'Payments', path: '/purchases/payments', icon: '💵', desc: 'Vendor Payments' },
      { name: 'Auto Reorder', path: '/purchases/reorder', icon: '🤖', desc: 'AI Suggestions' },
    ]
  },
  customers: {
    title: 'Customers',
    icon: '👥',
    items: [
      { name: 'Customer List', path: '/customers', icon: '👥', desc: 'All Customers' },
      { name: 'CRM', path: '/crm', icon: '🎯', desc: 'Relationship Mgmt' },
      { name: 'Loyalty Program', path: '/loyalty', icon: '⭐', desc: 'Points & Rewards' },
      { name: 'Prescriptions', path: '/prescriptions', icon: '💊', desc: 'Digital Rx' },
      { name: 'Customer Groups', path: '/customers/groups', icon: '👨‍👩‍👧', desc: 'Retail/B2B/VIP' },
      { name: 'Outstanding', path: '/customers/outstanding', icon: '💳', desc: 'Credit Management' },
    ]
  },
  vendors: {
    title: 'Vendors',
    icon: '🏭',
    items: [
      { name: 'Vendor List', path: '/vendors', icon: '🏢', desc: 'All Vendors' },
      { name: 'Vendor Types', path: '/vendors/types', icon: '📁', desc: 'Manufacturer/Distributor' },
      { name: 'Payment Terms', path: '/vendors/terms', icon: '📜', desc: 'Credit Terms' },
      { name: 'Outstanding', path: '/vendors/outstanding', icon: '💰', desc: 'Vendor Ledger' },
      { name: 'Performance', path: '/vendors/performance', icon: '⭐', desc: 'Vendor Rating' },
    ]
  },
  hr: {
    title: 'HR & Staff',
    icon: '👔',
    items: [
      { name: 'Employees', path: '/hr', icon: '👥', desc: 'Employee List' },
      { name: 'User Management', path: '/user', icon: '👤', desc: 'Roles & Permissions' },
      { name: 'Attendance', path: '/hr/attendance', icon: '📅', desc: 'Check-in/Check-out' },
      { name: 'Leave', path: '/hr/leave', icon: '🏖️', desc: 'Leave Management' },
      { name: 'Payroll', path: '/hr/payroll', icon: '💰', desc: 'Salary & Incentives' },
      { name: 'Performance', path: '/hr/performance', icon: '📊', desc: 'Employee Tracking' },
    ]
  },
  finance: {
    title: 'Finance',
    icon: '💵',
    items: [
      { name: 'Finance Dashboard', path: '/finance', icon: '📊', desc: 'Financial Overview' },
      { name: 'GST Compliance', path: '/gst', icon: '📋', desc: 'GST Reports' },
      { name: 'Ledger', path: '/finance/ledger', icon: '📖', desc: 'Sales & Purchase' },
      { name: 'Cash Book', path: '/finance/cashbook', icon: '💰', desc: 'Cash Management' },
      { name: 'Expenses', path: '/finance/expenses', icon: '💸', desc: 'Expense Tracking' },
      { name: 'P&L', path: '/finance/pl', icon: '📈', desc: 'Profit & Loss' },
      { name: 'Balance Sheet', path: '/finance/balance', icon: '⚖️', desc: 'Financial Position' },
    ]
  },
  reports: {
    title: 'Reports',
    icon: '📈',
    items: [
      { name: 'Sales Reports', path: '/reports', icon: '💰', desc: 'Daily/Monthly/Branch' },
      { name: 'Purchase Reports', path: '/reports/purchase', icon: '🛒', desc: 'Vendor Analysis' },
      { name: 'Stock Reports', path: '/reports/stock', icon: '📦', desc: 'Inventory Reports' },
      { name: 'Expiry Reports', path: '/reports/expiry', icon: '⏰', desc: 'Batch & Expiry' },
      { name: 'GST Reports', path: '/reports/gst', icon: '📋', desc: 'Tax Reports' },
      { name: 'Custom Reports', path: '/reports/custom', icon: '🎨', desc: 'Report Builder' },
    ]
  },
  marketing: {
    title: 'Marketing',
    icon: '📢',
    items: [
      { name: 'Campaigns', path: '/marketing', icon: '📢', desc: 'Campaign Dashboard' },
      { name: 'WhatsApp', path: '/marketing/whatsapp', icon: '💬', desc: 'WhatsApp Campaigns' },
      { name: 'SMS', path: '/marketing/sms', icon: '📱', desc: 'SMS Campaigns' },
      { name: 'Email', path: '/email', icon: '✉️', desc: 'Email Campaigns' },
      { name: 'Offers/Coupons', path: '/schemes', icon: '🎁', desc: 'Discounts Management' },
      { name: 'Segmentation', path: '/marketing/segments', icon: '🎯', desc: 'Customer Groups' },
    ]
  },
  social: {
    title: 'Social Media',
    icon: '📱',
    items: [
      { name: 'Social Dashboard', path: '/social', icon: '📊', desc: 'All Platforms' },
      { name: 'GMB Posts', path: '/social/gmb', icon: '🗺️', desc: 'Google My Business' },
      { name: 'Instagram', path: '/social/instagram', icon: '📸', desc: 'IG Scheduler' },
      { name: 'Facebook', path: '/social/facebook', icon: '👍', desc: 'FB Posts' },
      { name: 'YouTube', path: '/social/youtube', icon: '🎥', desc: 'Video Posts' },
      { name: 'WordPress', path: '/social/wordpress', icon: '📝', desc: 'Blog Auto-publish' },
    ]
  },
  crm_service: {
    title: 'CRM Service',
    icon: '🎯',
    items: [
      { name: 'Tickets', path: '/crm/tickets', icon: '🎫', desc: 'Support System' },
      { name: 'Appointments', path: '/crm/appointments', icon: '📅', desc: 'Booking System' },
      { name: 'Follow-ups', path: '/crm/followups', icon: '🔔', desc: 'Reminders' },
      { name: 'Chat', path: '/crm/chat', icon: '💬', desc: 'WhatsApp/Web Chat' },
      { name: 'Feedback', path: '/crm/feedback', icon: '⭐', desc: 'Reviews & Ratings' },
      { name: 'AI Chatbot', path: '/ai-chat', icon: '🤖', desc: 'AI Assistant' },
    ]
  },
  ai: {
    title: 'AI Intelligence',
    icon: '🤖',
    items: [
      { name: 'AI Chat', path: '/ai-chat', icon: '💬', desc: 'Ask About Business' },
      { name: 'AI Campaigns', path: '/ai-campaigns', icon: '📢', desc: 'Auto Campaigns' },
      { name: 'AI Insights', path: '/ai-insights', icon: '🧠', desc: 'Business Intelligence' },
      { name: 'AI Forecasting', path: '/ai/forecasting', icon: '📈', desc: 'Demand Prediction' },
      { name: 'AI Pricing', path: '/ai/pricing', icon: '💰', desc: 'Price Optimization' },
      { name: 'AI Content', path: '/ai/content', icon: '✍️', desc: 'Content Writer' },
      { name: 'AI Demo Lab', path: '/ai-demos', icon: '🔬', desc: 'Test AI Features' },
    ]
  },
  analytics_bi: {
    title: 'Analytics & BI',
    icon: '📊',
    items: [
      { name: 'BI Dashboard', path: '/dashboards', icon: '📊', desc: 'Business Intelligence' },
      { name: 'KPI Dashboard', path: '/analytics/kpi', icon: '🎯', desc: 'Key Performance' },
      { name: 'Sales Analytics', path: '/analytics', icon: '💰', desc: 'Sales vs Purchase' },
      { name: 'Product Performance', path: '/analytics/products', icon: '📦', desc: 'Top/Low Sellers' },
      { name: 'Customer LTV', path: '/analytics/ltv', icon: '👥', desc: 'Lifetime Value' },
      { name: 'Forecasting', path: '/analytics/forecast', icon: '🔮', desc: 'AI Predictions' },
    ]
  },
  delivery: {
    title: 'Delivery & Logistics',
    icon: '🚚',
    items: [
      { name: 'Delivery Orders', path: '/delivery', icon: '📦', desc: 'Order Management' },
      { name: 'Delivery Staff', path: '/delivery/staff', icon: '👤', desc: 'Staff Management' },
      { name: 'Routes', path: '/delivery/routes', icon: '🗺️', desc: 'Route Planning' },
      { name: 'Tracking', path: '/delivery/tracking', icon: '📍', desc: 'Real-time Tracking' },
      { name: 'POD', path: '/delivery/pod', icon: '✅', desc: 'Proof of Delivery' },
    ]
  },
  manufacturing: {
    title: 'Manufacturing',
    icon: '⚙️',
    items: [
      { name: 'Production', path: '/manufacturing', icon: '⚙️', desc: 'Production Management' },
      { name: 'BOM', path: '/manufacturing/bom', icon: '📋', desc: 'Bill of Materials' },
      { name: 'Work Orders', path: '/manufacturing/orders', icon: '📝', desc: 'Production Orders' },
      { name: 'Quality Check', path: '/manufacturing/quality', icon: '✅', desc: 'QC Process' },
      { name: 'Raw Materials', path: '/manufacturing/materials', icon: '🧪', desc: 'Material Stock' },
    ]
  },
  settings: {
    title: 'Settings',
    icon: '⚙️',
    items: [
      { name: 'Company Profile', path: '/settings', icon: '🏢', desc: 'Business Settings' },
      { name: 'Branches', path: '/settings/branches', icon: '🏪', desc: 'Store Management' },
      { name: 'Roles & Permissions', path: '/settings/roles', icon: '🔐', desc: 'RBAC' },
      { name: 'Tax Config', path: '/settings/tax', icon: '📋', desc: 'GST Settings' },
      { name: 'Integrations', path: '/settings/integrations', icon: '🔗', desc: 'API Keys' },
      { name: 'Backup', path: '/settings/backup', icon: '💾', desc: 'Backup & Restore' },
    ]
  },
  profile: {
    title: 'User Profile',
    icon: '👤',
    items: [
      { name: 'My Profile', path: '/profile', icon: '👤', desc: 'Profile Info' },
      { name: 'Activity Log', path: '/profile/activity', icon: '📋', desc: 'User Activity' },
      { name: 'Security', path: '/profile/security', icon: '🔒', desc: '2FA & Password' },
      { name: 'Preferences', path: '/profile/preferences', icon: '⚙️', desc: 'User Settings' },
    ]
  },
};

function CompleteMegaMenu({ children }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuEnter = (key: string) => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setActiveMenu(key);
    setIsMenuOpen(true);
  };

  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      setIsMenuOpen(false);
    }, 300);
  };

  const handleMenuClick = () => {
    setActiveMenu(null);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    };
  }, []);

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  const topCategories = Object.keys(menuData).map(key => ({
    key,
    label: menuData[key as keyof typeof menuData].title
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav 
        className="bg-white shadow-md relative z-50 border-b-2 border-blue-100"
        onMouseLeave={handleMenuLeave}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-3xl">🏥</div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Yeelo ERP
                </h1>
                <p className="text-xs text-gray-500">Complete Homeopathy Platform</p>
              </div>
            </Link>

            {/* Main Navigation - Scrollable */}
            <div className="flex-1 mx-4 overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {topCategories.map((cat) => (
                  <div
                    key={cat.key}
                    className="relative"
                    onMouseEnter={() => handleMenuEnter(cat.key)}
                  >
                    <button
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
                        activeMenu === cat.key
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">{menuData[cat.key as keyof typeof menuData].icon}</span>
                      {cat.label}
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                        activeMenu === cat.key ? 'rotate-180' : ''
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Search">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg relative" title="Notifications">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-medium">
                + New Sale
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        {isMenuOpen && activeMenu && (
          <div
            className="absolute left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl"
            onMouseEnter={() => {
              if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
            }}
            onMouseLeave={handleMenuLeave}
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Category Header */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl">{menuData[activeMenu as keyof typeof menuData].icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {menuData[activeMenu as keyof typeof menuData].title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {menuData[activeMenu as keyof typeof menuData].items.length} modules available
                  </p>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {menuData[activeMenu as keyof typeof menuData].items.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={handleMenuClick}
                      className={`group p-4 rounded-xl transition-all duration-200 border-2 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg'
                          : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-3xl transition-transform duration-200 ${
                            isActive ? 'scale-110' : 'group-hover:scale-110'
                          }`}>
                            {item.icon}
                          </span>
                          <h4 className={`font-bold text-sm transition-colors ${
                            isActive ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                          }`}>
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {item.desc}
                        </p>
                        {isActive && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            Active
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
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
export default CompleteMegaMenu;
