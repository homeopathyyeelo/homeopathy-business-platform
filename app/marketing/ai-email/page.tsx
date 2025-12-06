'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Sparkles, Copy, Check, Wand2 } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils'

interface EmailDraft {
    subject: string
    body: string
    tone: string
}

export default function AIEmailPage() {
    const [customerName, setCustomerName] = useState('')
    const [purpose, setPurpose] = useState('welcome')
    const [tone, setTone] = useState('professional')
    const [keyPoints, setKeyPoints] = useState('')
    const [loading, setLoading] = useState(false)
    const [draft, setDraft] = useState<EmailDraft | null>(null)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        if (!customerName) return

        setLoading(true)
        try {
            const res = await authFetch('/api/ai/marketing/email-generate', {
                method: 'POST',
                body: JSON.stringify({
                    customer_name: customerName,
                    purpose,
                    tone,
                    key_points: keyPoints.split('\n').filter(p => p.trim())
                })
            })
            const data = await res.json()
            if (data.success) {
                setDraft(data.data)
                setCopied(false)
            }
        } catch (error) {
            console.error('Failed to generate email:', error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!draft) return
        const text = `Subject: ${draft.subject}\n\n${draft.body}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 rounded-lg">
                    <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Email Generator</h1>
                    <p className="text-gray-500 mt-1">Create personalized, engaging emails in seconds</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-purple-500" />
                            Email Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                                placeholder="e.g., John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Purpose</Label>
                                <Select value={purpose} onValueChange={setPurpose}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="welcome">Welcome Message</SelectItem>
                                        <SelectItem value="follow_up">Follow Up</SelectItem>
                                        <SelectItem value="promotion">Special Offer</SelectItem>
                                        <SelectItem value="reminder">Appointment Reminder</SelectItem>
                                        <SelectItem value="feedback">Request Feedback</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tone</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                                        <SelectItem value="formal">Formal</SelectItem>
                                        <SelectItem value="empathetic">Empathetic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Key Points to Include (Optional)</Label>
                            <Textarea
                                placeholder="Enter key points, one per line..."
                                className="h-32"
                                value={keyPoints}
                                onChange={(e) => setKeyPoints(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Add specific details you want the AI to mention.</p>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={handleGenerate}
                            disabled={loading || !customerName}
                        >
                            {loading ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Magic...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Email
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className={`h-full flex flex-col transition-all duration-300 ${draft ? 'opacity-100' : 'opacity-50'}`}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Generated Draft</CardTitle>
                        {draft && (
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className={copied ? 'text-green-600 border-green-200' : ''}>
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1">
                        {draft ? (
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Subject Line</Label>
                                    <div className="p-3 bg-gray-50 rounded-md border text-gray-900 font-medium">
                                        {draft.subject}
                                    </div>
                                </div>

                                <div className="space-y-2 flex-1 flex flex-col">
                                    <Label className="text-gray-500">Email Body</Label>
                                    <div className="p-4 bg-gray-50 rounded-md border text-gray-800 whitespace-pre-wrap flex-1 min-h-[300px] leading-relaxed">
                                        {draft.body}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
                                    <Button variant="outline">Regenerate</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Now
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed rounded-lg m-4">
                                <Mail className="w-16 h-16 mb-4 opacity-20" />
                                <p>Fill in the details to generate your email</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
