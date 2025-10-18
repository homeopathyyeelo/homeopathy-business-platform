'use client';

import DataTable from '@/components/common/DataTable';
import { useQuery } from '@tanstack/react-query';
import { nestjsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

export default function VendorPaymentsPage() {
  const { data: payments = [], isLoading: loading } = useQuery({
    queryKey: ['purchases', 'payments'],
    queryFn: async () => {
      const res = await nestjsAPI.get('/purchase/payments')
      return res.data?.payments || res.data || []
    },
    staleTime: 30000,
  });

  const columns = [
    { key: 'payment_number', title: 'Payment #', sortable: true, render: (val: any) => <span className="font-mono">{val}</span> },
    { key: 'vendor_name', title: 'Vendor', sortable: true },
    { key: 'amount', title: 'Amount', sortable: true, render: (val: any) => <span className="font-semibold text-green-600">₹{val?.toLocaleString()}</span> },
    { key: 'payment_method', title: 'Method', sortable: true, render: (val: any) => <Badge variant="outline">{val}</Badge> },
    { key: 'reference_number', title: 'Reference', sortable: true },
    { key: 'created_at', title: 'Date', sortable: true, render: (val: any) => new Date(val).toLocaleDateString() },
  ];

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Payments</h1>
        <p className="text-gray-600">Payment tracking and vendor dues management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Total Payments
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
              Total Amount Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="All Payments"
        columns={columns}
        data={payments}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
