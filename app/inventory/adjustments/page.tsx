'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, TrendingUp, TrendingDown, Plus } from 'lucide-react';

export default function StockAdjustmentsPage() {
  const { data: adjustments = [], isLoading: loading } = useQuery({
    queryKey: ['inventory', 'adjustments'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/inventory/adjustments')
      return res.data?.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'adjustment_number', title: 'Adjustment #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'product_name', title: 'Product', sortable: true },
    { key: 'type', title: 'Type', sortable: true, render: (val: any) => {
      const isIncrease = val === 'INCREASE';
      return (
        <Badge variant={isIncrease ? 'default' : 'destructive'}>
          {isIncrease ? '+ INCREASE' : '- DECREASE'}
        </Badge>
      );
    }},
    { key: 'quantity', title: 'Quantity', sortable: true, render: (val: any, row: any) => {
      const isIncrease = row.type === 'INCREASE';
      return (
        <span className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
          {isIncrease ? '+' : '-'}{val} units
        </span>
      );
    }},
    { key: 'reason', title: 'Reason', sortable: true },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: adjustments.length,
    increases: adjustments.filter((a: any) => a.type === 'INCREASE').length,
    decreases: adjustments.filter((a: any) => a.type === 'DECREASE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Adjustments</h1>
          <p className="text-gray-600">Manual inventory adjustments and corrections</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Edit3 className="w-4 h-4 mr-2" />
              Total Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stock Increases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.increases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Stock Decreases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.decreases}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Adjustments"
        columns={columns}
        data={adjustments}
        loading={loading}
        onAdd={() => console.log('Add')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
