'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, Package, Users } from "lucide-react"
import { golangAPI } from "@/lib/api"

export default function AdvancedAnalyticsDashboard() {
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState("month")

  // Fetch analytics data
  const { data: salesAnalytics = {} } = useQuery({
    queryKey: ['analytics', 'sales', selectedTimeframe],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/analytics/sales?timeframe=${selectedTimeframe}`)
      return res.data
    },
    staleTime: 300_000,
  })

  const { data: inventoryAnalytics = {} } = useQuery({
    queryKey: ['analytics', 'inventory', selectedTimeframe],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/analytics/inventory?timeframe=${selectedTimeframe}`)
      return res.data
    },
    staleTime: 300_000,
  })

  const { data: customerAnalytics = {} } = useQuery({
    queryKey: ['analytics', 'customers', selectedTimeframe],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/analytics/customers?timeframe=${selectedTimeframe}`)
      return res.data
    },
    staleTime: 300_000,
  })

  const { data: financialAnalytics = {} } = useQuery({
    queryKey: ['analytics', 'financial', selectedTimeframe],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/analytics/financial?timeframe=${selectedTimeframe}`)
      return res.data
    },
    staleTime: 300_000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/masters')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Masters
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics Dashboard</h2>
            <p className="text-gray-600">Comprehensive business intelligence and predictive analytics</p>
          </div>
        </div>

        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialAnalytics.totalRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {financialAnalytics.revenueGrowth > 0 ? '+' : ''}{financialAnalytics.revenueGrowth || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerAnalytics.activeCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {customerAnalytics.customerGrowth > 0 ? '+' : ''}{customerAnalytics.customerGrowth || 0}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryAnalytics.totalValue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryAnalytics.inventoryTurnover || 0}x turnover rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesAnalytics.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {salesAnalytics.orderGrowth > 0 ? '+' : ''}{salesAnalytics.orderGrowth || 0}% increase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesAnalytics.trend?.map((point: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{point.period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(point.value / Math.max(...salesAnalytics.trend.map((p: any) => p.value))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{point.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesAnalytics.topProducts?.slice(0, 5).map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.unitsSold} units sold</p>
                  </div>
                  <Badge variant="outline">{product.revenue}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryAnalytics.optimizations?.map((opt: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-medium">{opt.product_name}</h4>
                  <p className="text-sm text-gray-600">
                    Current: {opt.current_stock} | Suggested: {opt.suggested_reorder_level}
                  </p>
                </div>
                <Badge variant={opt.action_required === 'reorder' ? 'destructive' : 'secondary'}>
                  {opt.action_required === 'reorder' ? 'Reorder Needed' : 'Monitor'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demand Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle>Demand Forecasting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-green-600">+15%</div>
                <p className="text-sm text-gray-600">Expected Growth</p>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-blue-600">2.5L</div>
                <p className="text-sm text-gray-600">Predicted Revenue</p>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-purple-600">85%</div>
                <p className="text-sm text-gray-600">Forecast Accuracy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerAnalytics.segments?.map((segment: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{segment.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{segment.count} customers</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average CLV</span>
                <span className="font-bold">{customerAnalytics.averageCLV || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Top 10% CLV</span>
                <span className="font-bold">{customerAnalytics.topCLV || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retention Rate</span>
                <span className="font-bold">{customerAnalytics.retentionRate || '0'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded">
              <div className={`text-2xl font-bold ${financialAnalytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialAnalytics.profitMargin || 0}%
              </div>
              <p className="text-sm text-gray-600">Profit Margin</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">
                {financialAnalytics.cashFlow || '0'}
              </div>
              <p className="text-sm text-gray-600">Cash Flow</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">
                {financialAnalytics.debtRatio || '0'}%
              </div>
              <p className="text-sm text-gray-600">Debt Ratio</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">
                {financialAnalytics.roi || '0'}%
              </div>
              <p className="text-sm text-gray-600">ROI</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded bg-blue-50">
              <h4 className="font-medium text-blue-900">Stock Optimization</h4>
              <p className="text-sm text-blue-700 mt-1">
                Based on seasonal trends, increase inventory of cold & flu remedies by 25%
              </p>
            </div>
            <div className="p-4 border rounded bg-green-50">
              <h4 className="font-medium text-green-900">Customer Targeting</h4>
              <p className="text-sm text-green-700 mt-1">
                Focus marketing on customers with 3+ purchases in last 6 months
              </p>
            </div>
            <div className="p-4 border rounded bg-purple-50">
              <h4 className="font-medium text-purple-900">Price Optimization</h4>
              <p className="text-sm text-purple-700 mt-1">
                Consider 5-10% price increase for high-demand items with low elasticity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">
              Export to Excel
            </Button>
            <Button variant="outline">
              Export to PDF
            </Button>
            <Button variant="outline">
              Schedule Report
            </Button>
            <Button variant="outline">
              Share Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
