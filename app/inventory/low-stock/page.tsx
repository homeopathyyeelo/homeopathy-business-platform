'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertTriangle, Package, TrendingUp, Filter, Search, RefreshCw, Bell
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/utils/api-fetch';

interface LowStockItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  brand: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
  reorder_qty: number;
  last_sale_date: string;
  days_since_last_sale: number;
  avg_monthly_sales: number;
  stock_status: 'critical' | 'low' | 'out_of_stock';
  warehouse_name: string;
  suggested_reorder: number;
}

export default function LowStockPage() {
  const { toast } = useToast();
  const [data, setData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    warehouse: '',
    search: ''
  });

  const [stats, setStats] = useState({
    critical: 0,
    low: 0,
    out_of_stock: 0,
    total_value: 0
  });

  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  const warehouses = [...new Set(data.map(item => item.warehouse_name).filter(Boolean))];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/erp/inventory/alerts/low-stock');
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);

        // Calculate stats
        const critical = result.data?.filter((item: LowStockItem) => item.stock_status === 'critical').length || 0;
        const low = result.data?.filter((item: LowStockItem) => item.stock_status === 'low').length || 0;
        const outOfStock = result.data?.filter((item: LowStockItem) => item.stock_status === 'out_of_stock').length || 0;
        const totalValue = result.data?.reduce((sum: number, item: LowStockItem) =>
          sum + (item.suggested_reorder * 100), 0) || 0; // Approximate value

        setStats({
          critical,
          low,
          out_of_stock,
          total_value: totalValue
        });
      }
    } catch (error) {
      console.error('Failed to fetch low stock data:', error);
      toast({
        title: "Error",
        description: "Failed to load low stock alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'critical': 'destructive',
      'low': 'outline',
      'out_of_stock': 'destructive',
    };
    return variants[status] || 'outline';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'critical': 'text-red-600 bg-red-50',
      'low': 'text-yellow-600 bg-yellow-50',
      'out_of_stock': 'text-red-700 bg-red-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const filteredData = data.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status && item.stock_status !== filters.status) return false;
    if (filters.warehouse && item.warehouse_name !== filters.warehouse) return false;
    if (filters.search && !item.product_name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !item.sku.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleReorder = async (item: LowStockItem) => {
    // This would typically open a reorder modal or navigate to purchase order creation
    toast({
      title: "Reorder Initiated",
      description: `Creating reorder for ${item.product_name}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage inventory that needs restocking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/purchases/upload'}>
            <Package className="h-4 w-4 mr-2" />
            Purchase Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
            <p className="text-xs text-muted-foreground">
              Plan to reorder soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.out_of_stock}</div>
            <p className="text-xs text-muted-foreground">
              Currently unavailable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Reorder Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.total_value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total suggested reorder value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Product name or SKU..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={filters.warehouse} onValueChange={(value) => setFilters(prev => ({ ...prev, warehouse: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ category: '', status: '', warehouse: '', search: '' })}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Low Stock Items ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading low stock data...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No low stock items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Reorder Qty</TableHead>
                    <TableHead>Monthly Sales</TableHead>
                    <TableHead>Days Since Sale</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.sku}</Badge>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${getStatusColor(item.stock_status)}`}>
                          {item.current_stock}
                        </span>
                      </TableCell>
                      <TableCell>{item.min_threshold}</TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">
                          {item.suggested_reorder}
                        </span>
                      </TableCell>
                      <TableCell>{item.avg_monthly_sales.toFixed(1)}</TableCell>
                      <TableCell>
                        <span className={item.days_since_last_sale > 30 ? 'text-orange-600' : ''}>
                          {item.days_since_last_sale}d
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(item.stock_status)}>
                          {item.stock_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleReorder(item)}
                          disabled={item.stock_status === 'out_of_stock'}
                        >
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
