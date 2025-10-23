'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { nestjsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, AlertCircle } from 'lucide-react';

export default function PurchaseBillsPage() {
  const { data: bills = [], isLoading: loading } = useQuery({
    queryKey: ['purchases', 'bills'],
    queryFn: async () => {
      const res = await nestjsAPI.get('/purchase/bills')
      return res.data?.bills || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'bill_number', title: 'Bill #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'vendor_name', title: 'Vendor', sortable: true },
    { key: 'bill_amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold">{val?.toLocaleString()}</span> },
    { key: 'due_date', title: 'Due Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
    { key: 'payment_status', title: 'Payment', sortable: true, render: (val: any) => <Badge variant={val === 'PAID' ? 'default' : 'destructive'}>{val}</Badge> },
    { key: 'created_at', title: 'Created', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: bills.length,
    paid: bills.filter((b: any) => b.payment_status === 'PAID').length,
    pending: bills.filter((b: any) => b.payment_status === 'PENDING').length,
    totalAmount: bills.reduce((sum: number, b: any) => sum + (b.bill_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchase Bills & Invoices</h1>
        <p className="text-gray-600">Vendor bills and payment management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
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
            <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Bills"
        columns={columns}
        data={bills}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
