'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  UserCheck,
  BarChart3,
  FileText,
  Megaphone,
  Share2,
  Brain,
  Settings,
  ChevronRight,
  Pill,
  Stethoscope,
  Factory
} from 'lucide-react';

interface BeautifulLeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'from-blue-500 to-blue-600' },
  { id: 'products', label: 'Products', icon: Pill, path: '/products', color: 'from-green-500 to-green-600' },
  { id: 'inventory', label: 'Inventory', icon: Warehouse, path: '/inventory', color: 'from-purple-500 to-purple-600' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales', color: 'from-orange-500 to-orange-600' },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag, path: '/purchases', color: 'from-pink-500 to-pink-600' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers', color: 'from-cyan-500 to-cyan-600' },
  { id: 'vendors', label: 'Vendors', icon: Truck, path: '/vendors', color: 'from-indigo-500 to-indigo-600' },
  { id: 'prescriptions', label: 'Prescriptions', icon: Stethoscope, path: '/prescriptions', color: 'from-teal-500 to-teal-600' },
  { id: 'finance', label: 'Finance', icon: DollarSign, path: '/finance', color: 'from-emerald-500 to-emerald-600' },
  { id: 'hr', label: 'HR & Staff', icon: UserCheck, path: '/hr', color: 'from-violet-500 to-violet-600' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', color: 'from-amber-500 to-amber-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', color: 'from-rose-500 to-rose-600' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing', color: 'from-fuchsia-500 to-fuchsia-600' },
  { id: 'social', label: 'Social Media', icon: Share2, path: '/social', color: 'from-sky-500 to-sky-600' },
  { id: 'ai', label: 'AI Assistant', icon: Brain, path: '/ai', color: 'from-purple-600 to-pink-600', badge: 'AI' },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory, path: '/manufacturing', color: 'from-slate-500 to-slate-600' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', color: 'from-gray-500 to-gray-600' },
];

export default function BeautifulLeftSidebar({ isOpen, onClose }: BeautifulLeftSidebarProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white flex flex-col shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-500/30">
        <h2 className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Main Menu</h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname?.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-white text-blue-700 shadow-lg' 
                  : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg bg-gradient-to-br ${item.color} 
                ${isActive ? 'shadow-md' : 'opacity-80 group-hover:opacity-100'}
              `}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              
              <span className="flex-1 font-medium text-sm">{item.label}</span>
              
              {item.badge && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
              
              {!isActive && (
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-blue-500/30">
        <div className="bg-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-100 font-medium">HomeoERP v2.1.0</p>
          <p className="text-xs text-blue-200/70 mt-1">© 2025 Yeelo</p>
        </div>
      </div>
    </aside>
  );
}
