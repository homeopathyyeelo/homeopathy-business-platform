'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function SalesOrdersPage() {
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ['sales', 'orders'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/sales/orders')
      return res.data?.orders || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'order_number', title: 'Order #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'customer_name', title: 'Customer', sortable: true },
    { key: 'total_amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold">₹{val?.toLocaleString()}</span> },
    { key: 'status', title: 'Status', sortable: true, render: (val: any) => <Badge>{val}</Badge> },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'PENDING').length,
    totalValue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders & Quotations</h1>
          <p className="text-gray-600">Manage customer orders and quotations</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Orders"
        columns={columns}
        data={orders}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
