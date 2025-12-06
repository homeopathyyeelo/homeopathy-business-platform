'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Activity, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils'

interface AttritionResult {
    employee_id: string
    employee_name: string
    attrition_risk: number
    risk_factors: string[]
    retention_strategy: string
}

interface ScreeningResult {
    candidate_name: string
    match_score: number
    matched_skills: string[]
    missing_skills: string[]
    summary: string
}

export default function HRAIAnalyticsPage() {
    // Attrition State
    const [employeeId, setEmployeeId] = useState('')
    const [attritionLoading, setAttritionLoading] = useState(false)
    const [attritionResult, setAttritionResult] = useState<AttritionResult | null>(null)

    // Resume State
    const [resumeText, setResumeText] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [screeningLoading, setScreeningLoading] = useState(false)
    const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null)

    const handlePredictAttrition = async () => {
        if (!employeeId) return
        setAttritionLoading(true)
        try {
            const res = await authFetch('/api/ai/hr/attrition-predict', {
                method: 'POST',
                body: JSON.stringify({ employee_id: employeeId })
            })
            const data = await res.json()
            if (data.success) {
                setAttritionResult(data.data)
            }
        } catch (error) {
            console.error('Failed to predict attrition:', error)
        } finally {
            setAttritionLoading(false)
        }
    }

    const handleScreenResume = async () => {
        if (!resumeText || !jobDescription) return
        setScreeningLoading(true)
        try {
            const res = await authFetch('/api/ai/hr/resume-screen', {
                method: 'POST',
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            })
            const data = await res.json()
            if (data.success) {
                setScreeningResult(data.data)
            }
        } catch (error) {
            console.error('Failed to screen resume:', error)
        } finally {
            setScreeningLoading(false)
        }
    }

    const getRiskColor = (risk: number) => {
        if (risk > 0.7) return 'text-red-600'
        if (risk > 0.4) return 'text-orange-600'
        return 'text-green-600'
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 50) return 'text-orange-600'
        return 'text-red-600'
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-100 rounded-lg">
                    <Users className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">HR AI Analytics</h1>
                    <p className="text-gray-500 mt-1">Smart talent management and acquisition</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attrition Prediction Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-6 h-6 text-red-600" />
                        <h2 className="text-xl font-semibold">Attrition Risk Prediction</h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Check Employee Risk</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Employee ID</Label>
                                <Input
                                    placeholder="e.g., EMP001"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">Try 'EMP001' (High Risk) or 'EMP002' (Low Risk)</p>
                            </div>

                            <Button
                                className="w-full bg-red-600 hover:bg-red-700"
                                onClick={handlePredictAttrition}
                                disabled={attritionLoading || !employeeId}
                            >
                                {attritionLoading ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Predict Risk
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {attritionResult && (
                        <Card className={`border-l-4 ${attritionResult.attrition_risk > 0.5 ? 'border-l-red-500' : 'border-l-green-500'}`}>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{attritionResult.employee_name}</h3>
                                        <p className="text-sm text-gray-500">ID: {attritionResult.employee_id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Attrition Probability</p>
                                        <div className={`text-2xl font-bold ${getRiskColor(attritionResult.attrition_risk)}`}>
                                            {(attritionResult.attrition_risk * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                {attritionResult.risk_factors.length > 0 && (
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                        <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Risk Factors Detected
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                            {attritionResult.risk_factors.map((factor, i) => (
                                                <li key={i}>{factor}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Recommended Strategy</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                                        {attritionResult.retention_strategy}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Resume Screening Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold">Smart Resume Screening</h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Screen Candidate</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Job Description</Label>
                                <Textarea
                                    placeholder="Paste job description here..."
                                    className="h-24"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Resume Text</Label>
                                <Textarea
                                    placeholder="Paste resume text here..."
                                    className="h-32"
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleScreenResume}
                                disabled={screeningLoading || !resumeText || !jobDescription}
                            >
                                {screeningLoading ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Screening...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Screen Resume
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {screeningResult && (
                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{screeningResult.candidate_name}</h3>
                                        <p className="text-sm text-gray-500">{screeningResult.summary}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Match Score</p>
                                        <div className={`text-2xl font-bold ${getScoreColor(screeningResult.match_score)}`}>
                                            {screeningResult.match_score.toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Matched Skills
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {screeningResult.matched_skills.map((skill, i) => (
                                                <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Missing Skills
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {screeningResult.missing_skills.map((skill, i) => (
                                                <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
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
