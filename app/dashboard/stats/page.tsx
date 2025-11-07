'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
import { authFetch } from '@/lib/api/fetch-utils';
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, AlertTriangle,
  DollarSign, Activity, BarChart3, Clock, CheckCircle, XCircle, Truck, Store
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface DashboardStats {
  total_sales: number
  total_purchases: number
  total_customers: number
  total_products: number
  low_stock_items: number
  expiring_items: number
  pending_orders: number
  today_revenue: number
  month_revenue: number
  year_revenue: number
  active_users: number
  pending_invoices: number
}

interface TopProduct {
  product_id: string
  product_name: string
  sold_qty: number
  revenue: number
}

interface RecentSale {
  id: string
  invoice_no: string
  customer_name: string
  amount: number
  status: string
  created_at: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_sales: 0,
    total_purchases: 0,
    total_customers: 0,
    total_products: 0,
    low_stock_items: 0,
    expiring_items: 0,
    pending_orders: 0,
    today_revenue: 0,
    month_revenue: 0,
    year_revenue: 0,
    active_users: 0,
    pending_invoices: 0
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch stats
      const statsRes = await authFetch(`${API_URL}/api/erp/dashboard/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
        }
      }

      // Fetch top products
      const productsRes = await authFetch(`${API_URL}/api/erp/dashboard/top-products?limit=5`)
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        if (productsData.success && productsData.data) {
          setTopProducts(productsData.data)
        }
      }

      // Fetch recent sales
      const salesRes = await authFetch(`${API_URL}/api/erp/dashboard/recent-sales?limit=5`)
      if (salesRes.ok) {
        const salesData = await salesRes.json()
        if (salesData.success && salesData.data) {
          setRecentSales(salesData.data)
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Using default values.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Dashboard Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-gray-200 rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-8 bg-gray-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Statistics</h1>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.today_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Daily sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Month Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.month_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Year Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.year_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Yearly sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales & Purchases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.total_sales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.total_purchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.low_stock_items}</div>
            <p className="text-xs text-muted-foreground">Items below min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiring_items}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_orders}</div>
            <p className="text-xs text-muted-foreground">Awaiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer & User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_users}</div>
            <p className="text-xs text-muted-foreground">Online now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <ShoppingCart className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_invoices}</div>
            <p className="text-xs text-muted-foreground">Need approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.sold_qty} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No product sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{sale.invoice_no}</span>
                      <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                        {sale.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{sale.customer_name}</p>
                    <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{formatCurrency(sale.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No recent sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Today vs Target</span>
                <span className="font-semibold">{((stats.today_revenue / 50000) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(stats.today_revenue / 50000) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Month vs Target</span>
                <span className="font-semibold">{((stats.month_revenue / 500000) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(stats.month_revenue / 500000) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Year vs Target</span>
                <span className="font-semibold">{((stats.year_revenue / 5000000) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(stats.year_revenue / 5000000) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Total Products</span>
              </div>
              <span className="font-semibold">{stats.total_products}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Low Stock</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.low_stock_items}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-sm">Expiring Soon</span>
              </div>
              <span className="font-semibold text-red-600">{stats.expiring_items}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Stock Health</span>
              </div>
              <span className="font-semibold text-green-600">
                {((1 - (stats.low_stock_items / stats.total_products)) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
          {error}
        </div>
      )}
    </div>
  )
}
