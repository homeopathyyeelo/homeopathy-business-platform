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
  FileCheck, CreditCard, Banknote, RotateCcw, RefreshCw
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ReturnItem {
  product_id: string;
  product_name: string;
  sku: string;
  batch_no?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  return_reason: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'WRONG_ITEM';
}

interface ReturnRefund {
  id: string;
  return_no: string;
  invoice_id?: string;
  invoice_no?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  return_date: string;
  return_type: 'RETURN' | 'REFUND' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'COMPLETED';
  total_amount: number;
  refund_amount: number;
  refund_method: string;
  items: ReturnItem[];
  reason: string;
  notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export default function ReturnsRefundsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [returns, setReturns] = useState<ReturnRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReturns, setTotalReturns] = useState(0);

  // Dialog states
  const [selectedReturn, setSelectedReturn] = useState<ReturnRefund | null>(null);
  const [showReturnDetails, setShowReturnDetails] = useState(false);
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [showProcessReturn, setShowProcessReturn] = useState(false);

  // New return form
  const [newReturn, setNewReturn] = useState({
    invoice_no: '',
    customer_name: '',
    customer_phone: '',
    return_type: 'RETURN' as 'RETURN' | 'REFUND' | 'EXCHANGE',
    reason: '',
    notes: '',
    refund_method: 'CASH',
  });
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    processed: 0,
    completed: 0,
    rejected: 0,
    totalReturns: 0,
    totalRefundAmount: 0,
    avgRefundAmount: 0,
  });

  // Fetch returns
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.return_type = typeFilter;

      const res = await golangAPI.get('/api/erp/sales/returns', { params });
      const data = res.data?.data || {};
      
      setReturns(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalReturns(data.total || 0);
      
      // Calculate stats
      const returnsData = data.items || [];
      setStats({
        pending: returnsData.filter((r: ReturnRefund) => r.status === 'PENDING').length,
        approved: returnsData.filter((r: ReturnRefund) => r.status === 'APPROVED').length,
        processed: returnsData.filter((r: ReturnRefund) => r.status === 'PROCESSED').length,
        completed: returnsData.filter((r: ReturnRefund) => r.status === 'COMPLETED').length,
        rejected: returnsData.filter((r: ReturnRefund) => r.status === 'REJECTED').length,
        totalReturns: returnsData.length,
        totalRefundAmount: returnsData.reduce((sum: number, r: ReturnRefund) => sum + r.refund_amount, 0),
        avgRefundAmount: returnsData.length > 0 ? returnsData.reduce((sum: number, r: ReturnRefund) => sum + r.refund_amount, 0) / returnsData.length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load returns and refunds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [currentPage, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchReturns();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create new return
  const createReturn = async () => {
    try {
      const returnData = {
        ...newReturn,
        items: returnItems,
        total_amount: returnItems.reduce((sum, item) => sum + item.total_amount, 0),
        refund_amount: returnItems.reduce((sum, item) => sum + item.total_amount, 0),
      };

      const res = await golangAPI.post('/api/erp/sales/returns', returnData);

      if (res.data?.success) {
        toast({
          title: 'Return Created',
          description: `Return ${res.data?.data?.return_no} created successfully`,
        });
        
        fetchReturns();
        setShowNewReturn(false);
        setNewReturn({
          invoice_no: '',
          customer_name: '',
          customer_phone: '',
          return_type: 'RETURN',
          reason: '',
          notes: '',
          refund_method: 'CASH',
        });
        setReturnItems([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create return',
        variant: 'destructive',
      });
    }
  };

  // Process return
  const processReturn = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReturn) return;

    try {
      const res = await golangAPI.put(`/api/erp/sales/returns/${selectedReturn.id}/process`, {
        status,
        notes: selectedReturn.notes,
      });

      if (res.data?.success) {
        toast({
          title: `Return ${status}`,
          description: `Return ${selectedReturn.return_no} has been ${status.toLowerCase()}`,
        });
        
        fetchReturns();
        setShowProcessReturn(false);
        setSelectedReturn(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process return',
        variant: 'destructive',
      });
    }
  };

  // Complete return (process refund)
  const completeReturn = async () => {
    if (!selectedReturn) return;

    try {
      const res = await golangAPI.put(`/api/erp/sales/returns/${selectedReturn.id}/complete`);

      if (res.data?.success) {
        toast({
          title: 'Return Completed',
          description: `Refund processed for return ${selectedReturn.return_no}`,
        });
        
        fetchReturns();
        setShowProcessReturn(false);
        setSelectedReturn(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete return',
        variant: 'destructive',
      });
    }
  };

  // Delete return
  const deleteReturn = async (returnId: string) => {
    if (!confirm('Are you sure you want to delete this return?')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/returns/${returnId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Return Deleted',
          description: 'Return deleted successfully',
        });
        
        fetchReturns();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete return',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSED: { color: 'bg-purple-100 text-purple-800', icon: Package },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: X },
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

  // Return type badge
  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; text: string }> = {
      RETURN: { color: 'bg-blue-100 text-blue-800', text: 'Return' },
      REFUND: { color: 'bg-green-100 text-green-800', text: 'Refund' },
      EXCHANGE: { color: 'bg-purple-100 text-purple-800', text: 'Exchange' },
    };

    const typeConfig = config[type] || config.RETURN;

    return <Badge className={typeConfig.color}>{typeConfig.text}</Badge>;
  };

  // Condition badge
  const getConditionBadge = (condition: string) => {
    const config: Record<string, { color: string; text: string }> = {
      GOOD: { color: 'bg-green-100 text-green-800', text: 'Good' },
      DAMAGED: { color: 'bg-orange-100 text-orange-800', text: 'Damaged' },
      EXPIRED: { color: 'bg-red-100 text-red-800', text: 'Expired' },
      WRONG_ITEM: { color: 'bg-purple-100 text-purple-800', text: 'Wrong Item' },
    };

    const conditionConfig = config[condition] || config.GOOD;

    return <Badge className={conditionConfig.color}>{conditionConfig.text}</Badge>;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Returns & Refunds</h1>
              <p className="text-sm text-orange-100">Manage product returns and refund requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/pos')}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              POS Billing
            </Button>
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
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{stats.approved}</div>
                <div className="text-xs text-gray-600">Approved</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{stats.processed}</div>
                <div className="text-xs text-gray-600">Processed</div>
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
              <X className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.rejected}</div>
                <div className="text-xs text-gray-600">Rejected</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xl font-bold">{totalReturns}</div>
                <div className="text-xs text-gray-600">Total Returns</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalRefundAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Refund</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">₹{stats.avgRefundAmount.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Avg Refund</div>
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
                    placeholder="Search by return number, customer name, invoice..."
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
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Return type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="EXCHANGE">Exchange</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setShowNewReturn(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                New Return
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <RotateCcw className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Returns Found</h3>
                <p className="text-sm mb-4">Create your first return to get started</p>
                <Button onClick={() => setShowNewReturn(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Return
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Return #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Invoice</th>
                      <th className="text-left p-3 font-medium text-sm">Return Date</th>
                      <th className="text-left p-3 font-medium text-sm">Type</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-right p-3 font-medium text-sm">Total Amount</th>
                      <th className="text-right p-3 font-medium text-sm">Refund Amount</th>
                      <th className="text-center p-3 font-medium text-sm">Items</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((returnItem) => (
                      <tr key={returnItem.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{returnItem.return_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(returnItem.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{returnItem.customer_name}</div>
                          <div className="text-sm text-gray-600">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {returnItem.customer_phone}
                          </div>
                        </td>
                        <td className="p-3">
                          {returnItem.invoice_no ? (
                            <div className="text-sm font-mono">{returnItem.invoice_no}</div>
                          ) : (
                            <span className="text-gray-400 text-sm">No Invoice</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(returnItem.return_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {getTypeBadge(returnItem.return_type)}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(returnItem.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm">₹{returnItem.total_amount.toFixed(2)}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm text-green-600">₹{returnItem.refund_amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{returnItem.refund_method}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {returnItem.items.length} items
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setShowReturnDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {returnItem.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(returnItem);
                                  setShowProcessReturn(true);
                                }}
                                className="h-8 w-8 p-0 text-blue-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {returnItem.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteReturn(returnItem.id)}
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

      {/* Return Details Dialog */}
      <Dialog open={showReturnDetails} onOpenChange={setShowReturnDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Return Details - {selectedReturn?.return_no}
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedReturn.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm mt-1">{selectedReturn.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Return Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedReturn.return_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice</Label>
                  <div className="text-sm mt-1 font-mono">
                    {selectedReturn.invoice_no || 'No Invoice'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getTypeBadge(selectedReturn.return_type)}
                  {getStatusBadge(selectedReturn.status)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  Refund: ₹{selectedReturn.refund_amount.toFixed(2)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Returned Items</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Product</th>
                        <th className="text-left p-2 text-xs font-medium">SKU</th>
                        <th className="text-center p-2 text-xs font-medium">Qty</th>
                        <th className="text-center p-2 text-xs font-medium">Condition</th>
                        <th className="text-right p-2 text-xs font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-sm">{item.product_name}</td>
                          <td className="p-2 text-sm font-mono">{item.sku}</td>
                          <td className="p-2 text-sm text-center">{item.quantity}</td>
                          <td className="p-2 text-sm text-center">
                            {getConditionBadge(item.condition)}
                          </td>
                          <td className="p-2 text-sm text-right">₹{item.total_amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Return Reason</Label>
                <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedReturn.reason}</div>
              </div>

              {selectedReturn.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedReturn.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDetails(false)}>
              Close
            </Button>
            {selectedReturn?.status === 'PENDING' && (
              <Button
                onClick={() => {
                  setShowReturnDetails(false);
                  setShowProcessReturn(true);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Return
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Return Dialog */}
      <Dialog open={showProcessReturn} onOpenChange={setShowProcessReturn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Return Number</Label>
                <div className="text-sm mt-1 font-medium">{selectedReturn.return_no}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <div className="text-sm mt-1">{selectedReturn.customer_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Refund Amount</Label>
                <div className="text-lg font-bold text-green-600">₹{selectedReturn.refund_amount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Refund Method</Label>
                <div className="text-sm mt-1">{selectedReturn.refund_method}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessReturn(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => processReturn('REJECTED')}
            >
              Reject Return
            </Button>
            <Button
              onClick={() => processReturn('APPROVED')}
            >
              Approve Return
            </Button>
            {selectedReturn?.status === 'APPROVED' && (
              <Button
                onClick={completeReturn}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Return Dialog */}
      <Dialog open={showNewReturn} onOpenChange={setShowNewReturn}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Return</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Invoice Number (Optional)</Label>
                <Input
                  value={newReturn.invoice_no}
                  onChange={(e) => setNewReturn({...newReturn, invoice_no: e.target.value})}
                  className="mt-1"
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Return Type</Label>
                <Select value={newReturn.return_type} onValueChange={(value: any) => setNewReturn({...newReturn, return_type: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETURN">Return</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                    <SelectItem value="EXCHANGE">Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Customer Name</Label>
                <Input
                  value={newReturn.customer_name}
                  onChange={(e) => setNewReturn({...newReturn, customer_name: e.target.value})}
                  className="mt-1"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input
                  value={newReturn.customer_phone}
                  onChange={(e) => setNewReturn({...newReturn, customer_phone: e.target.value})}
                  className="mt-1"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Return Reason</Label>
              <Textarea
                value={newReturn.reason}
                onChange={(e) => setNewReturn({...newReturn, reason: e.target.value})}
                className="mt-1"
                placeholder="Enter return reason"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Additional Notes</Label>
              <Textarea
                value={newReturn.notes}
                onChange={(e) => setNewReturn({...newReturn, notes: e.target.value})}
                className="mt-1"
                placeholder="Enter additional notes"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Refund Method</Label>
              <Select value={newReturn.refund_method} onValueChange={(value) => setNewReturn({...newReturn, refund_method: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReturn(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createReturn}
              disabled={!newReturn.customer_name || !newReturn.customer_phone || !newReturn.reason}
            >
              Create Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
