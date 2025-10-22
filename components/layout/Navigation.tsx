'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Package, ShoppingCart, Users, TrendingUp,
  Settings, User, Bell, Menu, X, Pill, FileText, Calculator,
  LogOut, Zap, Brain, Sparkles, DollarSign, Gift, Factory,
  Warehouse as WarehouseIcon, UserCircle
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Products', icon: Pill, path: '/products' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Sales', icon: Calculator, path: '/sales' },
  { label: 'Purchases', icon: Calculator, path: '/purchases' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Vendors', icon: Users, path: '/vendors' },
  { label: 'Finance', icon: DollarSign, path: '/finance' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
  { label: 'Settings', icon: Settings, path: '/settings' }
];

export default function Navigation() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <div className={`flex flex-col h-screen bg-white border-r transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      <div className="flex items-center justify-between p-4 border-b">
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">HomeoERP</h1>
              <p className="text-xs text-gray-500">v2.1.0</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 h-8 w-8"
        >
          {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = pathname?.startsWith(item.path);
            return (
              <Link key={index} href={item.path}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start text-left ${
                    isExpanded ? 'px-3' : 'px-2'
                  }`}
                  size="sm"
                >
                  <item.icon className={`h-4 w-4 ${isExpanded ? 'mr-3' : ''}`} />
                  {isExpanded && <span className="flex-1">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-2">
        <Link href="/login">
          <Button variant="ghost" size="sm" className={`w-full justify-start ${isExpanded ? 'px-3' : 'px-2'}`}>
            <LogOut className={`h-4 w-4 ${isExpanded ? 'mr-3' : ''}`} />
            {isExpanded && 'Sign Out'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
