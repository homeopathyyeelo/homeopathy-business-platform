'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface Anomaly {
    type: string
    severity: string
    title: string
    description: string
    value: number
    expected: number
    deviation: number
    detected_at: string
}

export default function AnomalyDetectionCard() {
    const { data, error, isLoading } = useSWR<{ success: boolean, data: Anomaly[] }>(
        '/api/erp/ai/anomalies',
        fetcher,
        {
            refreshInterval: 30000,
            fallbackData: { success: true, data: [] },
            shouldRetryOnError: false
        }
    )

    const anomalies = data?.data || []

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-800 border-red-300'
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300'
            case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            default: return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getSeverityIcon = (severity: string) => {
        if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-red-600" />
        if (severity === 'medium') return <Activity className="w-4 h-4 text-orange-600" />
        return <Activity className="w-4 h-4 text-yellow-600" />
    }

    const getTypeIcon = (type: string) => {
        if (type === 'sales') return '💰'
        if (type === 'inventory') return '📦'
        if (type === 'system') return '⚙️'
        return '📊'
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Anomaly Detection
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                    </div>
                ) : anomalies.length > 0 ? (
                    <div className="space-y-3">
                        {anomalies.slice(0, 3).map((anomaly, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getTypeIcon(anomaly.type)}</span>
                                        {getSeverityIcon(anomaly.severity)}
                                        <p className="text-sm font-semibold">{anomaly.title}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {anomaly.severity}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-700 mb-2">{anomaly.description}</p>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                        {anomaly.deviation > 0 ? (
                                            <TrendingUp className="w-3 h-3 text-red-600" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-green-600" />
                                        )}
                                        <span className="font-medium">
                                            {Math.abs(anomaly.deviation).toFixed(0)}% deviation
                                        </span>
                                    </div>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-600">
                                        Expected: {anomaly.expected.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Activity className="w-12 h-12 text-green-500 mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-gray-500">No anomalies detected</p>
                        <p className="text-xs text-gray-400 mt-1">All systems operating normally</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
