'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TruckIcon, ArrowRightLeft, CheckCircle, Plus } from 'lucide-react';

export default function StockTransfersPage() {
  const { data: transfers = [], isLoading: loading } = useQuery({
    queryKey: ['inventory', 'transfers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/inventory/transfers')
      return res.data?.transfers || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'transfer_number', title: 'Transfer #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'from_branch', title: 'From', sortable: true },
    { key: 'to_branch', title: 'To', sortable: true },
    { key: 'item_count', title: 'Items', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (val: any) => {
      const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
        PENDING: 'secondary',
        IN_TRANSIT: 'outline',
        COMPLETED: 'default',
      };
      return <Badge variant={variants[val] || 'secondary'}>{val}</Badge>;
    }},
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: transfers.length,
    pending: transfers.filter((t: any) => t.status === 'PENDING').length,
    inTransit: transfers.filter((t: any) => t.status === 'IN_TRANSIT').length,
    completed: transfers.filter((t: any) => t.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Transfers</h1>
          <p className="text-gray-600">Transfer inventory between branches</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TruckIcon className="w-4 h-4 mr-2" />
              Total Transfers
            </CardTitle>
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
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Transfers"
        columns={columns}
        data={transfers}
        loading={loading}
        onAdd={() => console.log('Add')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
