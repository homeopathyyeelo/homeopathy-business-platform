'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
import { authFetch } from '@/lib/api/fetch-utils';
  TrendingUp, TrendingDown, ShoppingCart, ShoppingBag, DollarSign,
  Package, Calendar, Download, Search, Filter, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

export default function SalesPurchasePage() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [purchaseData, setPurchaseData] = useState<any[]>([])
  const [salesSummary, setSalesSummary] = useState<any>(null)
  const [purchaseSummary, setPurchaseSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('sales')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salesRes, purchaseRes, salesSumRes, purchaseSumRes] = await Promise.all([
        authFetch(`${API_URL}/api/erp/analytics/sales`),
        authFetch(`${API_URL}/api/erp/analytics/purchases`),
        authFetch(`${API_URL}/api/erp/analytics/sales-summary`),
        authFetch(`${API_URL}/api/erp/analytics/purchase-summary`)
      ])

      if (salesRes.ok) {
        const data = await salesRes.json()
        setSalesData(data.success ? data.data : [])
      }
      if (purchaseRes.ok) {
        const data = await purchaseRes.json()
        setPurchaseData(data.success ? data.data : [])
      }
      if (salesSumRes.ok) {
        const data = await salesSumRes.json()
        setSalesSummary(data.success ? data.data : null)
      }
      if (purchaseSumRes.ok) {
        const data = await purchaseSumRes.json()
        setPurchaseSummary(data.success ? data.data : null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'received':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSales = salesData.filter(item =>
    item.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPurchases = purchaseData.filter(item =>
    item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Sales & Purchase Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-gray-200 rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-8 bg-gray-200 rounded"></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Sales & Purchase Analytics
          </h1>
          <p className="text-gray-600 mt-1">Complete sales and purchase analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Filter Dates
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Summary */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Sales Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  {salesSummary && formatCurrency(salesSummary.total_sales)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{salesSummary?.total_transactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-lg font-semibold">
                  {salesSummary && formatCurrency(salesSummary.avg_order_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-lg font-semibold">
                  {salesSummary && formatCurrency(salesSummary.today_sales)}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Cash</p>
                <p className="font-semibold">{salesSummary && formatCurrency(salesSummary.cash_sales)}</p>
              </div>
              <div>
                <p className="text-gray-600">Card</p>
                <p className="font-semibold">{salesSummary && formatCurrency(salesSummary.card_sales)}</p>
              </div>
              <div>
                <p className="text-gray-600">UPI</p>
                <p className="font-semibold">{salesSummary && formatCurrency(salesSummary.upi_sales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Summary */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              Purchase Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-orange-600">
                  {purchaseSummary && formatCurrency(purchaseSummary.total_purchases)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{purchaseSummary?.total_orders || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-lg font-semibold">
                  {purchaseSummary && formatCurrency(purchaseSummary.avg_order_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Purchase</p>
                <p className="text-lg font-semibold">
                  {purchaseSummary && formatCurrency(purchaseSummary.today_purchases)}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Pending Orders</p>
                <p className="font-semibold text-yellow-600">{purchaseSummary?.pending_orders || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Completed Orders</p>
                <p className="font-semibold text-green-600">{purchaseSummary?.completed_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Sales vs Purchase Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Today</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sales</p>
                  <p className="text-lg font-bold text-green-600">
                    {salesSummary && formatCurrency(salesSummary.today_sales)}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500">Purchase</p>
                  <p className="text-lg font-bold text-orange-600">
                    {purchaseSummary && formatCurrency(purchaseSummary.today_purchases)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1">
                {salesSummary && purchaseSummary && salesSummary.today_sales > purchaseSummary.today_purchases ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">Profit</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">Loss</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">This Week</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sales</p>
                  <p className="text-lg font-bold text-green-600">
                    {salesSummary && formatCurrency(salesSummary.week_sales)}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500">Purchase</p>
                  <p className="text-lg font-bold text-orange-600">
                    {purchaseSummary && formatCurrency(purchaseSummary.week_purchases)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">This Month</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sales</p>
                  <p className="text-lg font-bold text-green-600">
                    {salesSummary && formatCurrency(salesSummary.month_sales)}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500">Purchase</p>
                  <p className="text-lg font-bold text-orange-600">
                    {purchaseSummary && formatCurrency(purchaseSummary.month_purchases)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Details</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Sales ({filteredSales.length})
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Purchases ({filteredPurchases.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-semibold">Invoice No</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-right p-3 font-semibold">Amount</th>
                      <th className="text-right p-3 font-semibold">Tax</th>
                      <th className="text-right p-3 font-semibold">Net</th>
                      <th className="text-center p-3 font-semibold">Payment</th>
                      <th className="text-center p-3 font-semibold">Status</th>
                      <th className="text-center p-3 font-semibold">Items</th>
                      <th className="text-center p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{sale.invoice_no}</td>
                        <td className="p-3 text-sm">{formatDate(sale.date)}</td>
                        <td className="p-3">{sale.customer_name}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(sale.total_amount)}</td>
                        <td className="p-3 text-right text-sm text-gray-600">{formatCurrency(sale.tax_amount)}</td>
                        <td className="p-3 text-right font-bold text-green-600">{formatCurrency(sale.net_amount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{sale.payment_mode}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={getStatusColor(sale.status)}>{sale.status}</Badge>
                        </td>
                        <td className="p-3 text-center">{sale.items_count}</td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="purchases" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-semibold">PO Number</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Vendor</th>
                      <th className="text-right p-3 font-semibold">Amount</th>
                      <th className="text-right p-3 font-semibold">Tax</th>
                      <th className="text-right p-3 font-semibold">Net</th>
                      <th className="text-center p-3 font-semibold">GRN</th>
                      <th className="text-center p-3 font-semibold">Status</th>
                      <th className="text-center p-3 font-semibold">Items</th>
                      <th className="text-center p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{purchase.po_number}</td>
                        <td className="p-3 text-sm">{formatDate(purchase.date)}</td>
                        <td className="p-3">{purchase.vendor_name}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(purchase.total_amount)}</td>
                        <td className="p-3 text-right text-sm text-gray-600">{formatCurrency(purchase.tax_amount)}</td>
                        <td className="p-3 text-right font-bold text-orange-600">{formatCurrency(purchase.net_amount)}</td>
                        <td className="p-3 text-center text-sm font-mono text-gray-600">
                          {purchase.grn_number || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={getStatusColor(purchase.status)}>{purchase.status}</Badge>
                        </td>
                        <td className="p-3 text-center">{purchase.items_count}</td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
