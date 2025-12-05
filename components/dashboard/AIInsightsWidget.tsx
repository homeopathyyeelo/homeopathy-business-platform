'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface NLInsight {
    category: string
    text: string
    priority: number
    icon: string
}

export default function AIInsightsWidget() {
    const { data, error, isLoading } = useSWR<{ success: boolean, data: NLInsight[] }>(
        '/api/erp/ai/nl-insights',
        fetcher,
        {
            refreshInterval: 30000,
            fallbackData: { success: true, data: [] },
            shouldRetryOnError: false
        }
    )

    const insights = data?.data || []

    // Sort by priority
    const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority).slice(0, 3)

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'sales': return 'bg-green-100 text-green-700 border-green-300'
            case 'inventory': return 'bg-orange-100 text-orange-700 border-orange-300'
            case 'customer': return 'bg-blue-100 text-blue-700 border-blue-300'
            case 'system': return 'bg-purple-100 text-purple-700 border-purple-300'
            default: return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Insights
                    <Sparkles className="w-4 h-4 text-yellow-500 ml-auto" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                    </div>
                ) : sortedInsights.length > 0 ? (
                    <div className="space-y-3">
                        {sortedInsights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg border ${getCategoryColor(insight.category)}`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-lg flex-shrink-0">{insight.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-tight">{insight.text}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {insight.category}
                                            </Badge>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: Math.min(insight.priority, 10) }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 w-1.5 rounded-full ${i < insight.priority ? 'bg-current' : 'bg-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No insights available at the moment
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
