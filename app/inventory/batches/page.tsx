'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertCircle, Calendar } from 'lucide-react';

export default function BatchTrackingPage() {
  const { data: batches = [], isLoading: loading } = useQuery({
    queryKey: ['inventory', 'batches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/inventory/batches')
      return res.data?.batches || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'batch_number', title: 'Batch #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'product_name', title: 'Product', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true, render: (val: any) => <span className="font-semibold">{val} units</span> },
    { key: 'expiry_date', title: 'Expiry', sortable: true, render: (val: any) => {
      const date = new Date(val);
      const daysLeft = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = daysLeft < 90;
      return (
        <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
          {date.toLocaleDateString()} {isExpiringSoon && ''}
        </span>
      );
    }},
    { key: 'mrp', title: 'MRP', sortable: true, render: (val: any) => `${val?.toLocaleString()}` },
    { key: 'status', title: 'Status', sortable: true, render: (val: any) => <Badge variant={val === 'ACTIVE' ? 'default' : 'secondary'}>{val}</Badge> },
  ];

  const stats = {
    total: batches.length,
    active: batches.filter((b: any) => b.status === 'ACTIVE').length,
    expiringSoon: batches.filter((b: any) => {
      const daysLeft = Math.floor((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft < 90 && daysLeft > 0;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Batch Tracking & Management</h1>
        <p className="text-gray-600">Track product batches and expiry dates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Active Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
            <p className="text-xs text-gray-500 mt-1">Within 90 days</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Batches"
        columns={columns}
        data={batches}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
