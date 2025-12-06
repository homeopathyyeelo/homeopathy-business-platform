'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Package, Calendar } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface DemandForecast {
    product_id: string
    product_name: string
    current_stock: number
    predicted_demand: number
    stockout_risk: string
    days_until_stockout: number
    seasonality_score: number
    trend: string
}

export default function DemandForecastPage() {
    const { data, isLoading, mutate } = useSWR<{ success: boolean, data: DemandForecast[] }>(
        '/api/ai/inventory/demand-forecast',
        fetcher,
        { refreshInterval: 60000 }
    )

    const forecasts = data?.data || []

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
            case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'UP': return <TrendingUp className="w-4 h-4 text-green-600" />
            case 'DOWN': return <TrendingDown className="w-4 h-4 text-red-600" />
            default: return <Minus className="w-4 h-4 text-gray-400" />
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                        Demand Forecasting
                    </h1>
                    <p className="text-gray-600 mt-1">AI-powered inventory demand predictions</p>
                </div>
                <Button variant="outline" onClick={() => mutate()}>
                    Refresh Forecasts
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Products Analyzed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{forecasts.length}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">High Stockout Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700">
                            {forecasts.filter(f => f.stockout_risk === 'HIGH').length}
                        </div>
                        <p className="text-xs text-red-600 mt-1">Products needing immediate attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Trending Up</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                            {forecasts.filter(f => f.trend === 'UP').length}
                        </div>
                        <p className="text-xs text-green-600 mt-1">Products with increasing demand</p>
                    </CardContent>
                </Card>
            </div>

            {/* Forecast Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Demand Forecasts (Next 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Analyzing sales patterns...</p>
                        </div>
                    ) : forecasts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-4 font-semibold text-gray-600">Product</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Current Stock</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Predicted Demand</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Trend</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Days Until Stockout</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Risk Level</th>
                                        <th className="text-center p-4 font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecasts.map((item) => (
                                        <tr key={item.product_id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{item.product_name}</div>
                                                {item.seasonality_score > 1.1 && (
                                                    <span className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" /> High Seasonality
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="font-semibold text-gray-700">{item.current_stock}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="font-bold text-blue-600">{item.predicted_demand}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center items-center gap-1">
                                                    {getTrendIcon(item.trend)}
                                                    <span className="text-sm text-gray-600">{item.trend}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`font-medium ${item.days_until_stockout <= 7 ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {item.days_until_stockout > 365 ? '> 1 Year' : `${item.days_until_stockout} Days`}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant="outline" className={getRiskColor(item.stockout_risk)}>
                                                    {item.stockout_risk}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.stockout_risk === 'HIGH' && (
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                        Reorder
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>No demand data available yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
