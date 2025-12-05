'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCcw, Plus, Calendar, Search } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Return {
  id: string
  return_no: string
  vendor_name: string
  order_no: string
  return_date: string
  reason: string
  status: string
  total_refund: number
  refund_status: string
}

export default function ReturnsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, mutate } = useSWR<{ success: boolean, data: Return[], total: number }>(
    `/api/erp/purchases/returns${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: statsData } = useSWR<{ success: boolean, data: any }>(
    '/api/erp/purchases/returns/stats',
    fetcher
  )

  const returns = data?.data || []
  const stats = statsData?.data || {}

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
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RotateCcw className="w-8 h-8 text-orange-500" />
            Purchase Returns
          </h1>
          <p className="text-gray-600 mt-1">Manage product returns and refunds</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Return
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_returns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_returns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved_returns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_refund_amount || 0)}
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
                  placeholder="Search by return number or vendor..."
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
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('APPROVED')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading returns...</p>
            </div>
          ) : returns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Return No</th>
                    <th className="text-left p-3 font-semibold">Vendor</th>
                    <th className="text-left p-3 font-semibold">PO Number</th>
                    <th className="text-left p-3 font-semibold">Return Date</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                    <th className="text-right p-3 font-semibold">Refund Amount</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">Refund Status</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{returnItem.return_no}</span>
                      </td>
                      <td className="p-3">{returnItem.vendor_name || 'Unknown'}</td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">{returnItem.order_no || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{formatDate(returnItem.return_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">{returnItem.reason}</span>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(returnItem.total_refund)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(returnItem.status)}>
                          {returnItem.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getRefundStatusColor(returnItem.refund_status)}>
                          {returnItem.refund_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          {returnItem.status === 'PENDING' && (
                            <Button variant="default" size="sm" className="bg-blue-600">
                              Approve
                            </Button>
                          )}
                          {returnItem.status === 'APPROVED' && returnItem.refund_status === 'PENDING' && (
                            <Button variant="default" size="sm" className="bg-green-600">
                              Process Refund
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
              <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Returns Found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `No ${statusFilter.toLowerCase()} returns` : 'No purchase returns yet'}
              </p>
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create First Return
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
