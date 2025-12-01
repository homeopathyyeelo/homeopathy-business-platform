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
import {
  Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, Clock,
  AlertCircle, Package, User, Calendar, DollarSign, FileText, Home,
  ShoppingCart, Printer, X, IndianRupee, Truck, MapPin, Phone, Receipt,
  FileCheck, CreditCard, Banknote
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import A4InvoicePrint from '@/components/sales/A4InvoicePrint';

interface Invoice {
  id: string;
  invoice_no: string;
  invoice_type: 'POS' | 'B2B' | 'SALES_ORDER';
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  customer_gstin?: string;
  invoice_date: string;
  due_date?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  payment_status: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
  payment_method: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  items_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // Dialog states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showA4Print, setShowA4Print] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    paid: 0,
    pending: 0,
    overdue: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgInvoiceValue: 0,
    totalTax: 0,
    totalDiscount: 0,
  });

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.invoice_type = typeFilter;
      if (paymentFilter !== 'all') params.payment_status = paymentFilter;

      const res = await golangAPI.get('/api/erp/sales/invoices', { params });
      const data = res.data?.data || {};
      
      setInvoices(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalInvoices(data.total || 0);
      
      // Calculate stats
      const invoicesData = data.items || [];
      setStats({
        paid: invoicesData.filter((i: Invoice) => i.status === 'PAID').length,
        pending: invoicesData.filter((i: Invoice) => i.status === 'PENDING').length,
        overdue: invoicesData.filter((i: Invoice) => i.status === 'OVERDUE').length,
        cancelled: invoicesData.filter((i: Invoice) => i.status === 'CANCELLED').length,
        totalRevenue: invoicesData.reduce((sum: number, i: Invoice) => sum + i.total_amount, 0),
        avgInvoiceValue: invoicesData.length > 0 ? invoicesData.reduce((sum: number, i: Invoice) => sum + i.total_amount, 0) / invoicesData.length : 0,
        totalTax: invoicesData.reduce((sum: number, i: Invoice) => sum + i.tax, 0),
        totalDiscount: invoicesData.reduce((sum: number, i: Invoice) => sum + i.discount, 0),
      });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter, typeFilter, paymentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchInvoices();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Print invoice - Show A4 print preview
  const printInvoice = async (invoice: Invoice) => {
    try {
      // Fetch detailed invoice data with items
      const res = await golangAPI.get(`/api/erp/sales/invoices/${invoice.id}`);
      
      if (res.data?.success) {
        setSelectedInvoice({
          ...invoice,
          ...res.data.data
        });
        setShowA4Print(true);
      } else {
        // Fallback to basic invoice data
        setSelectedInvoice(invoice);
        setShowA4Print(true);
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
      // Fallback to basic invoice data
      setSelectedInvoice(invoice);
      setShowA4Print(true);
    }
  };

  // Download invoice PDF
  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const res = await golangAPI.get(`/api/erp/invoices/${invoice.invoice_no}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoice_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: '✅ PDF Downloaded',
        description: `Invoice ${invoice.invoice_no} downloaded successfully`,
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download invoice PDF',
        variant: 'destructive',
      });
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    try {
      const res = await golangAPI.post(`/api/erp/sales/invoices/${selectedInvoice.id}/payment`, {
        amount: parseFloat(paymentAmount),
        payment_method: selectedInvoice.payment_method,
      });

      if (res.data?.success) {
        toast({
          title: 'Payment Processed',
          description: `Payment of ₹${paymentAmount} recorded for invoice ${selectedInvoice.invoice_no}`,
        });
        
        fetchInvoices();
        setShowPaymentDialog(false);
        setSelectedInvoice(null);
        setPaymentAmount('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  // Cancel invoice
  const cancelInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    try {
      const res = await golangAPI.put(`/api/erp/sales/invoices/${invoiceId}/cancel`);
      
      if (res.data?.success) {
        toast({
          title: 'Invoice Cancelled',
          description: 'Invoice cancelled successfully',
        });
        
        fetchInvoices();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invoice',
        variant: 'destructive',
      });
    }
  };

  // Delete invoice
  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/invoices/${invoiceId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Invoice Deleted',
          description: 'Invoice deleted successfully',
        });
        
        fetchInvoices();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      OVERDUE: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: X },
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

  // Invoice type badge
  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; text: string }> = {
      POS: { color: 'bg-blue-100 text-blue-800', text: 'POS' },
      B2B: { color: 'bg-purple-100 text-purple-800', text: 'B2B' },
      SALES_ORDER: { color: 'bg-indigo-100 text-indigo-800', text: 'Sales Order' },
    };

    const typeConfig = config[type] || config.POS;

    return <Badge className={typeConfig.color}>{typeConfig.text}</Badge>;
  };

  // Payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'card':
      case 'upi':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Invoices</h1>
              <p className="text-sm text-green-100">Manage and track all invoices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/pos')}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              POS Billing
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/b2b')}>
              <FileText className="w-4 h-4 mr-1" />
              B2B Billing
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/orders')}>
              <FileCheck className="w-4 h-4 mr-1" />
              Orders
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
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.paid}</div>
                <div className="text-xs text-gray-600">Paid</div>
              </div>
            </div>
          </Card>
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
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.overdue}</div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-gray-600" />
              <div>
                <div className="text-xl font-bold">{stats.cancelled}</div>
                <div className="text-xs text-gray-600">Cancelled</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalRevenue / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Revenue</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{totalInvoices}</div>
                <div className="text-xs text-gray-600">Total Invoices</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalTax / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Tax</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalDiscount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Discount</div>
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
                    placeholder="Search by invoice number, customer name, phone..."
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
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Invoice type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="SALES_ORDER">Sales Order</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => router.push('/sales/pos')} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Receipt className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Invoices Found</h3>
                <p className="text-sm mb-4">Create your first invoice to get started</p>
                <Button onClick={() => router.push('/sales/pos')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Invoice #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Contact</th>
                      <th className="text-left p-3 font-medium text-sm">Invoice Date</th>
                      <th className="text-left p-3 font-medium text-sm">Due Date</th>
                      <th className="text-left p-3 font-medium text-sm">Type</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      <th className="text-right p-3 font-medium text-sm">Balance</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{invoice.invoice_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{invoice.customer_name}</div>
                          {invoice.customer_gstin && (
                            <div className="text-xs text-gray-500">GSTIN: {invoice.customer_gstin}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {invoice.customer_phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {invoice.due_date ? (
                            <div className="text-sm">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getTypeBadge(invoice.invoice_type)}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm">₹{invoice.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            {getPaymentMethodIcon(invoice.payment_method)}
                            {invoice.payment_method}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className={`font-semibold text-sm ${
                            invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₹{invoice.balance_due.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.amount_paid > 0 && `Paid: ₹${invoice.amount_paid.toFixed(2)}`}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printInvoice(invoice)}
                              className="h-8 w-8 p-0 text-blue-600"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoice(invoice)}
                              className="h-8 w-8 p-0 text-green-600"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {invoice.balance_due > 0 && invoice.status !== 'CANCELLED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentAmount(invoice.balance_due.toString());
                                  setShowPaymentDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-purple-600"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            )}
                            {invoice.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelInvoice(invoice.id)}
                                className="h-8 w-8 p-0 text-orange-600"
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

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Invoice Details - {selectedInvoice?.invoice_no}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedInvoice.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm mt-1">{selectedInvoice.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <div className="text-sm mt-1">
                    {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
              
              {selectedInvoice.customer_gstin && (
                <div>
                  <Label className="text-sm font-medium">GSTIN</Label>
                  <div className="text-sm mt-1">{selectedInvoice.customer_gstin}</div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getTypeBadge(selectedInvoice.invoice_type)}
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  ₹{selectedInvoice.total_amount.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Subtotal</Label>
                  <div className="font-semibold">₹{selectedInvoice.subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Discount</Label>
                  <div className="font-semibold text-red-600">-₹{selectedInvoice.discount.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Tax</Label>
                  <div className="font-semibold text-blue-600">₹{selectedInvoice.tax.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Balance Due</Label>
                  <div className={`font-semibold ${selectedInvoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{selectedInvoice.balance_due.toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedInvoice.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDetails(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedInvoice) printInvoice(selectedInvoice);
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Invoice Number</Label>
              <div className="text-sm mt-1 font-medium">{selectedInvoice?.invoice_no}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Balance Due</Label>
              <div className="text-lg font-bold text-red-600">₹{selectedInvoice?.balance_due.toFixed(2)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Payment Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1"
                placeholder="Enter payment amount"
                max={selectedInvoice?.balance_due || 0}
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processPayment} 
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A4 Invoice Print Dialog */}
      {showA4Print && selectedInvoice && (
        <A4InvoicePrint
          invoice={{
            invoiceNumber: selectedInvoice.invoice_no || selectedInvoice.invoiceNo,
            date: selectedInvoice.invoice_date || selectedInvoice.date,
            dueDate: selectedInvoice.due_date || selectedInvoice.dueDate,
            customer: selectedInvoice.customer || {
              name: selectedInvoice.customer_name,
              address: selectedInvoice.customer_address,
              phone: selectedInvoice.customer_phone,
              gstNumber: selectedInvoice.customer_gstin,
            },
            items: selectedInvoice.items || [],
            subtotal: selectedInvoice.subtotal,
            discountAmount: selectedInvoice.discount || selectedInvoice.discountAmount,
            gstAmount: selectedInvoice.tax || selectedInvoice.gstAmount,
            total: selectedInvoice.total_amount || selectedInvoice.total,
            paymentStatus: selectedInvoice.payment_status || selectedInvoice.paymentStatus,
            paymentMethod: selectedInvoice.payment_method || selectedInvoice.paymentMethod,
            placeOfSupply: selectedInvoice.placeOfSupply,
            salesExecutive: selectedInvoice.salesExecutive,
            notes: selectedInvoice.notes,
          } as any}
          onClose={() => setShowA4Print(false)}
        />
      )}
    </div>
  );
}
