'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, ShoppingCart, AlertTriangle, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Suggestion {
  product_id: string
  product_name: string
  current_stock: number
  avg_daily_sales: number
  days_until_stockout: number
  suggested_qty: number
  estimated_cost: number
  confidence: number
  priority: string
  reorder_point: number
  safety_stock: number
  vendor_name: string
  lead_time_days: number
}

export default function AIReorderPage() {
  const { data, isLoading, mutate } = useSWR<{ success: boolean, data: Suggestion[], count: number }>(
    '/api/erp/purchases/ai-reorder/suggestions',
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: statsData } = useSWR<{ success: boolean, data: any }>(
    '/api/erp/purchases/ai-reorder/stats',
    fetcher
  )

  const suggestions = data?.data || []
  const stats = statsData?.data || {}

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300'
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'LOW': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'MEDIUM': return <TrendingUp className="w-4 h-4 text-orange-600" />
      default: return <ShoppingCart className="w-4 h-4 text-yellow-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-500'
    if (confidence >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-500" />
            AI Reorder Suggestions
          </h1>
          <p className="text-gray-600 mt-1">Smart inventory replenishment powered by AI</p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh Suggestions
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_suggestions || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high_priority_items || 0}</div>
            <p className="text-xs text-red-600 mt-1">Critical stock levels</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Medium Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.medium_priority_items || 0}</div>
            <p className="text-xs text-orange-600 mt-1">Restock soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(stats.total_estimated_cost || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Brain className="w-12 h-12 text-indigo-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-indigo-900 mb-2">How AI Reorder Works</h3>
              <ul className="space-y-1 text-sm text-indigo-800">
                <li>• Analyzes last 90 days of sales data to calculate average daily consumption</li>
                <li>• Predicts stockout dates based on current inventory levels</li>
                <li>• Suggests optimal reorder quantities considering lead time and safety stock</li>
                <li>• Prioritizes suggestions based on urgency and business impact</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Analyzing inventory and generating suggestions...</p>
              </div>
            </CardContent>
          </Card>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <Card key={suggestion.product_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(suggestion.priority)}
                          {suggestion.priority}
                        </span>
                      </Badge>
                      <h3 className="text-lg font-semibold">{suggestion.product_name}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="text-lg font-semibold">{suggestion.current_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Daily Sales</p>
                        <p className="text-lg font-semibold">{suggestion.avg_daily_sales.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Days Until Stockout</p>
                        <p className={`text-lg font-semibold ${suggestion.days_until_stockout <= 7 ? 'text-red-600' :
                            suggestion.days_until_stockout <= 14 ? 'text-orange-600' :
                              'text-green-600'
                          }`}>
                          {suggestion.days_until_stockout} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reorder Point</p>
                        <p className="text-lg font-semibold">{suggestion.reorder_point}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Suggested Quantity</p>
                        <p className="text-xl font-bold text-indigo-600">{suggestion.suggested_qty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estimated Cost</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(suggestion.estimated_cost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vendor</p>
                        <p className="text-sm font-medium">{suggestion.vendor_name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lead Time</p>
                        <p className="text-sm font-medium">{suggestion.lead_time_days} days</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">AI Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getConfidenceColor(suggestion.confidence)}`}
                            style={{ width: `${suggestion.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Generate PO
                    </Button>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reorder Suggestions</h3>
                <p className="text-gray-500 mb-4">
                  All products are well-stocked! AI will notify you when reordering is needed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
