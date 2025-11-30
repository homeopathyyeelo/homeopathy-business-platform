'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { useInventory, useLowStock, useInventoryStats } from '@/lib/hooks/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SmartInsights from '@/components/smart-insights/SmartInsights';

export default function InventoryDashboardPage() {
  const { data: inventory = [], isLoading } = useInventory();
  const { data: lowStock = [] } = useLowStock();
  const stats = useInventoryStats(inventory);

  const columns = [
    {
      key: 'product_id',
      title: 'Product ID',
      sortable: true,
      render: (val: any) => <span className="font-mono text-sm">#{val}</span>
    },
    {
      key: 'product_name',
      title: 'Product Name',
      sortable: true,
      render: (val: any, row: any) => (
        <div>
          <div className="font-medium">{val}</div>
          <div className="text-xs text-gray-500">{row.product_sku}  {row.product_category}</div>
        </div>
      )
    },
    {
      key: 'stock_qty',
      title: 'Stock',
      sortable: true,
      render: (val: any, row: any) => {
        const stock = val ?? row.stock ?? 0;
        const reorderPoint = row.reorder_point ?? 5;
        return (
          <span className={`font-semibold ${
            stock === 0 ? 'text-red-600' :
            stock <= reorderPoint ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {stock} units
          </span>
        );
      }
    },
    {
      key: 'unit_price',
      title: 'Unit Price',
      sortable: true,
      render: (val: any, row: any) => (
        <span className="font-semibold">{(val ?? row.price)?.toLocaleString()}</span>
      )
    },
    {
      key: 'stock_value',
      title: 'Stock Value',
      sortable: true,
      render: (val: any, row: any) => {
        const stock = row.stock_qty ?? row.stock ?? 0;
        const price = row.unit_price ?? row.price ?? 0;
        return <span className="font-semibold">{(stock * price).toLocaleString()}</span>;
      }
    },
    {
      key: 'reorder_point',
      title: 'Reorder Point',
      sortable: true,
      render: (val: any) => (
        <span className="text-sm">{val ?? 5}</span>
      )
    },
    {
      key: 'last_restocked',
      title: 'Last Restocked',
      sortable: true,
      render: (val: any) => val ? new Date(val).toLocaleDateString() : 'Never'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStockValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              {lowStock.length} products are running low on stock and need attention.
            </p>
            <div className="mt-2 flex gap-2">
              {lowStock.slice(0, 3).map((item: any) => (
                <span key={item.product_id} className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                  {item.product_name}: {item.stock_qty ?? item.stock ?? 0} left
                </span>
              ))}
              {lowStock.length > 3 && (
                <span className="text-xs text-yellow-600">+{lowStock.length - 3} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <DataTable
        title="Inventory Management"
        columns={columns}
        data={inventory}
        loading={isLoading}
        onAdd={() => console.log('Add inventory item')}
        onEdit={(row) => console.log('Edit inventory item', row)}
        onDelete={(row) => console.log('Delete inventory item', row)}
        onView={(row) => console.log('View inventory item', row)}
      />
    </div>
  );
}
