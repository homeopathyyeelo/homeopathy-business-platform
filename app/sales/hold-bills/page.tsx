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
  FileCheck, CreditCard, Banknote, Pause, Play, Archive
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface HoldBillItem {
  product_id: string;
  product_name: string;
  sku: string;
  batch_no?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface HoldBill {
  id: string;
  hold_bill_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  hold_date: string;
  expiry_date?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  total_amount: number;
  items_count: number;
  items: HoldBillItem[];
  hold_reason: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function HoldBillsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHoldBills, setTotalHoldBills] = useState(0);

  // Dialog states
  const [selectedHoldBill, setSelectedHoldBill] = useState<HoldBill | null>(null);
  const [showHoldBillDetails, setShowHoldBillDetails] = useState(false);
  const [showNewHoldBill, setShowNewHoldBill] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // New hold bill form
  const [newHoldBill, setNewHoldBill] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    hold_reason: '',
    notes: '',
    expiry_hours: '24',
  });
  const [holdBillItems, setHoldBillItems] = useState<HoldBillItem[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    converted: 0,
    cancelled: 0,
    totalHoldBills: 0,
    totalHoldAmount: 0,
    avgHoldAmount: 0,
    expiringToday: 0,
  });

  // Fetch hold bills
  const fetchHoldBills = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await golangAPI.get('/api/erp/sales/hold-bills', { params });
      const data = res.data?.data || {};
      
      setHoldBills(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalHoldBills(data.total || 0);
      
      // Calculate stats
      const holdBillsData = data.items || [];
      const today = new Date().toISOString().split('T')[0];
      
      setStats({
        active: holdBillsData.filter((h: HoldBill) => h.status === 'ACTIVE').length,
        expired: holdBillsData.filter((h: HoldBill) => h.status === 'EXPIRED').length,
        converted: holdBillsData.filter((h: HoldBill) => h.status === 'CONVERTED').length,
        cancelled: holdBillsData.filter((h: HoldBill) => h.status === 'CANCELLED').length,
        totalHoldBills: holdBillsData.length,
        totalHoldAmount: holdBillsData.reduce((sum: number, h: HoldBill) => sum + h.total_amount, 0),
        avgHoldAmount: holdBillsData.length > 0 ? holdBillsData.reduce((sum: number, h: HoldBill) => sum + h.total_amount, 0) / holdBillsData.length : 0,
        expiringToday: holdBillsData.filter((h: HoldBill) => 
          h.status === 'ACTIVE' && h.expiry_date && h.expiry_date.split('T')[0] === today
        ).length,
      });
    } catch (error) {
      console.error('Failed to fetch hold bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hold bills',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldBills();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchHoldBills();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create new hold bill
  const createHoldBill = async () => {
    try {
      const holdBillData = {
        ...newHoldBill,
        items: holdBillItems,
        total_amount: holdBillItems.reduce((sum, item) => sum + item.total_amount, 0),
        items_count: holdBillItems.length,
        expiry_hours: parseInt(newHoldBill.expiry_hours),
      };

      const res = await golangAPI.post('/api/erp/sales/hold-bills', holdBillData);

      if (res.data?.success) {
        toast({
          title: 'Hold Bill Created',
          description: `Hold bill ${res.data?.data?.hold_bill_no} created successfully`,
        });
        
        fetchHoldBills();
        setShowNewHoldBill(false);
        setNewHoldBill({
          customer_name: '',
          customer_phone: '',
          customer_address: '',
          hold_reason: '',
          notes: '',
          expiry_hours: '24',
        });
        setHoldBillItems([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hold bill',
        variant: 'destructive',
      });
    }
  };

  // Convert hold bill to invoice
  const convertToInvoice = async () => {
    if (!selectedHoldBill) return;

    try {
      const res = await golangAPI.post(`/api/erp/sales/hold-bills/${selectedHoldBill.id}/convert`);

      if (res.data?.success) {
        toast({
          title: 'Converted to Invoice',
          description: `Hold bill ${selectedHoldBill.hold_bill_no} converted to invoice ${res.data?.data?.invoice_no}`,
        });
        
        fetchHoldBills();
        setShowConvertDialog(false);
        setSelectedHoldBill(null);
        
        // Navigate to the new invoice
        if (res.data?.data?.invoice_id) {
          router.push(`/sales/invoices`);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert hold bill',
        variant: 'destructive',
      });
    }
  };

  // Cancel hold bill
  const cancelHoldBill = async (holdBillId: string) => {
    if (!confirm('Are you sure you want to cancel this hold bill?')) return;

    try {
      const res = await golangAPI.put(`/api/erp/sales/hold-bills/${holdBillId}/cancel`);
      
      if (res.data?.success) {
        toast({
          title: 'Hold Bill Cancelled',
          description: 'Hold bill cancelled successfully',
        });
        
        fetchHoldBills();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel hold bill',
        variant: 'destructive',
      });
    }
  };

  // Delete hold bill
  const deleteHoldBill = async (holdBillId: string) => {
    if (!confirm('Are you sure you want to delete this hold bill? This action cannot be undone.')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/hold-bills/${holdBillId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Hold Bill Deleted',
          description: 'Hold bill deleted successfully',
        });
        
        fetchHoldBills();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete hold bill',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string, expiryDate?: string) => {
    const isExpired = expiryDate && new Date(expiryDate) < new Date();
    
    const statusConfig: Record<string, { color: string; icon: any }> = {
      ACTIVE: { color: isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800', icon: isExpired ? AlertCircle : CheckCircle },
      EXPIRED: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      CONVERTED: { color: 'bg-blue-100 text-blue-800', icon: FileCheck },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: X },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {isExpired && status === 'ACTIVE' ? 'EXPIRED' : status}
      </Badge>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Hold Bills</h1>
              <p className="text-sm text-purple-100">Manage temporary bill holds and quotations</p>
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
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.active}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-xl font-bold">{stats.expired}</div>
                <div className="text-xs text-gray-600">Expired</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">{stats.converted}</div>
                <div className="text-xs text-gray-600">Converted</div>
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
              <Pause className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{totalHoldBills}</div>
                <div className="text-xs text-gray-600">Total Hold Bills</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">₹{(stats.totalHoldAmount / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-600">Total Hold Amount</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xl font-bold">₹{stats.avgHoldAmount.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Avg Hold Amount</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xl font-bold">{stats.expiringToday}</div>
                <div className="text-xs text-gray-600">Expiring Today</div>
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
                    placeholder="Search by hold bill number, customer name, phone..."
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setShowNewHoldBill(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Hold Bill
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hold Bills Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            ) : holdBills.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Pause className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Hold Bills Found</h3>
                <p className="text-sm mb-4">Create your first hold bill to get started</p>
                <Button onClick={() => setShowNewHoldBill(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Hold Bill
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Hold Bill #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Contact</th>
                      <th className="text-left p-3 font-medium text-sm">Hold Date</th>
                      <th className="text-left p-3 font-medium text-sm">Expiry Date</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-right p-3 font-medium text-sm">Total Amount</th>
                      <th className="text-center p-3 font-medium text-sm">Items</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdBills.map((holdBill) => (
                      <tr key={holdBill.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{holdBill.hold_bill_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(holdBill.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{holdBill.customer_name}</div>
                          {holdBill.created_by && (
                            <div className="text-xs text-gray-500">By: {holdBill.created_by}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {holdBill.customer_phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(holdBill.hold_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {holdBill.expiry_date ? (
                            <div className="text-sm">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(holdBill.expiry_date).toLocaleDateString()}
                              {new Date(holdBill.expiry_date) < new Date() && (
                                <span className="text-red-600 text-xs ml-1">(Expired)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No expiry</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(holdBill.status, holdBill.expiry_date)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm">₹{holdBill.total_amount.toFixed(2)}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {holdBill.items_count} items
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedHoldBill(holdBill);
                                setShowHoldBillDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {holdBill.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedHoldBill(holdBill);
                                  setShowConvertDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-green-600"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {holdBill.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelHoldBill(holdBill.id)}
                                className="h-8 w-8 p-0 text-orange-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            {(holdBill.status === 'CANCELLED' || holdBill.status === 'EXPIRED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteHoldBill(holdBill.id)}
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

      {/* Hold Bill Details Dialog */}
      <Dialog open={showHoldBillDetails} onOpenChange={setShowHoldBillDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5" />
              Hold Bill Details - {selectedHoldBill?.hold_bill_no}
            </DialogTitle>
          </DialogHeader>
          {selectedHoldBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedHoldBill.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm mt-1">{selectedHoldBill.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hold Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedHoldBill.hold_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <div className="text-sm mt-1">
                    {selectedHoldBill.expiry_date ? 
                      new Date(selectedHoldBill.expiry_date).toLocaleDateString() : 
                      'No expiry'
                    }
                  </div>
                </div>
              </div>
              
              {selectedHoldBill.customer_address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <div className="text-sm mt-1">{selectedHoldBill.customer_address}</div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getStatusBadge(selectedHoldBill.status, selectedHoldBill.expiry_date)}
                </div>
                <div className="text-lg font-bold text-purple-600">
                  Total: ₹{selectedHoldBill.total_amount.toFixed(2)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Hold Bill Items</Label>
                <div className="mt-2 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium">Product</th>
                        <th className="text-left p-2 text-xs font-medium">SKU</th>
                        <th className="text-center p-2 text-xs font-medium">Qty</th>
                        <th className="text-right p-2 text-xs font-medium">Price</th>
                        <th className="text-right p-2 text-xs font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHoldBill.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 text-sm">{item.product_name}</td>
                          <td className="p-2 text-sm font-mono">{item.sku}</td>
                          <td className="p-2 text-sm text-center">{item.quantity}</td>
                          <td className="p-2 text-sm text-right">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-2 text-sm text-right">₹{item.total_amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Hold Reason</Label>
                <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedHoldBill.hold_reason}</div>
              </div>

              {selectedHoldBill.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedHoldBill.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldBillDetails(false)}>
              Close
            </Button>
            {selectedHoldBill?.status === 'ACTIVE' && (
              <Button
                onClick={() => {
                  setShowHoldBillDetails(false);
                  setShowConvertDialog(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
          </DialogHeader>
          {selectedHoldBill && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Hold Bill Number</Label>
                <div className="text-sm mt-1 font-medium">{selectedHoldBill.hold_bill_no}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <div className="text-sm mt-1">{selectedHoldBill.customer_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Amount</Label>
                <div className="text-lg font-bold text-purple-600">₹{selectedHoldBill.total_amount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Items</Label>
                <div className="text-sm mt-1">{selectedHoldBill.items_count} items</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will convert the hold bill to a regular invoice. The hold bill will be marked as converted and cannot be modified.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={convertToInvoice}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Convert to Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Hold Bill Dialog */}
      <Dialog open={showNewHoldBill} onOpenChange={setShowNewHoldBill}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Hold Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Customer Name</Label>
                <Input
                  value={newHoldBill.customer_name}
                  onChange={(e) => setNewHoldBill({...newHoldBill, customer_name: e.target.value})}
                  className="mt-1"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input
                  value={newHoldBill.customer_phone}
                  onChange={(e) => setNewHoldBill({...newHoldBill, customer_phone: e.target.value})}
                  className="mt-1"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Address</Label>
              <Textarea
                value={newHoldBill.customer_address}
                onChange={(e) => setNewHoldBill({...newHoldBill, customer_address: e.target.value})}
                className="mt-1"
                placeholder="Enter customer address"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Hold Reason</Label>
              <Textarea
                value={newHoldBill.hold_reason}
                onChange={(e) => setNewHoldBill({...newHoldBill, hold_reason: e.target.value})}
                className="mt-1"
                placeholder="Enter reason for holding this bill"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Additional Notes</Label>
              <Textarea
                value={newHoldBill.notes}
                onChange={(e) => setNewHoldBill({...newHoldBill, notes: e.target.value})}
                className="mt-1"
                placeholder="Enter additional notes"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Expiry Time (Hours)</Label>
              <Select value={newHoldBill.expiry_hours} onValueChange={(value) => setNewHoldBill({...newHoldBill, expiry_hours: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="48">48 Hours</SelectItem>
                  <SelectItem value="72">72 Hours</SelectItem>
                  <SelectItem value="168">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewHoldBill(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createHoldBill}
              disabled={!newHoldBill.customer_name || !newHoldBill.customer_phone || !newHoldBill.hold_reason}
            >
              Create Hold Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
