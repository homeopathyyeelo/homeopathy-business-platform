'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, Code, GitBranch, Play, X, Zap } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { authFetch } from '@/lib/api/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

export default function BugDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bug, setBug] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetchBug()
  }, [params.id])

  const fetchBug = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/system/bugs/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setBug(data.data)
      }
    } catch (error) {
      console.error('Error fetching bug:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveFix = async () => {
    setApplying(true)
    try {
      const response = await authFetch(`${API_URL}/api/v1/system/bugs/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      })
      
      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Fix Approved',
          description: 'AI fix has been applied and tests are running...'
        })
        fetchBug()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading bug details...</div>
  }

  if (!bug) {
    return <div className="p-6">Bug not found</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            {bug.bug_code}
          </h1>
          <p className="text-gray-600 mt-1">{bug.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {bug.status === 'open' && bug.ai_analysis?.fix_suggestion && (
            <Button onClick={handleApproveFix} disabled={applying}>
              <Zap className="w-4 h-4 mr-2" />
              {applying ? 'Applying...' : 'Approve & Apply Fix'}
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Service</div>
            <div className="text-lg font-semibold">{bug.service_name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Severity</div>
            <Badge className={`mt-1 ${
              bug.severity === 'critical' ? 'bg-red-500' :
              bug.severity === 'high' ? 'bg-orange-500' :
              bug.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}>
              {bug.severity.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Status</div>
            <Badge className="mt-1">{bug.status.replace('_', ' ').toUpperCase()}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Created</div>
            <div className="text-sm font-semibold">{new Date(bug.created_at).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="fix">Fix Suggestion</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2">Error Message:</div>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {bug.details}
                </pre>
              </div>
              {bug.stack_trace && (
                <div>
                  <div className="text-sm font-semibold mb-2">Stack Trace:</div>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                    {bug.stack_trace}
                  </pre>
                </div>
              )}
              {bug.http_status && (
                <div>
                  <div className="text-sm font-semibold mb-2">HTTP Status:</div>
                  <Badge variant="destructive">{bug.http_status}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Root Cause Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bug.ai_analysis ? (
                <>
                  <div>
                    <div className="text-sm font-semibold mb-2">Root Cause:</div>
                    <p className="text-sm">{bug.ai_analysis.root_cause || 'Analyzing...'}</p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">AI Confidence:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(bug.ai_analysis.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {((bug.ai_analysis.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Impact Assessment:</div>
                    <p className="text-sm">{bug.ai_analysis.impact || 'Analyzing impact...'}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  AI analysis not yet available. Triggering analysis...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                AI-Generated Fix Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bug.ai_analysis?.fix_suggestion ? (
                <>
                  <div>
                    <div className="text-sm font-semibold mb-2">Suggested Action:</div>
                    <p className="text-sm">{bug.ai_analysis.fix_suggestion}</p>
                  </div>
                  {bug.ai_analysis.diff_patch && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Code Diff:</div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-auto">
                        {bug.ai_analysis.diff_patch}
                      </pre>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold mb-2">Files to Modify:</div>
                    <ul className="list-disc list-inside text-sm">
                      {(bug.ai_analysis.files_to_modify || []).map((file: string, i: number) => (
                        <li key={i} className="font-mono">{file}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Test Command:</div>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {bug.ai_analysis.test_command || 'go test ./...'}
                    </code>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Review Required:</strong> This fix will be applied automatically after approval.
                      Ensure you've reviewed the changes and they align with your codebase standards.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No fix suggestion available yet. AI is analyzing...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Bug Detected</div>
                    <div className="text-xs text-gray-500">{new Date(bug.created_at).toLocaleString()}</div>
                  </div>
                </div>
                {bug.ai_analysis && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">AI Analysis Completed</div>
                      <div className="text-xs text-gray-500">Confidence: {((bug.ai_analysis.confidence || 0) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                )}
                {bug.status === 'fixed' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Bug Fixed</div>
                      <div className="text-xs text-gray-500">{bug.fixed_at && new Date(bug.fixed_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
