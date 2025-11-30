'use client';

import { useState } from 'react';
import { Ticket, Plus, Search, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FinanceVouchersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const vouchers = [
    {
      id: 1,
      voucherNo: 'PAY/2024/001',
      type: 'Payment',
      party: 'SBL Pharmaceuticals',
      amount: 45000,
      date: '2024-11-30',
      status: 'Approved'
    },
    {
      id: 2,
      voucherNo: 'REC/2024/002',
      type: 'Receipt',
      party: 'Rajesh Kumar',
      amount: 12500,
      date: '2024-11-30',
      status: 'Pending'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg">
            <Ticket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment/Receipt Vouchers</h1>
            <p className="text-gray-500">Manage payment and receipt vouchers</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Voucher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Vouchers</CardTitle>
          <CardDescription>Payment and receipt voucher records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${voucher.type === 'Payment' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Receipt className={`h-5 w-5 ${voucher.type === 'Payment' ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{voucher.voucherNo}</h3>
                    <p className="text-sm text-gray-500">{voucher.party}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-medium">₹{voucher.amount.toLocaleString('en-IN')}</div>
                    <div className="text-sm text-gray-500">{voucher.date}</div>
                  </div>
                  <Badge variant={voucher.status === 'Approved' ? 'default' : 'secondary'}>
                    {voucher.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
