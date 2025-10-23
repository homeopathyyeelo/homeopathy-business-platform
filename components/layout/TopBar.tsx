'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, User, Building2, ChevronDown, Plus, RefreshCw, MessageSquare, Settings, LogOut } from 'lucide-react';

interface TopBarProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

export default function TopBar({ onToggleLeft, onToggleRight }: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-gradient-to-r from-orange-100 via-peach-100 to-orange-50 border-b border-orange-200 flex items-center px-6 gap-4 shadow-md z-50">
      <button onClick={onToggleLeft} className="p-2 hover:bg-orange-200/50 rounded-lg">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <div className="hidden md:block">
          <h1 className="font-bold text-lg text-gray-800">HomeoERP</h1>
          <p className="text-xs text-gray-600">v2.1.0</p>
        </div>
      </Link>

      <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/80 border border-orange-200 rounded-lg hover:bg-white">
        <Building2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Main Branch</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search products, customers, invoices..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2.5 hover:bg-orange-200/50 rounded-lg"><RefreshCw className="h-5 w-5" /></button>
        <button className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md"><Plus className="h-5 w-5" /></button>
        <button className="p-2.5 hover:bg-orange-200/50 rounded-lg"><MessageSquare className="h-5 w-5" /></button>
        <button onClick={onToggleRight} className="relative p-2.5 hover:bg-orange-200/50 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">5</span>
        </button>

        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 hover:bg-orange-200/50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2 z-50">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">Super Admin</p>
                <p className="text-xs text-gray-500">admin@admin.com</p>
              </div>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                <Settings className="h-4 w-4" />Settings
              </Link>
              <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600">
                <LogOut className="h-4 w-4" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
