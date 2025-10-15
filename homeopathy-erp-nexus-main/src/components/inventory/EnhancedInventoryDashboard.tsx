
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Clock, TrendingDown, Warehouse, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BatchTrackingSystem from './BatchTrackingSystem';
import StockMovementLogs from './StockMovementLogs';
import ExpiryAlertSystem from './ExpiryAlertSystem';

const EnhancedInventoryDashboard = () => {
  const { getAll, getLowStockItems, getSoonToExpireItems } = useDatabase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch inventory data
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-items'],
    queryFn: () => getLowStockItems()
  });

  const { data: expiringSoonItems = [] } = useQuery({
    queryKey: ['expiring-soon-items'],
    queryFn: () => getSoonToExpireItems(90) // 90 days threshold
  });

  // Calculate inventory metrics
  const totalBatches = inventory.length;
  const totalProducts = products.length;
  const outOfStockItems = inventory.filter(item => item.quantityInStock <= 0).length;
  
  const totalInventoryValue = inventory.reduce((sum, item) => {
    return sum + (item.purchasePrice * item.quantityInStock);
  }, 0);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Inventory Management</h2>
          <p className="text-muted-foreground">
            Complete inventory control with batch tracking and expiry management
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Unique products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              Individual batch records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items need reorder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{expiringSoonItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Within 90 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batches">Batch Tracking</TabsTrigger>
          <TabsTrigger value="alerts">Expiry Alerts</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-muted-foreground">No low stock items</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">Batch: {item.batchNumber}</p>
                        </div>
                        <Badge variant="destructive">{item.quantityInStock} left</Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{lowStockItems.length - 5} more items
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringSoonItems.length === 0 ? (
                  <p className="text-muted-foreground">No items expiring soon</p>
                ) : (
                  <div className="space-y-2">
                    {expiringSoonItems.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          {Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    ))}
                    {expiringSoonItems.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{expiringSoonItems.length - 5} more items
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <BatchTrackingSystem />
        </TabsContent>

        <TabsContent value="alerts">
          <ExpiryAlertSystem />
        </TabsContent>

        <TabsContent value="movements">
          <StockMovementLogs />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Stock Valuation Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  Expiry Analysis Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingDown className="h-6 w-6 mb-2" />
                  Slow Moving Stock Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedInventoryDashboard;
