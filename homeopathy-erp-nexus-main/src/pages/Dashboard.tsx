
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Database, ShoppingCart, Users, AlertTriangle, Package, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { getAll, getLowStockItems, getSoonToExpireItems } = useDatabase();
  
  // Real data from database
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => getLowStockItems()
  });

  const { data: expiringSoonItems = [] } = useQuery({
    queryKey: ['expiring-soon'],
    queryFn: () => getSoonToExpireItems(30)
  });

  // Calculate real metrics
  const totalRevenue = invoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
  const totalInventoryValue = inventory.reduce((sum: number, item: any) => 
    sum + ((item.quantity_in_stock || 0) * (item.purchase_price || 0)), 0);
  const outOfStockItems = inventory.filter((item: any) => (item.quantity_in_stock || 0) <= 0).length;

  // Generate sales data for last 6 months
  const salesData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthInvoices = invoices.filter((inv: any) => {
      const invDate = new Date(inv.invoice_date || inv.created_at);
      return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
    });
    
    return {
      name: date.toLocaleDateString('en', { month: 'short' }),
      sales: monthInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
    };
  });

  // Inventory by potency analysis
  const potencyData = [
    { name: 'MT', count: inventory.filter((item: any) => item.products?.potency?.includes('MT')).length },
    { name: '6C', count: inventory.filter((item: any) => item.products?.potency?.includes('6C')).length },
    { name: '30C', count: inventory.filter((item: any) => item.products?.potency?.includes('30C')).length },
    { name: '200C', count: inventory.filter((item: any) => item.products?.potency?.includes('200C')).length },
    { name: '1M', count: inventory.filter((item: any) => item.products?.potency?.includes('1M')).length },
  ];

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Real-time data from your homeopathy store
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <TrendingUp className="mr-1 h-4 w-4" />
                From {invoices.length} invoices
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              {inventory.length} batches in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active customer base
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lowStockItems.length + expiringSoonItems.length}
            </div>
            <p className="text-xs text-muted-foreground text-orange-700">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banners */}
      {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800 mb-2">{lowStockItems.length} items are running low</p>
                <div className="flex flex-wrap gap-1">
                  {lowStockItems.slice(0, 3).map((item: any, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {item.products?.name || item.product?.name || 'Unknown'}
                    </Badge>
                  ))}
                  {lowStockItems.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{lowStockItems.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringSoonItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="h-5 w-5" />
                  Expiry Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-800 mb-2">{expiringSoonItems.length} items expiring within 30 days</p>
                <div className="flex flex-wrap gap-1">
                  {expiringSoonItems.slice(0, 3).map((item: any, index: number) => (
                    <Badge key={index} className="text-xs bg-orange-100 text-orange-800">
                      {item.products?.name || item.product?.name || 'Unknown'}
                    </Badge>
                  ))}
                  {expiringSoonItems.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{expiringSoonItems.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
            <CardDescription>Sales performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Sales']} />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Potency</CardTitle>
            <CardDescription>Distribution of products across potencies</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={potencyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/sales')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Quick Sale</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Start new sale</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/master')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="font-medium">Add Product</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Add to inventory</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/customers')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="font-medium">New Customer</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Register customer</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/purchases')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Purchase Order</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Order supplies</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
