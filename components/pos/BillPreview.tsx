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
  Printer,
  Download,
  Eye,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface BillSnapshot {
  id: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  paperSize: string;
  billData: string;
  previewText: string;
  htmlContent: string;
  pdfUrl?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
  printedAt?: string;
  createdAt: string;
}

interface BillPreviewProps {
  billId?: string;
  referenceType?: string;
  referenceId?: string;
  open?: boolean;
  onClose?: () => void;
}

export default function BillPreview({
  billId,
  referenceType,
  referenceId,
  open = false,
  onClose
}: BillPreviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<BillSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'html'>('text');

  useEffect(() => {
    if (open && (billId || (referenceType && referenceId))) {
      loadBillSnapshot();
    }
  }, [open, billId, referenceType, referenceId]);

  const loadBillSnapshot = async () => {
    setLoading(true);
    try {
      let res;
      if (billId) {
        res = await golangAPI.get(`/api/erp/bill-snapshots/${billId}`);
      } else if (referenceType && referenceId) {
        res = await golangAPI.get(`/api/erp/bill-snapshots/by-reference/${referenceType}/${referenceId}`);
      }

      if (res?.data?.success) {
        setBill(res.data.data);
      }
    } catch (error: any) {
      toast({
        title: '❌ Failed to load bill',
        description: error.response?.data?.error || 'Could not fetch bill details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!bill) return;
    
    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(bill.htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownload = () => {
    if (!bill) return;
    
    const blob = new Blob([bill.htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bill-${bill.referenceNumber}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Preview
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <div className="mt-2 text-sm text-gray-500">Loading bill...</div>
              </div>
            </div>
          ) : bill ? (
            <>
              {/* Bill Info */}
              <div className="flex-shrink-0 border-b pb-3 mb-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{bill.referenceNumber}</div>
                    <div className="text-sm text-gray-500">
                      {bill.customerName} {bill.customerPhone && `• ${bill.customerPhone}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">₹{bill.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{bill.paperSize} paper</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant={bill.status === 'completed' ? 'default' : 'secondary'}>
                    {bill.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {bill.status}
                  </Badge>
                  <Badge variant={bill.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                    {bill.paymentStatus}
                  </Badge>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'text' ? 'default' : 'outline'}
                    onClick={() => setViewMode('text')}
                  >
                    Text View
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'html' ? 'default' : 'outline'}
                    onClick={() => setViewMode('html')}
                  >
                    Formatted View
                  </Button>
                </div>
              </div>

              {/* Bill Preview Content */}
              <ScrollArea className="flex-1">
                {viewMode === 'text' ? (
                  <pre className="text-xs font-mono bg-gray-50 p-4 rounded whitespace-pre-wrap">
                    {bill.previewText}
                  </pre>
                ) : (
                  <div
                    className="bg-white p-4 rounded border"
                    dangerouslySetInnerHTML={{ __html: bill.htmlContent }}
                  />
                )}
              </ScrollArea>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-2 mt-4">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <div className="text-sm text-gray-500">Bill not found</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
