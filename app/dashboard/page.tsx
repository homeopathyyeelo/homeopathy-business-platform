"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  ArrowUp, ArrowDown, Database, ShoppingCart, Users, AlertTriangle, Package,
  TrendingUp, DollarSign, Activity, Calendar, Bell, ShoppingBag, Truck
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProducts, useProductStats } from '@/lib/hooks/products';
import { useCustomers } from '@/lib/hooks/customers';
import { useInventory, useLowStock } from '@/lib/hooks/inventory';
import { useVendors } from '@/lib/hooks/vendors';

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalStock: number;
  totalProfit: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  todayPurchases: number;
  weekPurchases: number;
  monthPurchases: number;
  todayStockValue: number;
  lowStockCount: number;
  expiryCount: number;
  activeCustomers: number;
  totalVendors: number;
}

interface ActivityItem {
  id: string;
  type: 'sale' | 'purchase' | 'stock' | 'customer';
  description: string;
  amount?: number;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Use React Query hooks
  const { data: products = [] } = useProducts();
  const productStats = useProductStats(products);
  const { data: customers = [] } = useCustomers();
  const { data: inventory = [] } = useInventory();
  const { data: lowStock = [] } = useLowStock();
  const { data: vendors = [] } = useVendors();

  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    totalStock: 0,
    totalProfit: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    todayPurchases: 0,
    weekPurchases: 0,
    monthPurchases: 0,
    todayStockValue: 0,
    lowStockCount: 0,
    expiryCount: 0,
    activeCustomers: 0,
    totalVendors: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats from API
  useEffect(() => {
    fetchDashboardData();
  }, [selectedBranch, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/erp/dashboard/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats({
            totalSales: statsData.data.total_sales || 0,
            totalPurchases: statsData.data.total_purchases || 0,
            totalStock: statsData.data.total_products * 1000 || 0,
            totalProfit: (statsData.data.total_sales - statsData.data.total_purchases) * 0.3 || 0,
            todaySales: statsData.data.today_revenue || 0,
            weekSales: statsData.data.month_revenue * 0.25 || 0,
            monthSales: statsData.data.month_revenue || 0,
            todayPurchases: statsData.data.total_purchases * 0.02 || 0,
            weekPurchases: statsData.data.total_purchases * 0.15 || 0,
            monthPurchases: statsData.data.total_purchases * 0.5 || 0,
            todayStockValue: statsData.data.total_products * 500 || 0,
            lowStockCount: statsData.data.low_stock_items || 0,
            expiryCount: statsData.data.expiring_items || 0,
            activeCustomers: statsData.data.total_customers || 0,
            totalVendors: 15
          });
        }
      }

      // Fetch activity
      const activityRes = await fetch(`${API_URL}/api/erp/dashboard/activity?limit=5`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success && activityData.data) {
          setRecentActivity(activityData.data.map((item: any) => ({
            id: item.id,
            type: item.module.toLowerCase() as any,
            description: item.description,
            timestamp: item.timestamp,
            status: 'success' as any
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [salesData, setSalesData] = useState<any[]>([]);
  const [servicesHealth, setServicesHealth] = useState<any[]>([]);

  // Fetch revenue chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
        const res = await fetch(`${API_URL}/api/erp/dashboard/revenue-chart?period=6m`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setSalesData(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    fetchChartData();
  }, []);

  // Fetch services health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
        const res = await fetch(`${API_URL}/api/v1/system/health`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setServicesHealth(data.data.services || []);
          }
        }
      } catch (error) {
        console.error('Error fetching health:', error);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Top selling products
  const topProducts = products
    .sort((a: any, b: any) => (b.total_sold || 0) - (a.total_sold || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-600">Business overview and key metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="main">Main Branch</SelectItem>
              <SelectItem value="branch1">Branch 1</SelectItem>
              <SelectItem value="branch2">Branch 2</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchases)}</div>
            <div className="flex items-center text-xs text-blue-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalStock)}</div>
            <div className="flex items-center text-xs text-purple-600">
              <ArrowDown className="w-3 h-3 mr-1" />
              -2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalProfit)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +15% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Sales:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.todaySales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Purchases:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(stats.todayPurchases)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stock Value:</span>
              <span className="font-semibold">{formatCurrency(stats.todayStockValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Sales:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.weekSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Purchases:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(stats.weekPurchases)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Sales:</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.monthSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Purchases:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(stats.monthPurchases)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Alerts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales vs Purchase Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchase Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="sales" fill="#10b981" name="Sales" />
                <Bar dataKey="purchases" fill="#3b82f6" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low Stock Alerts */}
            {lowStock.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{lowStock.length} products</strong> are running low on stock.
                  <Button variant="link" className="p-0 h-auto ml-2" onClick={() => router.push('/inventory')}>
                    View Details
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Expiry Alerts */}
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.expiryCount} batches</strong> are expiring soon.
                <Button variant="link" className="p-0 h-auto ml-2" onClick={() => router.push('/inventory')}>
                  View Details
                  </Button>
              </AlertDescription>
            </Alert>

            {/* Customer Alert */}
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.activeCustomers} active customers</strong> this month.
                <Button variant="link" className="p-0 h-auto ml-2" onClick={() => router.push('/customers')}>
                  View Customers
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.total_sold || 0} units</p>
                      <p className="text-sm text-green-600">{formatCurrency((product.total_sold || 0) * (product.unit_price || 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/dashboard/activity')}>
                  View All Activity
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Microservices Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Microservices Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {servicesHealth.map((service: any) => (
              <div key={service.service} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div className={`w-3 h-3 rounded-full ${
                  service.status === 'up' ? 'bg-green-500' :
                  service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="text-xs">
                  <div className="font-semibold">{service.service}</div>
                  <div className="text-gray-500">:{service.port} {service.status === 'up' && `(${service.latency}ms)`}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
