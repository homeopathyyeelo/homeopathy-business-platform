'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '@/lib/hooks/useAuth';
import { golangAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

interface DashboardStats {
  total_sales: number;
  total_purchases: number;
  total_customers: number;
  total_products: number;
  low_stock_items: number;
  expiring_items: number;
  pending_orders: number;
  today_revenue: number;
  month_revenue: number;
  year_revenue: number;
}

interface CategoryStats {
  category_name: string;
  product_count: number;
  total_value: number;
  percentage: number;
}

interface RevenueData {
  month: string;
  sales: number;
  purchases: number;
}

interface TopProduct {
  product_name: string;
  sold_qty: number;
  revenue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function PremiumDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Use the api utility which handles auth automatically
      const [statsRes, categoriesRes, revenueRes, topProductsRes] = await Promise.all([
        golangAPI.get('/api/erp/dashboard/stats'),
        golangAPI.get('/api/erp/dashboard/category-stats'),
        golangAPI.get('/api/erp/dashboard/revenue-chart?period=7days'),
        golangAPI.get('/api/erp/dashboard/top-products?period=month&limit=5'),
      ]);

      // Handle stats
      if (statsRes && statsRes.data) {
        setStats(statsRes.data.data || null);
      }

      // Handle categories
      if (categoriesRes && categoriesRes.data) {
        setCategoryStats(categoriesRes.data.data || []);
      }

      // Handle revenue chart
      if (revenueRes && revenueRes.data) {
        setRevenueData(revenueRes.data.data || []);
      }

      // Handle top products
      if (topProductsRes && topProductsRes.data) {
        setTopProducts(topProductsRes.data.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      // If 401, redirect to login
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        router.push('/login');
      }
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's your business summary.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-100">Total Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats?.total_sales || 0)}</div>
            <p className="text-xs text-blue-100 mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Today: {formatCurrency(stats?.today_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-100">Total Purchases</CardTitle>
              <ShoppingCart className="h-5 w-5 text-green-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats?.total_purchases || 0)}</div>
            <p className="text-xs text-green-100 mt-2 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              This month: {formatCurrency(stats?.month_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-100">Products</CardTitle>
              <Package className="h-5 w-5 text-purple-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_products || 0}</div>
            <p className="text-xs text-purple-100 mt-2 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats?.low_stock_items || 0} Low Stock
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-100">Customers</CardTitle>
              <Users className="h-5 w-5 text-orange-100" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_customers || 0}</div>
            <p className="text-xs text-orange-100 mt-2 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {stats?.pending_orders || 0} Pending Orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            <CardDescription>Sales vs Purchases comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchases" stroke="#10b981" fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>This month's bestsellers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {product.sold_qty}</p>
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Category-wise Inventory Distribution</CardTitle>
            <CardDescription>Product count and value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats as any[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.category_name}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="product_count"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [value, props.payload.category_name]} />
                <Legend formatter={(value, entry: any) => entry.payload.category_name} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Category-wise Stock Value</CardTitle>
            <CardDescription>Total inventory value breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryStats.map((cat, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.category_name || 'Uncategorized'}</span>
                    <span className="text-muted-foreground">{formatCurrency(cat.total_value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {cat.product_count} items
                    </span>
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
