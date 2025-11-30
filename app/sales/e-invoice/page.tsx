'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, Clock,
  AlertCircle, Package, User, Calendar, DollarSign, FileText, Home,
  ShoppingCart, Printer, X, IndianRupee, Truck, MapPin, Phone, Receipt,
  FileCheck, CreditCard, Banknote, Upload, RefreshCw, Zap, Shield, File
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EInvoiceItem {
  product_id: string;
  product_name: string;
  sku: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}

interface EInvoice {
  id: string;
  invoice_no: string;
  e_invoice_no?: string;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_gstin?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  status: 'PENDING' | 'GENERATED' | 'SUBMITTED' | 'CANCELLED' | 'FAILED';
  total_amount: number;
  taxable_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  items: EInvoiceItem[];
  payment_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function EInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [eInvoices, setEInvoices] = useState<EInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEInvoices, setTotalEInvoices] = useState(0);

  // Dialog states
  const [selectedEInvoice, setSelectedEInvoice] = useState<EInvoice | null>(null);
  const [showEInvoiceDetails, setShowEInvoiceDetails] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    generated: 0,
    submitted: 0,
    cancelled: 0,
    failed: 0,
    totalEInvoices: 0,
    totalAmount: 0,
    totalTax: 0,
  });

  // Fetch e-invoices
  const fetchEInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await golangAPI.get('/api/erp/sales/e-invoices', { params });
      const data = res.data?.data || {};
      
      setEInvoices(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalEInvoices(data.total || 0);
      
      // Calculate stats
      const eInvoicesData = data.items || [];
      setStats({
        pending: eInvoicesData.filter((e: EInvoice) => e.status === 'PENDING').length,
        generated: eInvoicesData.filter((e: EInvoice) => e.status === 'GENERATED').length,
        submitted: eInvoicesData.filter((e: EInvoice) => e.status === 'SUBMITTED').length,
        cancelled: eInvoicesData.filter((e: EInvoice) => e.status === 'CANCELLED').length,
        failed: eInvoicesData.filter((e: EInvoice) => e.status === 'FAILED').length,
        totalEInvoices: eInvoicesData.length,
        totalAmount: eInvoicesData.reduce((sum: number, e: EInvoice) => sum + e.total_amount, 0),
        totalTax: eInvoicesData.reduce((sum: number, e: EInvoice) => sum + e.tax_amount, 0),
      });
    } catch (error) {
      console.error('Failed to fetch e-invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load e-invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEInvoices();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchEInvoices();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Generate e-invoice
  const generateEInvoice = async () => {
    if (!selectedEInvoice) return;

    try {
      const res = await golangAPI.post(`/api/erp/sales/e-invoices/${selectedEInvoice.id}/generate`);

      if (res.data?.success) {
        toast({
          title: 'E-Invoice Generated',
          description: `E-invoice generated successfully. IRN: ${res.data?.data?.irn}`,
        });
        
        fetchEInvoices();
        setShowGenerateDialog(false);
        setSelectedEInvoice(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate e-invoice',
        variant: 'destructive',
      });
    }
  };

  // Submit e-invoice to GST portal
  const submitEInvoice = async (eInvoiceId: string) => {
    try {
      const res = await golangAPI.post(`/api/erp/sales/e-invoices/${eInvoiceId}/submit`);

      if (res.data?.success) {
        toast({
          title: 'E-Invoice Submitted',
          description: 'E-invoice submitted to GST portal successfully',
        });
        
        fetchEInvoices();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit e-invoice',
        variant: 'destructive',
      });
    }
  };

  // Cancel e-invoice
  const cancelEInvoice = async (reason: string) => {
    if (!selectedEInvoice) return;

    try {
      const res = await golangAPI.post(`/api/erp/sales/e-invoices/${selectedEInvoice.id}/cancel`, {
        reason,
      });

      if (res.data?.success) {
        toast({
          title: 'E-Invoice Cancelled',
          description: 'E-invoice cancelled successfully',
        });
        
        fetchEInvoices();
        setShowCancelDialog(false);
        setSelectedEInvoice(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel e-invoice',
        variant: 'destructive',
      });
    }
  };

  // Download e-invoice JSON
  const downloadEInvoiceJSON = async (eInvoiceId: string) => {
    try {
      const res = await golangAPI.get(`/api/erp/sales/e-invoices/${eInvoiceId}/download-json`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `e-invoice-${eInvoiceId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: 'E-invoice JSON downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download e-invoice JSON',
        variant: 'destructive',
      });
    }
  };

  // Download e-invoice PDF
  const downloadEInvoicePDF = async (eInvoiceId: string) => {
    try {
      const res = await golangAPI.get(`/api/erp/sales/e-invoices/${eInvoiceId}/download-pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `e-invoice-${eInvoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: 'E-invoice PDF downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download e-invoice PDF',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      GENERATED: { color: 'bg-blue-100 text-blue-800', icon: Zap },
      SUBMITTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: X },
      FAILED: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">E-Invoice Generation</h1>
              <p className="text-sm text-blue-100">Generate and manage GST e-invoices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/invoices')}>
              <Receipt className="w-4 h-4 mr-1" />
              Regular Invoices
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{stats.generated}</div>
                <div className="text-xs text-gray-600">Generated</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.submitted}</div>
                <div className="text-xs text-gray-600">Submitted</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.cancelled}</div>
                <div className="text-xs text-gray-600">Cancelled</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{totalEInvoices}</div>
                <div className="text-xs text-gray-600">Total E-Invoices</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Amount</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalTax / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Tax</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by invoice number, customer name, IRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => fetchEInvoices()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* E-Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : eInvoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Shield className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No E-Invoices Found</h3>
                <p className="text-sm mb-4">Generate e-invoices from regular invoices to get started</p>
                <Button onClick={() => router.push('/sales/invoices')}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Go to Invoices
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Invoice #</th>
                      <th className="text-left p-3 font-medium text-sm">E-Invoice #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Invoice Date</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-right p-3 font-medium text-sm">Total Amount</th>
                      <th className="text-right p-3 font-medium text-sm">Tax Amount</th>
                      <th className="text-left p-3 font-medium text-sm">IRN</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eInvoices.map((eInvoice) => (
                      <tr key={eInvoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{eInvoice.invoice_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(eInvoice.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {eInvoice.e_invoice_no ? (
                            <div className="font-mono text-sm">{eInvoice.e_invoice_no}</div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not generated</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{eInvoice.customer_name}</div>
                          {eInvoice.customer_gstin && (
                            <div className="text-xs text-gray-500">GSTIN: {eInvoice.customer_gstin}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(eInvoice.invoice_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(eInvoice.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm">₹{eInvoice.total_amount.toFixed(2)}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm text-purple-600">₹{eInvoice.tax_amount.toFixed(2)}</div>
                        </td>
                        <td className="p-3">
                          {eInvoice.irn ? (
                            <div className="font-mono text-xs text-blue-600">{eInvoice.irn.substring(0, 20)}...</div>
                          ) : (
                            <span className="text-gray-400 text-sm">No IRN</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEInvoice(eInvoice);
                                setShowEInvoiceDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {eInvoice.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEInvoice(eInvoice);
                                  setShowGenerateDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-blue-600"
                              >
                                <Zap className="w-4 h-4" />
                              </Button>
                            )}
                            {eInvoice.status === 'GENERATED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => submitEInvoice(eInvoice.id)}
                                className="h-8 w-8 p-0 text-green-600"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            )}
                            {eInvoice.irn && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadEInvoiceJSON(eInvoice.id)}
                                  className="h-8 w-8 p-0 text-orange-600"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadEInvoicePDF(eInvoice.id)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <File className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(eInvoice.status === 'GENERATED' || eInvoice.status === 'SUBMITTED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEInvoice(eInvoice);
                                  setShowCancelDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* E-Invoice Details Dialog */}
      <Dialog open={showEInvoiceDetails} onOpenChange={setShowEInvoiceDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              E-Invoice Details - {selectedEInvoice?.invoice_no}
            </DialogTitle>
          </DialogHeader>
          {selectedEInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedEInvoice.invoice_no}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">E-Invoice Number</Label>
                  <div className="text-sm mt-1 font-mono">
                    {selectedEInvoice.e_invoice_no || 'Not generated'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedEInvoice.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">GSTIN</Label>
                  <div className="text-sm mt-1 font-mono">
                    {selectedEInvoice.customer_gstin || 'Not provided'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedEInvoice.invoice_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedEInvoice.due_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {selectedEInvoice.customer_address && (
                <div>
                  <Label className="text-sm font-medium">Customer Address</Label>
                  <div className="text-sm mt-1">{selectedEInvoice.customer_address}</div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getStatusBadge(selectedEInvoice.status)}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    Total: ₹{selectedEInvoice.total_amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-600">
                    Tax: ₹{selectedEInvoice.tax_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedEInvoice.irn && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">IRN (Invoice Reference Number)</Label>
                    <div className="text-sm mt-1 font-mono text-blue-600 break-all">{selectedEInvoice.irn}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Acknowledgement Number</Label>
                    <div className="text-sm mt-1 font-mono">{selectedEInvoice.ack_no || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">E-Invoice Items</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Product</th>
                        <th className="text-left p-2 text-xs font-medium">SKU</th>
                        <th className="text-left p-2 text-xs font-medium">HSN</th>
                        <th className="text-center p-2 text-xs font-medium">Qty</th>
                        <th className="text-right p-2 text-xs font-medium">Price</th>
                        <th className="text-right p-2 text-xs font-medium">Tax</th>
                        <th className="text-right p-2 text-xs font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEInvoice.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-sm">{item.product_name}</td>
                          <td className="p-2 text-sm font-mono">{item.sku}</td>
                          <td className="p-2 text-sm font-mono">{item.hsn_code}</td>
                          <td className="p-2 text-sm text-center">{item.quantity}</td>
                          <td className="p-2 text-sm text-right">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-2 text-sm text-right">₹{item.tax_amount.toFixed(2)}</td>
                          <td className="p-2 text-sm text-right">₹{item.total_amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">CGST Amount</Label>
                  <div className="text-sm mt-1 font-semibold">₹{selectedEInvoice.cgst_amount.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">SGST Amount</Label>
                  <div className="text-sm mt-1 font-semibold">₹{selectedEInvoice.sgst_amount.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IGST Amount</Label>
                  <div className="text-sm mt-1 font-semibold">₹{selectedEInvoice.igst_amount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEInvoiceDetails(false)}>
              Close
            </Button>
            {selectedEInvoice?.status === 'PENDING' && (
              <Button
                onClick={() => {
                  setShowEInvoiceDetails(false);
                  setShowGenerateDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate E-Invoice
              </Button>
            )}
            {selectedEInvoice?.irn && (
              <>
                <Button
                  onClick={() => downloadEInvoiceJSON(selectedEInvoice.id)}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button
                  onClick={() => downloadEInvoicePDF(selectedEInvoice.id)}
                  variant="outline"
                >
                  <File className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate E-Invoice Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate E-Invoice</DialogTitle>
          </DialogHeader>
          {selectedEInvoice && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Invoice Number</Label>
                <div className="text-sm mt-1 font-mono">{selectedEInvoice.invoice_no}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <div className="text-sm mt-1">{selectedEInvoice.customer_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Amount</Label>
                <div className="text-lg font-bold text-blue-600">₹{selectedEInvoice.total_amount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Tax Amount</Label>
                <div className="text-sm text-purple-600">₹{selectedEInvoice.tax_amount.toFixed(2)}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will generate an e-invoice with IRN (Invoice Reference Number) and submit it to the GST portal. Make sure all customer details and GST information are correct.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateEInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate E-Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel E-Invoice Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel E-Invoice</DialogTitle>
          </DialogHeader>
          {selectedEInvoice && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">E-Invoice Number</Label>
                <div className="text-sm mt-1 font-mono">{selectedEInvoice.e_invoice_no}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">IRN</Label>
                <div className="text-sm mt-1 font-mono text-blue-600">{selectedEInvoice.irn}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <div className="text-sm mt-1">{selectedEInvoice.customer_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Cancellation Reason</Label>
                <Select onValueChange={(value) => {}}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="data_entry">Data Entry Error</SelectItem>
                    <SelectItem value="order_cancelled">Order Cancelled</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Cancelling an e-invoice is a permanent action and cannot be reversed. This will also cancel the IRN.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => cancelEInvoice('data_entry')}
              variant="destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel E-Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
