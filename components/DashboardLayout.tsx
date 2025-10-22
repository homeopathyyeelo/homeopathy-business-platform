"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  // Core Operations
  { name: 'Dashboard', path: '/dashboard', icon: '', category: 'Core' },
  { name: 'Master Data', path: '/master', icon: '', category: 'Core' },
  { name: 'Inventory', path: '/inventory', icon: '', category: 'Core' },
  { name: 'Sales', path: '/sales', icon: '', category: 'Core' },
  { name: 'Purchases', path: '/purchases', icon: '', category: 'Core' },
  
  // Point of Sale
  { name: 'POS System', path: '/pos', icon: '', category: 'POS' },
  { name: 'Retail POS', path: '/retail-pos', icon: '', category: 'POS' },
  { name: 'Daily Billing', path: '/daily-register', icon: '', category: 'POS' },
  
  // Customer Management
  { name: 'Customers', path: '/customers', icon: '', category: 'Customers' },
  { name: 'CRM', path: '/crm', icon: '', category: 'Customers' },
  { name: 'Prescriptions', path: '/prescriptions', icon: '', category: 'Customers' },
  { name: 'Loyalty Program', path: '/loyalty', icon: '', category: 'Customers' },
  
  // Marketing & Communication
  { name: 'Marketing', path: '/marketing', icon: '', category: 'Marketing' },
  { name: 'Email Campaigns', path: '/email', icon: '', category: 'Marketing' },
  { name: 'AI Campaigns', path: '/ai-campaigns', icon: '', category: 'Marketing' },
  
  // Analytics & Reports
  { name: 'Reports', path: '/reports', icon: '', category: 'Reports' },
  { name: 'Analytics', path: '/analytics', icon: '', category: 'Reports' },
  { name: 'Dashboards', path: '/dashboards', icon: '', category: 'Reports' },
  { name: 'Quick Stats', path: '/quick-stats', icon: '', category: 'Reports' },
  
  // Operations
  { name: 'Delivery', path: '/delivery', icon: '', category: 'Operations' },
  { name: 'Warehouse', path: '/warehouse', icon: '', category: 'Operations' },
  { name: 'Manufacturing', path: '/manufacturing', icon: '', category: 'Operations' },
  { name: 'Active Batches', path: '/active-batches', icon: '', category: 'Operations' },
  
  // AI & Automation
  { name: 'AI Insights', path: '/ai-insights', icon: '', category: 'AI' },
  { name: 'AI Chat', path: '/ai-chat', icon: '', category: 'AI' },
  { name: 'AI Demos', path: '/ai-demos', icon: '', category: 'AI' },
  
  // Administration
  { name: 'GST Compliance', path: '/gst', icon: '', category: 'Admin' },
  { name: 'Finance', path: '/finance', icon: '', category: 'Admin' },
  { name: 'HR Management', path: '/hr', icon: '', category: 'Admin' },
  { name: 'User Management', path: '/user', icon: '', category: 'Admin' },
  { name: 'Schemes & Offers', path: '/schemes', icon: '', category: 'Admin' },
  { name: 'Notifications', path: '/notifications', icon: '', category: 'Admin' },
  { name: 'Settings', path: '/settings', icon: '', category: 'Admin' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Don't show sidebar on login page or homepage
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600"> Yeelo</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-100"
          >
            {sidebarOpen ? '' : ''}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Core Operations */}
          {sidebarOpen && <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Core</div>}
          {menuItems.filter(item => item.category === 'Core').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Point of Sale */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">POS</div>}
          {menuItems.filter(item => item.category === 'POS').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Customer Management */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Customers</div>}
          {menuItems.filter(item => item.category === 'Customers').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Marketing */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Marketing</div>}
          {menuItems.filter(item => item.category === 'Marketing').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Reports & Analytics */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Analytics</div>}
          {menuItems.filter(item => item.category === 'Reports').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Operations */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Operations</div>}
          {menuItems.filter(item => item.category === 'Operations').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* AI & Automation */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">AI & Automation</div>}
          {menuItems.filter(item => item.category === 'AI').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}

          {/* Administration */}
          {sidebarOpen && <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Administration</div>}
          {menuItems.filter(item => item.category === 'Admin').map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                } flex items-center px-4 py-2 transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <div className="font-medium text-sm">Admin</div>
                <div className="text-xs text-gray-500">admin@yeelo.com</div>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mx-auto">
              A
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => pathname === item.path || pathname.startsWith(item.path + '/'))?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + New
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
