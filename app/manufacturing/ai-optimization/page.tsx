'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Factory, Settings, Clock, Zap, AlertCircle, Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils'

interface OptimizationResult {
    batch_id: string
    product_name: string
    optimal_batch_size: number
    predicted_duration_hours: number
    resource_utilization: number
    bottleneck: string
    efficiency_score: number
    recommendations: string[]
}

export default function ManufacturingAIPage() {
    const [productId, setProductId] = useState('')
    const [targetQty, setTargetQty] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<OptimizationResult | null>(null)

    const handleOptimize = async () => {
        if (!productId) return
        setLoading(true)
        try {
            const res = await authFetch('/api/ai/manufacturing/optimize', {
                method: 'POST',
                body: JSON.stringify({
                    product_id: productId,
                    target_quantity: parseInt(targetQty) || 0
                })
            })
            const data = await res.json()
            if (data.success) {
                setResult(data.data)
            }
        } catch (error) {
            console.error('Failed to optimize production:', error)
        } finally {
            setLoading(false)
        }
    }

    const getEfficiencyColor = (score: number) => {
        if (score >= 0.9) return 'text-green-600'
        if (score >= 0.7) return 'text-blue-600'
        return 'text-orange-600'
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                    <Factory className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Production AI Optimizer</h1>
                    <p className="text-gray-500 mt-1">Maximize efficiency and minimize downtime</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-500" />
                            Batch Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Product ID</Label>
                            <Input
                                placeholder="e.g., PROD-123"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Target Quantity (Optional)</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 1000"
                                value={targetQty}
                                onChange={(e) => setTargetQty(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={handleOptimize}
                            disabled={loading || !productId}
                        >
                            {loading ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Run Optimization
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {result ? (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-600">Efficiency Score</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-3xl font-bold ${getEfficiencyColor(result.efficiency_score)}`}>
                                            {(result.efficiency_score * 100).toFixed(0)}%
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-600">Optimal Batch Size</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-700">
                                            {result.optimal_batch_size.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-blue-600 mt-1">Units</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-600">Est. Duration</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-purple-700">
                                            {result.predicted_duration_hours}h
                                        </div>
                                        <p className="text-xs text-purple-600 mt-1">Production time</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detailed Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Analysis & Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-3">Resource Utilization</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Overall Utilization</span>
                                                    <span className="font-bold">{result.resource_utilization}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${result.resource_utilization}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-100">
                                                <p className="text-xs text-red-600 font-medium mb-1">Identified Bottleneck</p>
                                                <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {result.bottleneck}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-3">AI Recommendations</h4>
                                            <ul className="space-y-2">
                                                {result.recommendations.map((rec, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                        <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed rounded-lg">
                            <Factory className="w-16 h-16 mb-4 opacity-20" />
                            <p>Enter product details to generate optimization plan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
