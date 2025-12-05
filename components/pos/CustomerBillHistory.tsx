"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Receipt,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  IndianRupee
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface BillHistoryItem {
  id: string;
  referenceType: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  paperSize: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  printedAt?: string;
  isEndingBill: boolean;
}

interface LastBill {
  customerId: string;
  lastBillId: string;
  lastBillNumber: string;
  referenceType: string;
  lastTotal: number;
  lastPaid: number;
  lastBalance: number;
  lastStatus: string;
  lastPaymentStatus: string;
  lastBillDate: string;
}

interface CustomerBillHistoryProps {
  customerId: string;
  customerName?: string;
  onBillSelect?: (billId: string) => void;
}

export default function CustomerBillHistory({
  customerId,
  customerName,
  onBillSelect
}: CustomerBillHistoryProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastBill, setLastBill] = useState<LastBill | null>(null);
  const [billHistory, setBillHistory] = useState<BillHistoryItem[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    if (customerId && customerId !== '') {
      loadCustomerBillData();
    }
  }, [customerId]);

  const loadCustomerBillData = async () => {
    setLoading(true);
    try {
      const res = await golangAPI.get(`/api/erp/customers/${customerId}/return-visit`);
      if (res.data?.success) {
        setLastBill(res.data.data.lastBill);
        setBillHistory(res.data.data.history || []);
      }
    } catch (error: any) {
      console.error('Failed to load bill history:', error);
      toast({
        title: 'Failed to load history',
        description: error.response?.data?.error || 'Could not fetch customer bill history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const viewBillDetails = (billId: string) => {
    setSelectedBillId(billId);
    if (onBillSelect) {
      onBillSelect(billId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock },
      completed: { color: 'bg-green-500', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-500', icon: AlertCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { color: 'bg-red-500 text-white' },
      partial: { color: 'bg-orange-500 text-white' },
      paid: { color: 'bg-green-500 text-white' },
    };
    const color = statusConfig[paymentStatus as keyof typeof statusConfig]?.color || 'bg-gray-500 text-white';
    return <Badge className={color}>{paymentStatus.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-sm text-gray-500">Loading customer history...</div>
        </CardContent>
      </Card>
    );
  }

  if (!customerId || customerId === '') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <div className="text-sm text-gray-500">Select a customer to view bill history</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Ending Bill */}
      {lastBill && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <span className="text-blue-900">Last Ending Bill</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-600">Bill Number</div>
                <div className="font-semibold text-blue-900">{lastBill.lastBillNumber}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Date</div>
                <div className="font-medium">{formatDate(lastBill.lastBillDate)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Total Amount</div>
                <div className="font-bold text-lg text-blue-900 flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {formatCurrency(lastBill.lastTotal)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Balance</div>
                <div className={`font-semibold ${lastBill.lastBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(lastBill.lastBalance)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(lastBill.lastStatus)}
              {getPaymentStatusBadge(lastBill.lastPaymentStatus)}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => viewBillDetails(lastBill.lastBillId)}
            >
              <Eye className="h-3 w-3 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bill History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Recent Bills ({billHistory.length})
            </span>
            <Button size="sm" variant="ghost" onClick={loadCustomerBillData}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <div className="text-sm">No previous bills found</div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {billHistory.map((bill) => (
                  <div
                    key={bill.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedBillId === bill.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    } ${bill.isEndingBill ? 'border-l-4 border-l-green-500' : ''}`}
                    onClick={() => viewBillDetails(bill.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-sm">{bill.referenceNumber}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(bill.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(bill.totalAmount)}</div>
                        {bill.balanceAmount > 0 && (
                          <div className="text-xs text-red-600">
                            Bal: {formatCurrency(bill.balanceAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center justify-between">
                      <div className="flex gap-1">
                        {getStatusBadge(bill.status)}
                        {getPaymentStatusBadge(bill.paymentStatus)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bill.paperSize} paper
                      </div>
                    </div>
                    {bill.printedAt && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Printer className="h-3 w-3" />
                        Printed: {formatDate(bill.printedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
