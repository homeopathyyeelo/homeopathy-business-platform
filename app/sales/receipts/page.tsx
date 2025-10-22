'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, CreditCard, DollarSign } from 'lucide-react';

export default function ReceiptsPage() {
  const { data: receipts = [], isLoading: loading } = useQuery({
    queryKey: ['sales', 'receipts'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/sales/receipts')
      return res.data?.receipts || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'receipt_number', title: 'Receipt #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'customer_name', title: 'Customer', sortable: true },
    { key: 'amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold text-green-600">{val?.toLocaleString()}</span> },
    { key: 'payment_method', title: 'Method', sortable: true, render: (val: any) => <Badge variant="outline">{val}</Badge> },
    { key: 'reference_number', title: 'Reference', sortable: true },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: receipts.length,
    totalAmount: receipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
    cash: receipts.filter((r: any) => r.payment_method === 'CASH').length,
    card: receipts.filter((r: any) => r.payment_method === 'CARD').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Receipts</h1>
        <p className="text-gray-600">Customer payment tracking and receipts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Receipt className="w-4 h-4 mr-2" />
              Total Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cash}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Card Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.card}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Receipts"
        columns={columns}
        data={receipts}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
