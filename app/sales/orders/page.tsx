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
  ShoppingCart, Printer, X, IndianRupee, Truck, MapPin, Phone, Receipt
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SalesOrder {
  id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  order_date: string;
  delivery_date?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  payment_method: string;
  items_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function SalesOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.payment_status = paymentFilter;

      const res = await golangAPI.get('/api/erp/sales/orders', { params });
      const data = res.data?.data || {};
      
      setOrders(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
      
      // Calculate stats
      const ordersData = data.items || [];
      setStats({
        pending: ordersData.filter((o: SalesOrder) => o.status === 'PENDING').length,
        confirmed: ordersData.filter((o: SalesOrder) => o.status === 'CONFIRMED').length,
        processing: ordersData.filter((o: SalesOrder) => o.status === 'PROCESSING').length,
        shipped: ordersData.filter((o: SalesOrder) => o.status === 'SHIPPED').length,
        delivered: ordersData.filter((o: SalesOrder) => o.status === 'DELIVERED').length,
        cancelled: ordersData.filter((o: SalesOrder) => o.status === 'CANCELLED').length,
        totalRevenue: ordersData.reduce((sum: number, o: SalesOrder) => sum + o.total_amount, 0),
        avgOrderValue: ordersData.length > 0 ? ordersData.reduce((sum: number, o: SalesOrder) => sum + o.total_amount, 0) / ordersData.length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, paymentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setCurrentPage(1);
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const res = await golangAPI.put(`/api/erp/sales/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });

      if (res.data?.success) {
        toast({
          title: 'Status Updated',
          description: `Order ${selectedOrder.order_no} status changed to ${newStatus}`,
        });
        
        fetchOrders();
        setShowEditStatus(false);
        setSelectedOrder(null);
        setNewStatus('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  // Convert order to invoice
  const convertToInvoice = async (order: SalesOrder) => {
    try {
      const res = await golangAPI.post(`/api/erp/sales/orders/${order.id}/convert-to-invoice`);
      
      if (res.data?.success) {
        toast({
          title: 'Invoice Created',
          description: `Invoice created from order ${order.order_no}`,
        });
        
        router.push(`/sales/invoices`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert to invoice',
        variant: 'destructive',
      });
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const res = await golangAPI.delete(`/api/erp/sales/orders/${orderId}`);
      
      if (res.data?.success) {
        toast({
          title: 'Order Deleted',
          description: 'Sales order deleted successfully',
        });
        
        fetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive',
      });
    }
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: Package },
      SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: X },
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

  // Payment status badge
  const getPaymentBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      PAID: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      PARTIAL: { color: 'bg-orange-100 text-orange-800', text: 'Partial' },
      OVERDUE: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
    };

    const paymentConfig = config[status] || config.PENDING;

    return <Badge className={paymentConfig.color}>{paymentConfig.text}</Badge>;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Sales Orders</h1>
              <p className="text-sm text-blue-100">Manage customer orders and track delivery</p>
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
                <div className="text-xl font-bold">{stats.confirmed}</div>
                <div className="text-xs text-gray-600">Confirmed</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xl font-bold">{stats.processing}</div>
                <div className="text-xs text-gray-600">Processing</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="text-xl font-bold">{stats.shipped}</div>
                <div className="text-xs text-gray-600">Shipped</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xl font-bold">{stats.delivered}</div>
                <div className="text-xs text-gray-600">Delivered</div>
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
                <div className="text-xl font-bold">{totalOrders}</div>
                <div className="text-xs text-gray-600">Total Orders</div>
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
                    placeholder="Search by order number, customer name, phone..."
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
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => router.push('/sales/orders/create')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Sales Orders Found</h3>
                <p className="text-sm mb-4">Create your first sales order to get started</p>
                <Button onClick={() => router.push('/sales/orders/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Order #</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Contact</th>
                      <th className="text-left p-3 font-medium text-sm">Order Date</th>
                      <th className="text-left p-3 font-medium text-sm">Delivery Date</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-left p-3 font-medium text-sm">Payment</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      <th className="text-center p-3 font-medium text-sm">Items</th>
                      <th className="text-center p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{order.order_no}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{order.customer_name}</div>
                          {order.customer_address && (
                            <div className="text-xs text-gray-500 truncate max-w-48">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {order.customer_address}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {order.customer_phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          {order.delivery_date ? (
                            <div className="text-sm">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(order.delivery_date).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-3">
                          {getPaymentBadge(order.payment_status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-sm">₹{order.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{order.payment_method}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {order.items_count} items
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setShowEditStatus(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {order.status === 'CONFIRMED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => convertToInvoice(order)}
                                className="h-8 w-8 p-0 text-green-600"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            {order.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteOrder(order.id)}
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

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details - {selectedOrder?.order_no}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <div className="text-sm mt-1">{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm mt-1">{selectedOrder.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <div className="text-sm mt-1">
                    {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Delivery Date</Label>
                  <div className="text-sm mt-1">
                    {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
              
              {selectedOrder.customer_address && (
                <div>
                  <Label className="text-sm font-medium">Delivery Address</Label>
                  <div className="text-sm mt-1">{selectedOrder.customer_address}</div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  {getPaymentBadge(selectedOrder.payment_status)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  ₹{selectedOrder.total_amount.toFixed(2)}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedOrder.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowOrderDetails(false);
                setNewStatus(selectedOrder?.status || '');
                setShowEditStatus(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={showEditStatus} onOpenChange={setShowEditStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Order Number</Label>
              <div className="text-sm mt-1 font-medium">{selectedOrder?.order_no}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStatus(false)}>
              Cancel
            </Button>
            <Button onClick={updateOrderStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
