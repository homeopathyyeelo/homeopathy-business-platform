'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, Search, Bell, MessageSquare, Building2, ChevronDown, 
  Settings, LogOut, User, Plus, FileText, ShoppingCart, Users as UsersIcon,
  Package, Zap, Sun, Moon, RefreshCw
} from 'lucide-react';

interface FinalTopBarProps {
  onToggleLeftSidebar: () => void;
  onToggleRightPanel: () => void;
}

export default function FinalTopBar({ onToggleLeftSidebar, onToggleRightPanel }: FinalTopBarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');
  const [notificationCount] = useState(5);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const quickCreateOptions = [
    { label: 'New Invoice', icon: FileText, path: '/sales/pos', color: 'text-green-600' },
    { label: 'New Purchase Order', icon: ShoppingCart, path: '/purchases/orders/new', color: 'text-blue-600' },
    { label: 'Add Customer', icon: UsersIcon, path: '/customers/add', color: 'text-purple-600' },
    { label: 'Add Product', icon: Package, path: '/products/add', color: 'text-orange-600' },
  ];

  return (
    <header className="h-16 bg-gradient-to-r from-orange-100 via-peach-100 to-orange-50 border-b border-orange-200 flex items-center px-6 gap-4 shadow-md z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Menu Toggle */}
        <button
          onClick={onToggleLeftSidebar}
          className="p-2 hover:bg-orange-200/50 rounded-lg transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* Logo & Title */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg text-gray-800">HomeoERP</h1>
            <p className="text-xs text-gray-600">v2.1.0</p>
          </div>
        </Link>

        {/* Branch Selector */}
        <div className="hidden lg:block ml-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-orange-200 rounded-lg hover:bg-white transition-colors shadow-sm">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{selectedBranch}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search products, customers, invoices, batches... (Ctrl+K)"
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Sync Button */}
        <button 
          className="p-2.5 hover:bg-orange-200/50 rounded-lg transition-colors"
          title="Sync Data"
        >
          <RefreshCw className="h-5 w-5 text-gray-700" />
        </button>

        {/* Quick Create */}
        <div className="relative">
          <button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
            title="Quick Create"
          >
            <Plus className="h-5 w-5" />
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              {quickCreateOptions.map((option) => (
                <Link
                  key={option.path}
                  href={option.path}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowQuickCreate(false)}
                >
                  <option.icon className={`h-4 w-4 ${option.color}`} />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <button 
          className="p-2.5 hover:bg-orange-200/50 rounded-lg transition-colors"
          title="AI Assistant"
        >
          <MessageSquare className="h-5 w-5 text-gray-700" />
        </button>

        {/* Notifications */}
        <button 
          className="relative p-2.5 hover:bg-orange-200/50 rounded-lg transition-colors"
          onClick={onToggleRightPanel}
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2.5 hover:bg-orange-200/50 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-gray-700" />
          ) : (
            <Sun className="h-5 w-5 text-gray-700" />
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-orange-200/50 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Super Admin</p>
                <p className="text-xs text-gray-500">admin@admin.com</p>
              </div>
              <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
