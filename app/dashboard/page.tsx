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

  // Mock stats - in real implementation, these would come from API
  const [stats] = useState<DashboardStats>({
    totalSales: 2450000,
    totalPurchases: 1850000,
    totalStock: 1200000,
    totalProfit: 600000,
    todaySales: 45000,
    weekSales: 285000,
    monthSales: 1250000,
    todayPurchases: 32000,
    weekPurchases: 195000,
    monthPurchases: 850000,
    todayStockValue: 45000,
    lowStockCount: 12,
    expiryCount: 8,
    activeCustomers: 245,
    totalVendors: 15
  });

  // Mock activity data
  const [recentActivity] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'sale',
      description: 'Sale to Customer ABC - ₹8,500',
      amount: 8500,
      timestamp: '2024-01-15T14:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      type: 'stock',
      description: 'Low stock alert - Arnica Montana 200CH',
      timestamp: '2024-01-15T13:15:00Z',
      status: 'warning'
    },
    {
      id: '3',
      type: 'purchase',
      description: 'Purchase from SBL - ₹45,000',
      amount: 45000,
      timestamp: '2024-01-15T11:45:00Z',
      status: 'success'
    },
    {
      id: '4',
      type: 'customer',
      description: 'New customer registered - Priya Sharma',
      timestamp: '2024-01-15T10:20:00Z',
      status: 'success'
    },
    {
      id: '5',
      type: 'stock',
      description: 'Batch expired - Belladonna 30CH',
      timestamp: '2024-01-15T09:30:00Z',
      status: 'error'
    }
  ]);

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

  // Sales data for charts
  const salesData = [
    { month: 'Jan', sales: 120000, purchases: 80000 },
    { month: 'Feb', sales: 150000, purchases: 95000 },
    { month: 'Mar', sales: 180000, purchases: 110000 },
    { month: 'Apr', sales: 160000, purchases: 100000 },
    { month: 'May', sales: 200000, purchases: 125000 },
    { month: 'Jun', sales: 220000, purchases: 140000 },
  ];

  // Top selling products
  const topProducts = products
    .sort((a: any, b: any) => (b.total_sold || 0) - (a.total_sold || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Homeopathy ERP Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Complete business overview and key metrics</p>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-green-700 dark:text-green-400">
              <div className="p-2 bg-green-500 rounded-lg mr-3">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalSales)}</div>
            <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="font-semibold">+12%</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-blue-700 dark:text-blue-400">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <Truck className="w-5 h-5 text-white" />
              </div>
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.totalPurchases)}</div>
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="font-semibold">+8%</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-purple-700 dark:text-purple-400">
              <div className="p-2 bg-purple-500 rounded-lg mr-3">
                <Package className="w-5 h-5 text-white" />
              </div>
              Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.totalStock)}</div>
            <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 mt-2">
              <ArrowDown className="w-4 h-4 mr-1" />
              <span className="font-semibold">-2%</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-amber-700 dark:text-amber-400">
              <div className="p-2 bg-amber-500 rounded-lg mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stats.totalProfit)}</div>
            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span className="font-semibold">+15%</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-indigo-100 dark:border-indigo-800">
            <CardTitle className="text-lg font-bold text-indigo-700 dark:text-indigo-400 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Performance
            </CardTitle>
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

        <Card className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-b border-blue-100 dark:border-blue-800">
            <CardTitle className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              This Week
            </CardTitle>
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

        <Card className="bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-800 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-b border-emerald-100 dark:border-emerald-800">
            <CardTitle className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              This Month
            </CardTitle>
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales vs Purchase Chart */}
        <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-blue-600" />
              Sales vs Purchase Trend
            </CardTitle>
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
        <Card className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-b border-red-200 dark:border-red-800">
            <CardTitle className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center">
              <Bell className="w-6 h-6 mr-2 animate-pulse" />
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
            <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/reports')}>
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
