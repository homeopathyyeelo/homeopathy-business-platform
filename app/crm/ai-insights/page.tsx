'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Users, Heart, TrendingUp, AlertTriangle, MessageSquare, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils'

const fetcher = (url: string) => authFetch(url).then(r => r.json())

interface CLVPrediction {
    customer_id: string
    customer_name: string
    current_value: number
    predicted_clv: number
    churn_risk: number
    next_purchase_date: string
    customer_segment: string
}

interface SentimentResult {
    text: string
    sentiment: string
    score: number
    keywords: string[]
    actionable: boolean
}

export default function CRMAIInsightsPage() {
    // CLV State
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [clvLoading, setClvLoading] = useState(false)
    const [clvResult, setClvResult] = useState<CLVPrediction | null>(null)

    // Sentiment State
    const [feedbackText, setFeedbackText] = useState('')
    const [sentimentLoading, setSentimentLoading] = useState(false)
    const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null)

    // Fetch customers for dropdown (simplified)
    const { data: customersData } = useSWR('/api/customers?limit=20', fetcher)
    const customers = customersData?.data || []

    const handlePredictCLV = async () => {
        if (!selectedCustomerId) return
        setClvLoading(true)
        try {
            const res = await authFetch('/api/ai/crm/clv-predict', {
                method: 'POST',
                body: JSON.stringify({ customer_id: selectedCustomerId })
            })
            const data = await res.json()
            if (data.success) {
                setClvResult(data.data)
            }
        } catch (error) {
            console.error('Failed to predict CLV:', error)
        } finally {
            setClvLoading(false)
        }
    }

    const handleAnalyzeSentiment = async () => {
        if (!feedbackText) return
        setSentimentLoading(true)
        try {
            const res = await authFetch('/api/ai/crm/sentiment-analyze', {
                method: 'POST',
                body: JSON.stringify({ text: feedbackText })
            })
            const data = await res.json()
            if (data.success) {
                setSentimentResult(data.data)
            }
        } catch (error) {
            console.error('Failed to analyze sentiment:', error)
        } finally {
            setSentimentLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Positive': return 'bg-green-100 text-green-800 border-green-200'
            case 'Negative': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-100 rounded-lg">
                    <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">CRM AI Insights</h1>
                    <p className="text-gray-500 mt-1">Understand your customers better with AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CLV Prediction Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold">Customer Lifetime Value (CLV)</h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Predict Future Value</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Customer</Label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handlePredictCLV}
                                disabled={clvLoading || !selectedCustomerId}
                            >
                                {clvLoading ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Predicting...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Predict CLV
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {clvResult && (
                        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{clvResult.customer_name}</h3>
                                        <Badge variant="outline" className="mt-1 bg-white">
                                            {clvResult.customer_segment}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Churn Risk</p>
                                        <div className={`text-lg font-bold ${clvResult.churn_risk > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(clvResult.churn_risk * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-lg border">
                                        <p className="text-xs text-gray-500">Current Value</p>
                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(clvResult.current_value)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                                        <p className="text-xs text-blue-600 font-medium">Predicted CLV</p>
                                        <p className="text-xl font-bold text-blue-700">{formatCurrency(clvResult.predicted_clv)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded border">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    Next expected purchase: <span className="font-medium">{new Date(clvResult.next_purchase_date).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sentiment Analysis Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-semibold">Sentiment Analysis</h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Analyze Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Customer Feedback / Message</Label>
                                <Textarea
                                    placeholder="Paste customer email, review, or chat message here..."
                                    className="h-32"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={handleAnalyzeSentiment}
                                disabled={sentimentLoading || !feedbackText}
                            >
                                {sentimentLoading ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Analyze Sentiment
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {sentimentResult && (
                        <Card className={`border-l-4 ${sentimentResult.sentiment === 'Positive' ? 'border-l-green-500' : sentimentResult.sentiment === 'Negative' ? 'border-l-red-500' : 'border-l-gray-500'}`}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Badge className={getSentimentColor(sentimentResult.sentiment)}>
                                        {sentimentResult.sentiment}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-500">
                                        Score: {sentimentResult.score.toFixed(2)}
                                    </span>
                                </div>

                                {sentimentResult.actionable && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium">
                                        <AlertTriangle className="w-4 h-4" />
                                        Action Required: This feedback needs attention.
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Detected Keywords</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sentimentResult.keywords.map((word, i) => (
                                            <Badge key={i} variant="secondary" className="bg-gray-100">
                                                {word}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
