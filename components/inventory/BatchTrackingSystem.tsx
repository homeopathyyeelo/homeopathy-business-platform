
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, Package, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BatchTrackingSystem = () => {
  const { getAll, create, update } = useDatabase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inventory = [], refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  // Calculate expiry alerts
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const expiredItems = inventory.filter((item: any) => {
    const expiryDate = new Date(item.expiry_date);
    return expiryDate < today;
  });

  const expiringInThirtyDays = inventory.filter((item: any) => {
    const expiryDate = new Date(item.expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  });

  const expiringInNinetyDays = inventory.filter((item: any) => {
    const expiryDate = new Date(item.expiry_date);
    return expiryDate > thirtyDaysFromNow && expiryDate <= ninetyDaysFromNow;
  });

  const lowStockItems = inventory.filter((item: any) => {
    const product = products.find((p: any) => p.id === item.product_id);
    return item.quantity_in_stock <= (product?.reorder_level || 5);
  });

  const filteredInventory = inventory.filter((item: any) => {
    const product = products.find((p: any) => p.id === item.product_id);
    const productName = product?.name?.toLowerCase() || '';
    const batchNumber = item.batch_number?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return productName.includes(searchLower) || batchNumber.includes(searchLower);
  });

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      return { status: 'expired', label: 'Expired', variant: 'destructive' as const };
    } else if (daysToExpiry <= 30) {
      return { status: 'critical', label: `${daysToExpiry} days`, variant: 'destructive' as const };
    } else if (daysToExpiry <= 90) {
      return { status: 'warning', label: `${daysToExpiry} days`, variant: 'secondary' as const };
    } else {
      return { status: 'good', label: `${daysToExpiry} days`, variant: 'default' as const };
    }
  };

  const getStockStatus = (item: any) => {
    const product = products.find((p: any) => p.id === item.product_id);
    const reorderLevel = product?.reorder_level || 5;
    
    if (item.quantity_in_stock <= 0) {
      return { status: 'out', label: 'Out of Stock', variant: 'destructive' as const };
    } else if (item.quantity_in_stock <= reorderLevel) {
      return { status: 'low', label: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { status: 'good', label: 'In Stock', variant: 'default' as const };
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Batch Tracking & Expiry Management</h2>
        <p className="text-muted-foreground">
          Monitor batch-wise inventory, expiry dates, and stock levels
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-red-800">{expiredItems.length} Expired Items</div>
            <div className="text-sm text-red-600">Immediate action required</div>
          </AlertDescription>
        </Alert>

        <Alert className="border-orange-200 bg-orange-50">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-orange-800">{expiringInThirtyDays.length} Expiring Soon</div>
            <div className="text-sm text-orange-600">Within 30 days</div>
          </AlertDescription>
        </Alert>

        <Alert className="border-yellow-200 bg-yellow-50">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-yellow-800">{expiringInNinetyDays.length} Expiring Later</div>
            <div className="text-sm text-yellow-600">Within 90 days</div>
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <Package className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-blue-800">{lowStockItems.length} Low Stock</div>
            <div className="text-sm text-blue-600">Need reordering</div>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="all-batches" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-batches">All Batches</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="expiring-soon">Expiring Soon</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="all-batches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Inventory Batches</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Manufacturing Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Stock Qty</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Expiry Status</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item: any) => {
                    const product = products.find((p: any) => p.id === item.product_id);
                    const stockStatus = getStockStatus(item);
                    const expiryStatus = getExpiryStatus(item.expiry_date);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                        <TableCell>{item.batch_number || 'N/A'}</TableCell>
                        <TableCell>
                          {item.manufacturing_date ? 
                            new Date(item.manufacturing_date).toLocaleDateString('en-IN') : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {item.expiry_date ? 
                            new Date(item.expiry_date).toLocaleDateString('en-IN') : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>{item.quantity_in_stock || 0}</TableCell>
                        <TableCell>{formatCurrency(item.purchase_price || 0)}</TableCell>
                        <TableCell>{formatCurrency(item.selling_price_retail || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={expiryStatus.variant}>
                            {expiryStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.rack_location || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Expired Items - Immediate Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              {expiredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expired items found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Expired</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Value at Risk</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredItems.map((item: any) => {
                      const product = products.find((p: any) => p.id === item.product_id);
                      const daysExpired = Math.ceil((today.getTime() - new Date(item.expiry_date).getTime()) / (1000 * 60 * 60 * 24));
                      const valueAtRisk = (item.quantity_in_stock || 0) * (item.purchase_price || 0);
                      
                      return (
                        <TableRow key={item.id} className="border-red-200 bg-red-50">
                          <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                          <TableCell>{item.batch_number || 'N/A'}</TableCell>
                          <TableCell>{new Date(item.expiry_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-red-600 font-medium">{daysExpired} days</TableCell>
                          <TableCell>{item.quantity_in_stock || 0}</TableCell>
                          <TableCell className="text-red-600 font-medium">{formatCurrency(valueAtRisk)}</TableCell>
                          <TableCell>{item.rack_location || 'N/A'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring-soon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Items Expiring Within 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {expiringInThirtyDays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items expiring in the next 30 days</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Quick Sale Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringInThirtyDays.map((item: any) => {
                      const product = products.find((p: any) => p.id === item.product_id);
                      const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const quickSaleValue = (item.quantity_in_stock || 0) * (item.selling_price_retail || 0) * 0.7; // 30% discount
                      
                      return (
                        <TableRow key={item.id} className="border-orange-200 bg-orange-50">
                          <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                          <TableCell>{item.batch_number || 'N/A'}</TableCell>
                          <TableCell>{new Date(item.expiry_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="text-orange-600 font-medium">{daysLeft} days</TableCell>
                          <TableCell>{item.quantity_in_stock || 0}</TableCell>
                          <TableCell>{formatCurrency(item.selling_price_retail || 0)}</TableCell>
                          <TableCell className="text-green-600 font-medium">{formatCurrency(quickSaleValue)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Low Stock Items - Reorder Required</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No low stock items found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Last Purchase Price</TableHead>
                      <TableHead>Suggested Order Qty</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item: any) => {
                      const product = products.find((p: any) => p.id === item.product_id);
                      const suggestedOrderQty = (product?.reorder_level || 5) * 3; // Order for 3 cycles
                      const estimatedCost = suggestedOrderQty * (item.purchase_price || 0);
                      
                      return (
                        <TableRow key={item.id} className="border-blue-200 bg-blue-50">
                          <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{item.quantity_in_stock || 0}</TableCell>
                          <TableCell>{product?.reorder_level || 5}</TableCell>
                          <TableCell>{formatCurrency(item.purchase_price || 0)}</TableCell>
                          <TableCell className="text-green-600 font-medium">{suggestedOrderQty}</TableCell>
                          <TableCell className="text-green-600 font-medium">{formatCurrency(estimatedCost)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BatchTrackingSystem;
