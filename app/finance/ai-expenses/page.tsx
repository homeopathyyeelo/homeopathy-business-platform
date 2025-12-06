'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Brain, Check, Sparkles, Tag } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils'

interface CategoryResult {
    category: string
    confidence: number
    reasoning: string
    suggested_tags: string[]
}

export default function AIExpensesPage() {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<CategoryResult | null>(null)

    const handleCategorize = async () => {
        if (!description) return

        setLoading(true)
        try {
            const res = await authFetch('/api/ai/finance/categorize', {
                method: 'POST',
                body: JSON.stringify({
                    description,
                    amount: parseFloat(amount) || 0
                })
            })
            const data = await res.json()
            if (data.success) {
                setResult(data.data)
            }
        } catch (error) {
            console.error('Failed to categorize:', error)
        } finally {
            setLoading(false)
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200'
        if (confidence >= 0.7) return 'bg-blue-100 text-blue-800 border-blue-200'
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 rounded-lg">
                    <Brain className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Expense Categorizer</h1>
                    <p className="text-gray-500 mt-1">Automatically categorize expenses using AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>New Expense Entry</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g., Uber ride to client meeting"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleCategorize}
                            disabled={loading || !description}
                        >
                            {loading ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Auto-Categorize
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className={`transition-all duration-300 ${result ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4'}`}>
                    <CardHeader>
                        <CardTitle>AI Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Suggested Category</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gray-900">{result.category}</span>
                                        <Badge variant="outline" className={getConfidenceColor(result.confidence)}>
                                            {(result.confidence * 100).toFixed(0)}% Confidence
                                        </Badge>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-indigo-500" />
                                        AI Reasoning
                                    </p>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {result.reasoning}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Suggested Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.suggested_tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full border-green-200 hover:bg-green-50 text-green-700">
                                    <Check className="w-4 h-4 mr-2" />
                                    Apply Category
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                <Brain className="w-16 h-16 mb-4 opacity-20" />
                                <p>Enter expense details to see AI analysis</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Examples */}
            <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Try these examples</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        "Lunch with potential client at Saravana Bhavan",
                        "Monthly AWS server subscription",
                        "Uber ride to airport for conference"
                    ].map((text, i) => (
                        <button
                            key={i}
                            className="text-left p-4 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm text-gray-600"
                            onClick={() => {
                                setDescription(text)
                                setAmount((Math.random() * 2000 + 500).toFixed(2))
                            }}
                        >
                            "{text}"
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
