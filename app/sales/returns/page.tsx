'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, AlertCircle } from 'lucide-react';

export default function SalesReturnsPage() {
  const { data: returns = [], isLoading: loading } = useQuery({
    queryKey: ['sales', 'returns'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/sales/returns')
      return res.data?.returns || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'return_number', title: 'Return #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'invoice_number', title: 'Invoice', sortable: true },
    { key: 'customer_name', title: 'Customer', sortable: true },
    { key: 'return_amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold text-red-600">₹{val?.toLocaleString()}</span> },
    { key: 'reason', title: 'Reason', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (val: any) => <Badge variant={val === 'APPROVED' ? 'default' : 'secondary'}>{val}</Badge> },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: returns.length,
    pending: returns.filter((r: any) => r.status === 'PENDING').length,
    totalAmount: returns.reduce((sum: number, r: any) => sum + (r.return_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Returns & Credit Notes</h1>
        <p className="text-gray-600">Manage product returns and refunds</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <RotateCcw className="w-4 h-4 mr-2" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refund Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Returns"
        columns={columns}
        data={returns}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
