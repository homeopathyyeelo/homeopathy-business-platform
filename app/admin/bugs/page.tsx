'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Clock, Search, Bug, Code, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface BugReport {
  id: string
  bug_code: string
  service_name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  details: string
  http_status?: number
  status: 'open' | 'in_progress' | 'fixed' | 'auto_fixed'
  ai_analysis?: {
    root_cause?: string
    confidence?: number
    fix_suggestion?: string
  }
  created_at: string
  fixed_at?: string
}

interface BugSummary {
  total_bugs: number
  open_bugs: number
  in_progress: number
  fixed_bugs: number
  auto_fixed: number
  critical_count: number
  high_count: number
  avg_fix_time: string
}

export default function BugsAdminPage() {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [summary, setSummary] = useState<BugSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    fetchBugs()
    fetchSummary()
  }, [statusFilter, severityFilter, serviceFilter])

  const fetchBugs = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (severityFilter !== 'all') params.append('severity', severityFilter)
      if (serviceFilter !== 'all') params.append('service', serviceFilter)

      const response = await fetch(`${API_URL}/api/v1/system/bugs?${params}`)
      const data = await response.json()
      if (data.success) {
        setBugs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching bugs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/system/bugs/summary`)
      const data = await response.json()
      if (data.success) {
        setSummary(data.data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'fixed': return 'bg-green-100 text-green-800'
      case 'auto_fixed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBugs = bugs.filter(bug =>
    bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.bug_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.service_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-500" />
            System Bug Tracker & AI Self-Healing
          </h1>
          <p className="text-gray-600 mt-1">Automated bug detection and AI-powered fix suggestions</p>
        </div>
        <Button>
          <Code className="w-4 h-4 mr-2" />
          Trigger Bug Scan
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
              <Bug className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_bugs}</div>
              <p className="text-xs text-muted-foreground">
                {summary.critical_count} critical, {summary.high_count} high
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.open_bugs}</div>
              <p className="text-xs text-muted-foreground">{summary.in_progress} in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fixed</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.fixed_bugs}</div>
              <p className="text-xs text-muted-foreground">{summary.auto_fixed} auto-fixed by AI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Fix Time</CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg_fix_time}</div>
              <p className="text-xs text-muted-foreground">Mean time to resolution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="auto_fixed">Auto-Fixed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="api-core">API Core</SelectItem>
                <SelectItem value="api-golang-v2">API Golang v2</SelectItem>
                <SelectItem value="ai-service">AI Service</SelectItem>
                <SelectItem value="campaign-service">Campaign Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bugs List */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports ({filteredBugs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading bugs...</div>
          ) : filteredBugs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No bugs found! System is healthy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBugs.map((bug) => (
                <Link key={bug.id} href={`/admin/bugs/${bug.id}`}>
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(bug.severity)}>
                            {bug.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(bug.status)}>
                            {bug.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500 font-mono">{bug.bug_code}</span>
                          {bug.status === 'auto_fixed' && (
                            <Badge className="bg-purple-500">
                              <Zap className="w-3 h-3 mr-1" />
                              AI Fixed
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{bug.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bug.details}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Service: {bug.service_name}</span>
                          {bug.http_status && <span>HTTP {bug.http_status}</span>}
                          <span>{new Date(bug.created_at).toLocaleString()}</span>
                          {bug.ai_analysis?.confidence && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              AI Confidence: {(bug.ai_analysis.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
