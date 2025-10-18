'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { nestjsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Package } from 'lucide-react';

export default function PurchaseReturnsPage() {
  const { data: returns = [], isLoading: loading } = useQuery({
    queryKey: ['purchases', 'returns'],
    queryFn: async () => {
      const res = await nestjsAPI.get('/purchase/returns')
      return res.data?.returns || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'return_number', title: 'Return #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'grn_number', title: 'GRN', sortable: true },
    { key: 'vendor_name', title: 'Vendor', sortable: true },
    { key: 'return_amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold text-red-600">₹{val?.toLocaleString()}</span> },
    { key: 'reason', title: 'Reason', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (val: any) => <Badge>{val}</Badge> },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: returns.length,
    totalAmount: returns.reduce((sum: number, r: any) => sum + (r.return_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchase Returns</h1>
        <p className="text-gray-600">Return defective or excess inventory to vendors</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              <Package className="w-4 h-4 mr-2" />
              Total Return Value
            </CardTitle>
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
