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
  FileCheck, CreditCard, Banknote, RefreshCw, TrendingUp, TrendingDown,
  Wallet, ArrowUpRight, ArrowDownRight, Building, UserCheck, Smartphone, Laptop
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  payment_no: string;
  invoice_id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  payment_date: string;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'NET_BANKING';
  payment_type: 'PAYMENT' | 'REFUND';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';
  transaction_id?: string;
  bank_reference?: string;
  cheque_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // New payment form
  const [newPayment, setNewPayment] = useState({
    invoice_no: '',
    customer_name: '',
    customer_phone: '',
    payment_method: 'CASH',
    payment_type: 'PAYMENT',
    amount: '',
    transaction_id: '',
    bank_reference: '',
    cheque_number: '',
    notes: '',
  });

  // Refund form
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalRefunds: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalAmount: 0,
    totalRefundAmount: 0,
    netAmount: 0,
  });

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (methodFilter !== 'all') params.payment_method = methodFilter;
      if (typeFilter !== 'all') params.payment_type = typeFilter;

      const res = await golangAPI.get('/api/erp/sales/payments', { params });
      const data = res.data?.data || {};
      
      setPayments(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalPayments(data.total || 0);
      
      // Calculate stats
      const paymentsData = data.items || [];
      setStats({
        totalPayments: paymentsData.filter((p: Payment) => p.payment_type === 'PAYMENT').length,
        totalRefunds: paymentsData.filter((p: Payment) => p.payment_type === 'REFUND').length,
        completed: paymentsData.filter((p: Payment) => p.status === 'COMPLETED').length,
        pending: paymentsData.filter((p: Payment) => p.status === 'PENDING').length,
        failed: paymentsData.filter((p: Payment) => p.status === 'FAILED').length,
        refunded: paymentsData.filter((p: Payment) => p.status === 'REFUNDED').length,
        totalAmount: paymentsData.filter((p: Payment) => p.payment_type === 'PAYMENT').reduce((sum: number, p: Payment) => sum + p.amount, 0),
        totalRefundAmount: paymentsData.filter((p: Payment) => p.payment_type === 'REFUND').reduce((sum: number, p: Payment) => sum + p.amount, 0),
        netAmount: paymentsData.reduce((sum: number, p: Payment) => 
          sum + (p.payment_type === 'PAYMENT' ? p.amount : -p.amount), 0),
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter, methodFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchPayments();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create new payment
  const createPayment = async () => {
    try {
      const paymentData = {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
      };

      const res = await golangAPI.post('/api/erp/sales/payments', paymentData);

      if (res.data?.success) {
        toast({
          title: 'Payment Created',
          description: `Payment ${res.data?.data?.payment_no} created successfully`,
        });
        
        fetchPayments();
        setShowNewPayment(false);
        setNewPayment({
          invoice_no: '',
          customer_name: '',
          customer_phone: '',
          payment_method: 'CASH',
          payment_type: 'PAYMENT',
          amount: '',
          transaction_id: '',
          bank_reference: '',
          cheque_number: '',
          notes: '',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment',
        variant: 'destructive',
      });
    }
  };

  // Process refund
  const processRefund = async () => {
    if (!selectedPayment) return;

    try {
      const refundData = {
        amount: parseFloat(refundAmount),
        reason: refundReason,
        payment_method: selectedPayment.payment_method,
      };

      const res = await golangAPI.post(`/api/erp/sales/payments/${selectedPayment.id}/refund`, refundData);

      if (res.data?.success) {
        toast({
          title: 'Refund Processed',
          description: `Refund of ₹${refundAmount} processed successfully`,
        });
        
        fetchPayments();
        setShowRefundDialog(false);
        setSelectedPayment(null);
        setRefundAmount('');
        setRefundReason('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process refund',
        variant: 'destructive',
      });
    }
  };

  // Update payment status
  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const res = await golangAPI.put(`/api/erp/sales/payments/${paymentId}/status`, { status });
      
      if (res.data?.success) {
        toast({
          title: 'Status Updated',
          description: `Payment status updated to ${status}`,
        });
        
        fetchPayments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  // Delete payment
  const deletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/payments/${paymentId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Payment Deleted',
          description: 'Payment deleted successfully',
        });
        
        fetchPayments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      REFUNDED: { color: 'bg-orange-100 text-orange-800', icon: ArrowDownRight },
      PARTIAL_REFUND: { color: 'bg-purple-100 text-purple-800', icon: ArrowDownRight },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Payment method badge component
  const getPaymentMethodBadge = (method: string) => {
    const methodConfig: Record<string, { color: string; icon: any }> = {
      CASH: { color: 'bg-green-100 text-green-800', icon: DollarSign },
      CARD: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      UPI: { color: 'bg-purple-100 text-purple-800', icon: Smartphone },
      BANK_TRANSFER: { color: 'bg-orange-100 text-orange-800', icon: Building },
      CHEQUE: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      NET_BANKING: { color: 'bg-cyan-100 text-cyan-800', icon: Laptop },
    };

    const config = methodConfig[method] || methodConfig.CASH;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {method.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-sm text-green-100">Track and manage all payment transactions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/invoices')}>
              <Receipt className="w-4 h-4 mr-1" />
              Invoices
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
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.totalPayments}</div>
                <div className="text-xs text-gray-600">Total Payments</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.totalRefunds}</div>
                <div className="text-xs text-gray-600">Total Refunds</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
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
                <div className="text-xl font-bold">{stats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xl font-bold">{stats.refunded}</div>
                <div className="text-xs text-gray-600">Refunded</div>
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
              <Wallet className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.netAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Net Amount</div>
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
                    placeholder="Search by payment number, invoice, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setShowNewPayment(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Wallet className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Payments Found</h3>
                <p className="text-sm mb-4">Create your first payment to get started</p>
                <Button onClick={() => setShowNewPayment(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Payment
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Payment #</th>
                      <th className="text-left p-3 font-medium text-sm">Invoice #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Payment Date</th>
                      <th className="text-left p-3 font-medium text-sm">Method</th>
                      <th className="text-left p-3 font-medium text-sm">Type</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{payment.payment_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm">{payment.invoice_no}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{payment.customer_name}</div>
                          {payment.customer_phone && (
                            <div className="text-xs text-gray-500">
                              <Phone className="w-3 h-3 inline mr-1" />
                              {payment.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {getPaymentMethodBadge(payment.payment_method)}
                        </td>
                        <td className="p-3">
                          <Badge variant={payment.payment_type === 'PAYMENT' ? 'default' : 'secondary'}>
                            {payment.payment_type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className={`font-semibold text-sm ${payment.payment_type === 'REFUND' ? 'text-red-600' : 'text-green-600'}`}>
                            {payment.payment_type === 'REFUND' ? '-' : '+'}₹{payment.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowPaymentDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updatePaymentStatus(payment.id, 'COMPLETED')}
                                className="h-8 w-8 p-0 text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {payment.payment_type === 'PAYMENT' && payment.status === 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundAmount(payment.amount.toString());
                                  setShowRefundDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-orange-600"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </Button>
                            )}
                            {(payment.status === 'PENDING' || payment.status === 'FAILED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePayment(payment.id)}
                                className="h-8 w-8 p-0 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Details - {selectedPayment?.payment_no}
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Payment Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedPayment.payment_no}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedPayment.invoice_no}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedPayment.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm mt-1">{selectedPayment.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedPayment.payment_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="text-sm mt-1">
                    {getPaymentMethodBadge(selectedPayment.payment_method)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant={selectedPayment.payment_type === 'PAYMENT' ? 'default' : 'secondary'}>
                    {selectedPayment.payment_type}
                  </Badge>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className={`text-lg font-bold ${selectedPayment.payment_type === 'REFUND' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedPayment.payment_type === 'REFUND' ? '-' : '+'}₹{selectedPayment.amount.toFixed(2)}
                </div>
              </div>

              {selectedPayment.transaction_id && (
                <div>
                  <Label className="text-sm font-medium">Transaction ID</Label>
                  <div className="text-sm mt-1 font-mono">{selectedPayment.transaction_id}</div>
                </div>
              )}

              {selectedPayment.bank_reference && (
                <div>
                  <Label className="text-sm font-medium">Bank Reference</Label>
                  <div className="text-sm mt-1 font-mono">{selectedPayment.bank_reference}</div>
                </div>
              )}

              {selectedPayment.cheque_number && (
                <div>
                  <Label className="text-sm font-medium">Cheque Number</Label>
                  <div className="text-sm mt-1 font-mono">{selectedPayment.cheque_number}</div>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedPayment.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDetails(false)}>
              Close
            </Button>
            {selectedPayment?.payment_type === 'PAYMENT' && selectedPayment?.status === 'COMPLETED' && (
              <Button
                onClick={() => {
                  setShowPaymentDetails(false);
                  setRefundAmount(selectedPayment.amount.toString());
                  setShowRefundDialog(true);
                }}
                variant="outline"
                className="text-orange-600"
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Process Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Invoice Number</Label>
                <Input
                  value={newPayment.invoice_no}
                  onChange={(e) => setNewPayment({...newPayment, invoice_no: e.target.value})}
                  className="mt-1"
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Customer Name</Label>
                <Input
                  value={newPayment.customer_name}
                  onChange={(e) => setNewPayment({...newPayment, customer_name: e.target.value})}
                  className="mt-1"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input
                  value={newPayment.customer_phone}
                  onChange={(e) => setNewPayment({...newPayment, customer_phone: e.target.value})}
                  className="mt-1"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <Input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="mt-1"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select value={newPayment.payment_method} onValueChange={(value) => setNewPayment({...newPayment, payment_method: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Payment Type</Label>
                <Select value={newPayment.payment_type} onValueChange={(value) => setNewPayment({...newPayment, payment_type: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newPayment.payment_method === 'CARD' || newPayment.payment_method === 'UPI' || newPayment.payment_method === 'NET_BANKING') && (
              <div>
                <Label className="text-sm font-medium">Transaction ID</Label>
                <Input
                  value={newPayment.transaction_id}
                  onChange={(e) => setNewPayment({...newPayment, transaction_id: e.target.value})}
                  className="mt-1"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}

            {newPayment.payment_method === 'BANK_TRANSFER' && (
              <div>
                <Label className="text-sm font-medium">Bank Reference</Label>
                <Input
                  value={newPayment.bank_reference}
                  onChange={(e) => setNewPayment({...newPayment, bank_reference: e.target.value})}
                  className="mt-1"
                  placeholder="Enter bank reference number"
                />
              </div>
            )}

            {newPayment.payment_method === 'CHEQUE' && (
              <div>
                <Label className="text-sm font-medium">Cheque Number</Label>
                <Input
                  value={newPayment.cheque_number}
                  onChange={(e) => setNewPayment({...newPayment, cheque_number: e.target.value})}
                  className="mt-1"
                  placeholder="Enter cheque number"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                className="mt-1"
                placeholder="Enter additional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPayment(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createPayment}
              disabled={!newPayment.invoice_no || !newPayment.customer_name || !newPayment.amount}
            >
              Create Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Payment Number</Label>
                <div className="text-sm mt-1 font-mono">{selectedPayment.payment_no}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Original Amount</Label>
                <div className="text-sm mt-1 font-semibold text-green-600">₹{selectedPayment.amount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Refund Amount</Label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1"
                  placeholder="Enter refund amount"
                  max={selectedPayment.amount.toString()}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Refund Reason</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1"
                  placeholder="Enter refund reason"
                  rows={3}
                />
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> This will create a refund transaction. The amount will be deducted from the customer's balance.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={processRefund}
              disabled={!refundAmount || !refundReason}
              variant="outline"
              className="text-orange-600"
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
