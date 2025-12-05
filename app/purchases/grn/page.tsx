'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Plus, Calendar, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface GRN {
  id: string
  grn_no: string
  order_no: string
  received_date: string
  received_by_name: string
  status: string
  qc_status: string
  notes: string
}

export default function GRNPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useSWR<{ success: boolean, data: GRN[], total: number }>(
    `/api/erp/purchases/grn${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: statsData } = useSWR<{ success: boolean, data: any }>(
    '/api/erp/purchases/grn/stats',
    fetcher
  )

  const grns = data?.data || []
  const stats = statsData?.data || {}

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQCStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'PARTIAL': return 'bg-orange-100 text-orange-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQCIcon = (status: string) => {
    switch (status) {
      case 'PASSED': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-600" />
      case 'PARTIAL': return <AlertCircle className="w-4 h-4 text-orange-600" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-purple-500" />
            Goods Receipt Note (GRN)
          </h1>
          <p className="text-gray-600 mt-1">Track received inventory and quality checks</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New GRN
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total GRNs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_grns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_grns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved_grns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">QC Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.qc_passed_grns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">QC Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.qc_failed_grns || 0}</div>
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
                  placeholder="Search by GRN number or PO..."
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading GRNs...</p>
            </div>
          ) : grns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">GRN No</th>
                    <th className="text-left p-3 font-semibold">PO Number</th>
                    <th className="text-left p-3 font-semibold">Received Date</th>
                    <th className="text-left p-3 font-semibold">Received By</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">QC Status</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grns.map((grn) => (
                    <tr key={grn.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{grn.grn_no}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">{grn.order_no || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{formatDate(grn.received_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{grn.received_by_name || 'Unknown'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(grn.status)}>
                          {grn.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getQCIcon(grn.qc_status)}
                          <Badge className={getQCStatusColor(grn.qc_status)}>
                            {grn.qc_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          {grn.status === 'PENDING' && (
                            <Button variant="default" size="sm" className="bg-green-600">
                              Approve
                            </Button>
                          )}
                          {grn.qc_status === 'PENDING' && (
                            <Button variant="outline" size="sm">
                              QC Check
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
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No GRNs Found</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `No ${statusFilter.toLowerCase()} GRNs` : 'No goods receipt notes yet'}
              </p>
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create First GRN
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
