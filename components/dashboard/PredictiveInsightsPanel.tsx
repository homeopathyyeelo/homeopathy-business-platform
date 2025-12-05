'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, Users, Package } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Prediction {
    type: string
    title: string
    description: string
    confidence: number
    value: number
    timeline: string
}

export default function PredictiveInsightsPanel() {
    const { data, error, isLoading } = useSWR<{ success: boolean, data: Prediction[] }>(
        '/api/erp/ai/predictions',
        fetcher,
        {
            refreshInterval: 60000,
            fallbackData: { success: true, data: [] },
            shouldRetryOnError: false
        }
    )

    const predictions = data?.data || []

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'sales_forecast': return <TrendingUp className="w-4 h-4 text-green-600" />
            case 'restock': return <Package className="w-4 h-4 text-orange-600" />
            case 'customer_behavior': return <Users className="w-4 h-4 text-blue-600" />
            default: return <Target className="w-4 h-4 text-purple-600" />
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-500'
        if (confidence >= 0.6) return 'bg-yellow-500'
        return 'bg-orange-500'
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-purple-500" />
                    Predictive Insights
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                    </div>
                ) : predictions.length > 0 ? (
                    <div className="space-y-3">
                        {predictions.map((prediction, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(prediction.type)}
                                        <p className="text-sm font-semibold">{prediction.title}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {prediction.timeline.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{prediction.description}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Confidence:</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getConfidenceColor(prediction.confidence)}`}
                                            style={{ width: `${prediction.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium">
                                        {(prediction.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-gray-500">No predictions available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
