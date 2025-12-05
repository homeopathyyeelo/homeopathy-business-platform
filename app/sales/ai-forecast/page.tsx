'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'

const fetcher = (url: string, body: any) => authFetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
}).then(r => r.json())

interface ForecastData {
    period: string
    total_revenue: number
    growth_rate: number
    confidence_score: number
    top_products: ProductForecast[]
    daily_forecasts: DailyForecast[]
    insights: string[]
}

interface ProductForecast {
    product_id: string
    product_name: string
    predicted_sales: number
    predicted_revenue: number
    trend: string
}

interface DailyForecast {
    date: string
    amount: number
}

export default function SalesForecastPage() {
    const [days, setDays] = useState(30)

    const { data, isLoading, mutate } = useSWR<{ success: boolean, data: ForecastData }>(
        ['/api/ai/sales/forecast', days],
        ([url, d]) => fetcher(url, { days: d }),
        { revalidateOnFocus: false }
    )

    const forecast = data?.data

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-indigo-500" />
                        AI Sales Forecast
                    </h1>
                    <p className="text-gray-600 mt-1">Predictive analytics for future revenue</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={days === 30 ? 'default' : 'outline'}
                        onClick={() => setDays(30)}
                    >
                        30 Days
                    </Button>
                    <Button
                        variant={days === 60 ? 'default' : 'outline'}
                        onClick={() => setDays(60)}
                    >
                        60 Days
                    </Button>
                    <Button
                        variant={days === 90 ? 'default' : 'outline'}
                        onClick={() => setDays(90)}
                    >
                        90 Days
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                            <p className="text-gray-500">Generating AI forecast...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : forecast ? (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Projected Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-700">
                                    {formatCurrency(forecast.total_revenue)}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Next {days} days</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Expected Growth</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className={`text-3xl font-bold ${forecast.growth_rate >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {forecast.growth_rate >= 0 ? '+' : ''}{(forecast.growth_rate * 100).toFixed(1)}%
                                    </div>
                                    {forecast.growth_rate >= 0 ? (
                                        <ArrowUpRight className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Daily average growth</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">AI Confidence</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-700">
                                    {(forecast.confidence_score * 100).toFixed(0)}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-purple-600 h-1.5 rounded-full"
                                        style={{ width: `${forecast.confidence_score * 100}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Forecast Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Revenue Forecast Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={forecast.daily_forecasts}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                tickFormatter={(value) => `₹${value / 1000}k`}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Insights & Top Products */}
                        <div className="space-y-6">
                            <Card className="bg-indigo-50 border-indigo-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-indigo-800">
                                        <Sparkles className="w-5 h-5" />
                                        AI Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {forecast.insights.map((insight, i) => (
                                            <li key={i} className="text-sm text-indigo-900 flex gap-2">
                                                <span className="text-indigo-500">•</span>
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle>Top Performing Products</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {forecast.top_products.map((product) => (
                                            <div key={product.product_id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <p className="font-medium truncate">{product.product_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Est. Sales: {product.predicted_sales.toFixed(0)} units
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-green-600">
                                                        {formatCurrency(product.predicted_revenue)}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        Trending Up
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    Failed to load forecast data.
                </div>
            )}
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>
            {children}
        </span>
    )
}
