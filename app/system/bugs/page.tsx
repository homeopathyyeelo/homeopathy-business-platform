'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Clock, Search, Filter, Bug, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface BugReport {
  id: string
  bug_code: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'fixed' | 'closed'
  module_name: string
  file_path: string
  error_message: string
  ai_confidence: number | null
  fix_applied: boolean
  priority: number
  created_at: string
  updated_at: string
}

interface BugSummary {
  open_bugs: number
  in_progress_bugs: number
  fixed_bugs: number
  critical_bugs: number
  high_bugs: number
  bugs_last_24h: number
  auto_fixed_bugs: number
  avg_ai_confidence: number | null
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [summary, setSummary] = useState<BugSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchBugs()
    fetchSummary()
  }, [statusFilter, severityFilter])

  const fetchBugs = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (severityFilter !== 'all') params.append('severity', severityFilter)

      const response = await fetch(`${process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'}/api/v1/system/bugs?${params}`)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'}/api/v1/system/bugs/summary`)
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
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBugs = bugs.filter(bug =>
    bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.bug_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.module_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-500" />
            Bug Tracking Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Automated bug detection and AI-powered fixes</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.open_bugs}</div>
              <p className="text-xs text-muted-foreground">
                {summary.critical_bugs} critical, {summary.high_bugs} high
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.in_progress_bugs}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fixed Bugs</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.fixed_bugs}</div>
              <p className="text-xs text-muted-foreground">
                {summary.auto_fixed_bugs} auto-fixed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.bugs_last_24h}</div>
              <p className="text-xs text-muted-foreground">
                AI Confidence: {summary.avg_ai_confidence ? (summary.avg_ai_confidence * 100).toFixed(0) : 0}%
              </p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="closed">Closed</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Bugs List */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports ({filteredBugs.length})</CardTitle>
          <CardDescription>Click on a bug to view details and AI fix suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading bugs...</div>
          ) : filteredBugs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bugs found</div>
          ) : (
            <div className="space-y-3">
              {filteredBugs.map((bug) => (
                <Link key={bug.id} href={`/system/bugs/${bug.id}`}>
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
                          <span className="text-sm text-gray-500">{bug.bug_code}</span>
                          {bug.fix_applied && (
                            <Badge className="bg-green-500">Auto-Fixed</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{bug.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{bug.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Module: {bug.module_name}</span>
                          <span>File: {bug.file_path}</span>
                          <span>Priority: {bug.priority}/10</span>
                          {bug.ai_confidence && (
                            <span>AI Confidence: {(bug.ai_confidence * 100).toFixed(0)}%</span>
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
