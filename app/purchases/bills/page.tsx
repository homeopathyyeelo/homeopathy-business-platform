'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, DollarSign, TrendingUp, Calendar, Search } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Bill {
  id: string
  bill_no: string
  vendor_name: string
  order_no: string
  bill_date: string
  due_date: string | null
  total_amount: number
  paid_amount: number
  status: string
  payment_terms: string
}

export default function BillsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean, data: Bill[], total: number }>(
    `/api/erp/purchases/bills${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: statsData } = useSWR<{ success: boolean, data: any }>(
    '/api/erp/purchases/bills/stats',
    fetcher
  )

  const bills = data?.data || []
  const stats = statsData?.data || {}

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'UNPAID': return 'bg-red-100 text-red-800'
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" />
            Purchase Bills
          </h1>
          <p className="text-gray-600 mt-1">Manage vendor bills and payments</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bills || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unpaid Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaid_bills || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.total_outstanding || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_paid || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by bill number or vendor..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'UNPAID' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('UNPAID')}
              >
                Unpaid
              </Button>
              <Button
                variant={statusFilter === 'PARTIAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PARTIAL')}
              >
                Partial
              </Button>
              <Button
                variant={statusFilter === 'PAID' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PAID')}
              >
                Paid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading bills...</p>
            </div>
          ) : bills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Bill No</th>
                    <th className="text-left p-3 font-semibold">Vendor</th>
                    <th className="text-left p-3 font-semibold">PO Number</th>
                    <th className="text-left p-3 font-semibold">Bill Date</th>
                    <th className="text-left p-3 font-semibold">Due Date</th>
                    <th className="text-right p-3 font-semibold">Total Amount</th>
                    <th className="text-right p-3 font-semibold">Paid Amount</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{bill.bill_no}</span>
                      </td>
                      <td className="p-3">{bill.vendor_name || 'Unknown'}</td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">{bill.order_no || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{formatDate(bill.bill_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{formatDate(bill.due_date)}</span>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(bill.paid_amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          {bill.status !== 'PAID' && (
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bills Found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `No ${statusFilter.toLowerCase()} bills` : 'No purchase bills yet'}
              </p>
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create First Bill
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
