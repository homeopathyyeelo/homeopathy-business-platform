'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  Search, 
  Plus, 
  Bell, 
  MessageSquare, 
  Globe, 
  Moon, 
  Sun,
  User,
  Building2,
  ChevronDown,
  Settings,
  LogOut,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  FileText
} from 'lucide-react';

interface TopBarProps {
  onToggleLeftSidebar?: () => void;
  onToggleRightPanel?: () => void;
  showRightPanelToggle?: boolean;
}

export default function TopBar({ 
  onToggleLeftSidebar, 
  onToggleRightPanel,
  showRightPanelToggle = false 
}: TopBarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');
  const [notificationCount] = useState(5);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const quickCreateOptions = [
    { label: 'New Invoice', icon: FileText, path: '/app/sales/pos' },
    { label: 'New Purchase Order', icon: ShoppingCart, path: '/app/purchases/orders/new' },
    { label: 'Add Customer', icon: UsersIcon, path: '/app/customers/add' },
    { label: 'Add Product', icon: Package, path: '/app/products/add' },
  ];

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 shadow-sm z-50">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Menu Toggle */}
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Logo */}
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-lg hidden md:block">
            Homeopathy ERP
          </span>
        </Link>

        {/* Branch Selector */}
        <div className="relative hidden lg:block">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Building2 className="h-4 w-4" />
            <span className="max-w-[120px] truncate text-sm">{selectedBranch}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center Section - Global Search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search products, customers, invoices, batches..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <div className="relative">
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline text-sm">Quick Create</span>
          </button>
          
          {showQuickCreate && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowQuickCreate(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                {quickCreateOptions.map((option) => (
                  <Link
                    key={option.path}
                    href={option.path}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowQuickCreate(false)}
                  >
                    <option.icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                {notificationCount}
              </span>
            )}
          </button>
        </div>

        {/* Messages / AI Assistant */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Language Selector */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:block">
          <Globe className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Right Panel Toggle (if enabled) */}
        {showRightPanelToggle && onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-medium">Admin User</span>
              <span className="text-xs text-gray-500">Super Admin</span>
            </div>
            <ChevronDown className="h-4 w-4 hidden lg:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-500">admin@example.com</p>
                </div>
                <Link
                  href="/app/settings/profile"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </Link>
                <Link
                  href="/app/settings"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
