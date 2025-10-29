'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Plus, Search, Filter, Package, AlertTriangle, TrendingUp, DollarSign
} from 'lucide-react';
import { useEnhancedInventory, useStockReport, useLowStockAlerts, useExpiryAlerts } from '@/lib/hooks/inventory';
import { useProducts } from '@/lib/hooks/products';
import { useRouter } from 'next/navigation';

export default function StockListPage() {
  const router = useRouter();
  const ALL_VALUE = '__ALL__';
  const [filters, setFilters] = useState({
    product_id: '',
    category: '',
    batch_no: '',
    expiry_status: '',
  });

  const { data: productsData } = useProducts();
  const products: any[] = Array.isArray(productsData)
    ? (productsData as any[])
    : (Array.isArray((productsData as any)?.items) ? (productsData as any).items
      : (Array.isArray((productsData as any)?.data) ? (productsData as any).data : []));

  const { data: stockResponse, isLoading } = useEnhancedInventory(filters);
  const stock = stockResponse?.data || [];

  const { data: reportResponse } = useStockReport();
  const report = reportResponse?.data
    ? {
        ...reportResponse.data,
        top_products: Array.isArray(reportResponse.data.top_products)
          ? reportResponse.data.top_products
          : [],
        category_summary: Array.isArray(reportResponse.data.category_summary)
          ? reportResponse.data.category_summary
          : [],
      }
    : undefined;

  const { data: lowStockResponse } = useLowStockAlerts();
  const lowStockAlerts = lowStockResponse?.data || [];

  const { data: expiryResponse } = useExpiryAlerts();
  const expiryAlerts = expiryResponse?.data || [];

  // Filter products by category
  const categories = [...new Set(products.map((p: any) => p?.category).filter(Boolean))];

  const handleFilterChange = (key: string, value: string) => {
    // Map ALL_VALUE back to empty string for "no filter"
    const mapped = value === ALL_VALUE ? '' : value;
    setFilters(prev => ({ ...prev, [key]: mapped }));
  };

  const getExpiryStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'fresh': 'default',
      'expiring_7d': 'destructive',
      'expiring_1m': 'outline',
      'expiring_3m': 'secondary',
      'expired': 'destructive',
    };
    return variants[status] || 'outline';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'active': 'default',
      'expired': 'destructive',
      'damaged': 'outline',
      'quarantined': 'secondary',
    };
    return variants[status] || 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Stock Management</h1>
          <p className="text-muted-foreground">Batch-wise inventory tracking with expiry alerts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/inventory/stock/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Stock
          </Button>
          <Button variant="outline" onClick={() => router.push('/purchases/upload')}>
            Upload Purchase
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">
              {report?.total_batches || 0} batches tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{(report?.total_selling_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost: ₹{(report?.total_stock_value || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiryAlerts.filter(a => a.alert_type === 'expiring_7d').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={filters.product_id === '' ? ALL_VALUE : filters.product_id} onValueChange={(value) => handleFilterChange('product_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Products</SelectItem>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category === '' ? ALL_VALUE : filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Batch No</label>
              <Input
                placeholder="Search batch..."
                value={filters.batch_no}
                onChange={(e) => handleFilterChange('batch_no', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Status</label>
              <Select value={filters.expiry_status === '' ? ALL_VALUE : filters.expiry_status} onValueChange={(value) => handleFilterChange('expiry_status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Status</SelectItem>
                  <SelectItem value="fresh">Fresh</SelectItem>
                  <SelectItem value="expiring_7d">Expiring (7D)</SelectItem>
                  <SelectItem value="expiring_1m">Expiring (1M)</SelectItem>
                  <SelectItem value="expiring_3m">Expiring (3M)</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary ({stock.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading stock data...</div>
          ) : stock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Qty In</TableHead>
                    <TableHead>Qty Out</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Purchase Rate</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Status</TableHead>
                    <TableHead>Warehouse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((item: any) => (
                    <TableRow key={`${item.product_id}-${item.batch_no}`}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.batch_no}</Badge>
                      </TableCell>
                      <TableCell>{item.qty_in}</TableCell>
                      <TableCell>{item.qty_out}</TableCell>
                      <TableCell className="font-bold">
                        {item.balance}
                      </TableCell>
                      <TableCell>₹{item.mrp || 0}</TableCell>
                      <TableCell>₹{item.purchase_rate || 0}</TableCell>
                      <TableCell>
                        {typeof item.margin_percent === 'number' ? (
                          <span className={item.margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.margin_percent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.exp_date ? new Date(item.exp_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExpiryStatusBadge(item.expiry_status)}>
                          {item.expiry_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Summary */}
      {report?.category_summary && report.category_summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {report.category_summary.map((category: any) => (
                <div key={category.category} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{category.category}</h3>
                    <Badge variant="outline">{category.products_count} products</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Batches: {category.batches_count}</p>
                    <p>Quantity: {category.total_quantity}</p>
                    <p>Value: ₹{category.total_selling_value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
