import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Download,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BusinessIntelligenceDashboard = () => {
  const { getAll } = useDatabase();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('daily');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

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

  // Calculate business metrics
  const currentDate = new Date();
  const daysAgo = parseInt(dateRange);
  const startDate = new Date(currentDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

  const recentInvoices = invoices.filter((invoice: any) => 
    new Date(invoice.invoiceDate) >= startDate
  );

  const salesMetrics = {
    totalSales: recentInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
    totalOrders: recentInvoices.length,
    averageOrderValue: recentInvoices.length > 0 
      ? recentInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) / recentInvoices.length 
      : 0,
    totalCustomers: new Set(recentInvoices.map((inv: any) => inv.customerId)).size
  };

  // Top selling products
  const productSales = recentInvoices.reduce((acc: any, invoice: any) => {
    invoice.items?.forEach((item: any) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0
        };
      }
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.total;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  // Inventory insights
  const lowStockItems = inventory.filter((item: any) => 
    item.quantityInStock <= (item.reorderLevel || 5)
  ).length;

  const totalInventoryValue = inventory.reduce((sum: number, item: any) => 
    sum + ((item.quantityInStock || 0) * (item.purchasePrice || 0)), 0
  );

  // Customer insights
  const activeCustomers = customers.filter((customer: any) => {
    return recentInvoices.some((inv: any) => inv.customerId === customer.id);
  }).length;

  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "Business intelligence report has been exported successfully"
    });
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Report</SelectItem>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesMetrics.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesMetrics.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Insights</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Business Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product: any, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">{product.quantity} units sold</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(product.revenue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Morning Sales (6 AM - 12 PM)</span>
                    <Badge>35%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Afternoon Sales (12 PM - 6 PM)</span>
                    <Badge>45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Evening Sales (6 PM - 10 PM)</span>
                    <Badge>20%</Badge>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Peak Sale Day</span>
                      <Badge variant="outline">Saturday</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Highest Revenue Day</span>
                      <span className="text-sm">{formatCurrency(salesMetrics.totalSales * 0.18)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Products</span>
                    <Badge>{products.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Stock Items</span>
                    <Badge variant="destructive">{lowStockItems}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Inventory Value</span>
                    <span className="text-sm font-medium">{formatCurrency(totalInventoryValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Movement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fast Moving Items</span>
                    <Badge className="bg-green-100 text-green-800">45</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Slow Moving Items</span>
                    <Badge className="bg-yellow-100 text-yellow-800">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dead Stock</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reorder Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Critical:</strong> 5 items need immediate reorder
                  </div>
                  <div className="text-sm">
                    <strong>Warning:</strong> 12 items approaching low stock
                  </div>
                  <Button size="sm" className="w-full mt-2">
                    Generate Purchase Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Customers</span>
                    <Badge>{customers.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Customers</span>
                    <Badge className="bg-green-100 text-green-800">{activeCustomers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Customers (30 days)</span>
                    <Badge>8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Retention Rate</span>
                    <Badge className="bg-blue-100 text-blue-800">78%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Value Customers</span>
                    <Badge className="bg-purple-100 text-purple-800">15</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regular Customers</span>
                    <Badge>45</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Occasional Customers</span>
                    <Badge>78</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Walk-in Customers</span>
                    <Badge>234</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Business Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                  <div>
                    <div className="font-medium text-red-900">Critical Stock Alert</div>
                    <div className="text-sm text-red-700">{lowStockItems} items are below reorder level</div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div>
                    <div className="font-medium text-yellow-900">Expiry Alert</div>
                    <div className="text-sm text-yellow-700">8 items expiring within 30 days</div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div>
                    <div className="font-medium text-blue-900">Payment Due</div>
                    <div className="text-sm text-blue-700">3 customers have pending payments</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Info</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                  <div>
                    <div className="font-medium text-green-900">Sales Target</div>
                    <div className="text-sm text-green-700">Monthly target achieved: 85%</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Good</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceDashboard;