"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/api/fetch-utils';

interface ServiceStatus {
  name: string
  url: string
  status: 'online' | 'offline' | 'checking'
  responseTime?: number
}

export default function DashboardPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Auth Service', url: 'http://localhost:3001/health', status: 'checking' },
    { name: 'NestJS API', url: 'http://localhost:3002/health', status: 'checking' },
    { name: 'Express API', url: 'http://localhost:3003/health', status: 'checking' },
    { name: 'Golang API', url: 'http://localhost:3005/health', status: 'checking' },
    { name: 'AI Service', url: 'http://localhost:8001/health', status: 'checking' },
  ])

  useEffect(() => {
    checkServices()
    const interval = setInterval(checkServices, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        try {
          const start = Date.now()
          const response = await authFetch(service.url, {
            mode: 'cors',
            cache: 'no-store',
          })
          const responseTime = Date.now() - start
          
          if (response.ok) {
            return { ...service, status: 'online' as const, responseTime }
          } else {
            return { ...service, status: 'offline' as const }
          }
        } catch (error) {
          return { ...service, status: 'offline' as const }
        }
      })
    )
    setServices(updatedServices)
  }

  const onlineCount = services.filter(s => s.status === 'online').length

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">System Status</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl font-bold text-green-600">
            {onlineCount}/{services.length}
          </div>
          <div>
            <div className="text-sm text-gray-500">Services Online</div>
            <div className="text-xs text-gray-400">Real-time monitoring</div>
          </div>
          <div className={`ml-auto h-4 w-4 rounded-full ${onlineCount === services.length ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {services.map((service) => (
            <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${
                  service.status === 'online' ? 'bg-green-500' :
                  service.status === 'offline' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`} />
                <span className={`text-xs font-medium ${
                  service.status === 'online' ? 'text-green-600' :
                  service.status === 'offline' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {service.status}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900">{service.name}</div>
              {service.responseTime && (
                <div className="text-xs text-gray-500 mt-1">{service.responseTime}ms</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹45,231</p>
              <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">126</p>
              <p className="text-xs text-green-600 mt-1">+8.2% from last month</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">1,849</p>
              <p className="text-xs text-green-600 mt-1">+5.4% from last month</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-xs text-red-600 mt-1">Requires attention</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/products" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="font-medium text-gray-900">Manage Products</div>
          </Link>
          <Link href="/pos" className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-medium text-gray-900">New Sale</div>
          </Link>
          <Link href="/customers" className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-medium text-gray-900">View Customers</div>
          </Link>
          <Link href="/analytics" className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-medium text-gray-900">View Reports</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              ✓
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New order #ORD-1234</p>
              <p className="text-sm text-gray-500">2 minutes ago</p>
            </div>
            <div className="text-green-600 font-semibold">₹2,450</div>
          </div>
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              👤
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New customer registered</p>
              <p className="text-sm text-gray-500">15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              ⚠
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Low stock alert for Arnica 200CH</p>
              <p className="text-sm text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
