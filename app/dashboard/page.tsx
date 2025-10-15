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
