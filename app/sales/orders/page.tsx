"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { golangAPI } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Search, Filter, DollarSign, Package, Clock, CheckCircle2, AlertCircle, Printer, Download } from 'lucide-react'
import { useThermalPrinter, PrinterConfig } from '@/lib/thermal-printer'
import { useToast } from '@/hooks/use-toast'

export default function OrdersPage() {
  const { toast } = useToast()
  const { isConfigured, print, showPreview, printViaDialog } = useThermalPrinter()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    source: '',
    startDate: '',
    endDate: ''
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [printingOrder, setPrintingOrder] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus)
      if (filters.source) queryParams.append('source', filters.source)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await golangAPI.get(`/api/erp/orders?${queryParams.toString()}`)
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await golangAPI.get(`/api/erp/orders/${orderId}`)
      setSelectedOrder(response.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const recordPayment = async () => {
    if (!selectedOrder || !paymentAmount) return

    try {
      await golangAPI.post(`/api/erp/orders/${selectedOrder.order.id}/payments`, {
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
        notes: ''
      })

      setShowPaymentModal(false)
      setPaymentAmount('')
      toast({ title: '✅ Payment Recorded' })
      fetchOrders()
      if (selectedOrder) {
        viewOrderDetails(selectedOrder.order.id)
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast({ title: 'Failed to record payment', variant: 'destructive' })
    }
  }

  const printOrderThermal = async (orderId: string) => {
    setPrintingOrder(orderId)
    try {
      const res = await golangAPI.post(`/api/erp/orders/${orderId}/print`)
      if (res.data?.success) {
        const printData = {
          escposData: res.data.escposData,
          previewText: res.data.previewText,
          orderNumber: res.data.orderNumber,
        }

        if (isConfigured) {
          const result = await print(printData)
          if (result.success) {
            toast({ title: '🖨️ Order Printed' })
          } else {
            showPreview(printData)
          }
        } else {
          showPreview(printData)
        }
      }
    } catch (error) {
      toast({ title: 'Print failed', variant: 'destructive' })
    } finally {
      setPrintingOrder(null)
    }
  }

  const downloadOrderInvoice = async (orderNumber: string) => {
    try {
      // Try to find invoice by order number (invoices created from orders often include order number in notes/reference)
      // For now, we'll try using the order number as invoice number if it exists
      const res = await golangAPI.get(`/api/erp/invoices/${orderNumber}/download`, {
        responseType: 'blob',
      })
      
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Order-Invoice-${orderNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({ title: '✅ Invoice PDF Downloaded' })
    } catch (error) {
      console.error('Invoice download error:', error)
      toast({ 
        title: 'Invoice Not Found', 
        description: 'This order may not have been converted to an invoice yet',
        variant: 'destructive' 
      })
    }
  }

  const getPaymentStatusBadge = (status) => {
    const variants = {
      PAID: 'bg-green-500 text-white',
      PARTIAL: 'bg-yellow-500 text-white',
      PENDING: 'bg-red-500 text-white'
    }
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>
  }

  const getSourceBadge = (source) => {
    const variants = {
      POS: 'bg-blue-500 text-white',
      B2B: 'bg-purple-500 text-white',
      ONLINE: 'bg-indigo-500 text-white'
    }
    return <Badge className={variants[source] || 'bg-gray-500 text-white'}>{source}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-gray-500 mt-1">Track orders and payments</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="px-3 py-2 border rounded-md"
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            className="px-3 py-2 border rounded-md"
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          >
            <option value="">All Sources</option>
            <option value="POS">POS</option>
            <option value="B2B">B2B</option>
          </select>

          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />

          <Button onClick={fetchOrders} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewOrderDetails(order.id)}>
                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.orderDate)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">{getSourceBadge(order.source)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-4 text-right text-green-600">{formatCurrency(order.paidAmount)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(order.pendingAmount)}</td>
                    <td className="px-6 py-4 text-center">{getPaymentStatusBadge(order.paymentStatus)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {order.pendingAmount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder({ order })
                              setShowPaymentModal(true)
                            }}
                          >
                            Add Payment
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            printOrderThermal(order.id)
                          }}
                          disabled={printingOrder === order.id}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order: {selectedOrder?.order?.orderNumber}</label>
                <p className="text-sm text-gray-500">Pending: {formatCurrency(selectedOrder?.order?.pendingAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={recordPayment} className="flex-1">Record Payment</Button>
                <Button onClick={() => setShowPaymentModal(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="p-6 w-full max-w-4xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-gray-500">{selectedOrder.order?.orderNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => printOrderThermal(selectedOrder.order?.id)}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Thermal
                </Button>
                <Button
                  onClick={() => downloadOrderInvoice(selectedOrder.order?.orderNumber)}
                  variant="outline"
                  size="sm"
                  className="text-green-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice PDF
                </Button>
                <Button onClick={() => setSelectedOrder(null)} variant="outline">Close</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.order?.customerName}</p>
                <p className="text-sm"><span className="font-medium">Phone:</span> {selectedOrder.order?.customerPhone}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(selectedOrder.order?.orderDate)}</p>
                <p className="text-sm"><span className="font-medium">Source:</span> {selectedOrder.order?.source}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> {selectedOrder.order?.status}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Order Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-center">Quantity</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">{formatCurrency(selectedOrder.paymentSummary?.totalAmount)}</span>
              </div>
              <div className="flex justify-between mb-2 text-green-600">
                <span>Paid Amount:</span>
                <span>{formatCurrency(selectedOrder.paymentSummary?.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Pending Amount:</span>
                <span className="font-bold">{formatCurrency(selectedOrder.paymentSummary?.pendingAmount)}</span>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="font-semibold mb-3">Payment History ({selectedOrder.payments?.length || 0})</h3>
              {selectedOrder.payments?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Payment #</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Method</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.payments.map((payment, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{payment.paymentNumber}</td>
                        <td className="px-4 py-2">{formatDate(payment.paymentDate)}</td>
                        <td className="px-4 py-2">{payment.paymentMethod}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">No payments recorded yet</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
