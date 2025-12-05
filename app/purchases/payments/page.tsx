'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Plus, Calendar, Search, TrendingUp } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Payment {
  id: string
  payment_no: string
  vendor_name: string
  bill_no: string
  payment_date: string
  amount: number
  payment_method: string
  reference_no: string
  status: string
}

export default function PaymentsPage() {
  const { data, isLoading } = useSWR<{ success: boolean, data: Payment[], total: number }>(
    '/api/erp/purchases/payments',
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: statsData } = useSWR<{ success: boolean, data: any }>(
    '/api/erp/purchases/payments/stats',
    fetcher
  )

  const { data: dueData } = useSWR<{ success: boolean, data: any[] }>(
    '/api/erp/purchases/payments/due',
    fetcher
  )

  const payments = data?.data || []
  const stats = statsData?.data || {}
  const duePayments = dueData?.data || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'VOID': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-500" />
            Purchase Payments
          </h1>
          <p className="text-gray-600 mt-1">Track and record vendor payments</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_payments || 0}</div>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.payments_this_month || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats.amount_this_month || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Due Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{duePayments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Due Payments Alert */}
      {duePayments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Outstanding Payments ({duePayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {duePayments.slice(0, 3).map((due: any) => (
                <div key={due.bill_id} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">{due.vendor_name}</p>
                    <p className="text-sm text-gray-600">Bill: {due.bill_no}</p>
                    {due.days_overdue > 0 && (
                      <p className="text-xs text-red-600">Overdue by {due.days_overdue} days</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatCurrency(due.due_amount)}</p>
                    <Button variant="outline" size="sm" className="mt-1">Pay Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading payments...</p>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Payment No</th>
                    <th className="text-left p-3 font-semibold">Vendor</th>
                    <th className="text-left p-3 font-semibold">Bill No</th>
                    <th className="text-left p-3 font-semibold">Payment Date</th>
                    <th className="text-left p-3 font-semibold">Method</th>
                    <th className="text-right p-3 font-semibold">Amount</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{payment.payment_no}</span>
                      </td>
                      <td className="p-3">{payment.vendor_name || 'Unknown'}</td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">{payment.bill_no || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{formatDate(payment.payment_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{payment.payment_method}</span>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payments Found</h3>
              <p className="text-gray-500 mb-4">No payment records yet</p>
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Record First Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
