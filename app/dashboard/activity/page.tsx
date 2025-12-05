'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, CheckCircle, XCircle, Zap, Database, TrendingUp, Package, DollarSign, ShoppingCart, Brain, Bug, Server, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { authFetch } from '@/lib/api/fetch-utils';
import AIInsightsWidget from '@/components/dashboard/AIInsightsWidget'
import AnomalyDetectionCard from '@/components/dashboard/AnomalyDetectionCard'
import PredictiveInsightsPanel from '@/components/dashboard/PredictiveInsightsPanel'


const fetcher = (url: string) => authFetch(url).then(r => r.json())

// Custom fetchers for data mapping
const activityFetcher = (url: string) => authFetch(url).then(r => r.json()).then(res => {
  return (res.data || []).map((item: any) => ({
    id: item.id,
    event: item.action,
    module: item.module,
    timestamp: item.timestamp,
    details: item.description
  }));
});

const healthFetcher = (url: string) => authFetch(url).then(r => r.json()).then(res => {
  return (res.services || []).map((s: any) => ({
    name: s.name,
    port: 0, // Not provided by backend
    status: s.status === 'healthy' ? 'OK' : 'DOWN',
    responseTime: s.latency,
    version: '1.0.0'
  }));
});

const metricsFetcher = (url: string) => authFetch(url).then(r => r.json()).then(res => {
  const d = res.data || {};
  return {
    openBugs: 0, // Placeholder
    activeServices: 5, // Placeholder
    aiTasks: 0, // Placeholder
    inventorySync: 'Synced',
    salesToday: d.today_revenue || 0,
    systemLoad: 15 // Placeholder
  };
});

const bugsFetcher = (url: string) => authFetch(url).then(r => r.json()).then(res => {
  // Handle both array and object responses
  if (Array.isArray(res)) return res;
  return res.data || [];
});

interface SystemMetrics {
  openBugs: number
  activeServices: number
  aiTasks: number
  inventorySync: string
  salesToday: number
  systemLoad: number
}

interface ServiceHealth {
  name: string
  port: number
  status: 'OK' | 'SLOW' | 'DOWN'
  responseTime: number
  version: string
}

interface AIActivity {
  id: string
  agent: string
  action: string
  timestamp: string
  status: 'running' | 'completed' | 'failed'
}

interface BugReport {
  id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL'
  status: 'OPEN' | 'AI_SUGGESTED' | 'RESOLVED'
  aiSuggestion?: string
}

interface BusinessEvent {
  id: string
  event: string
  module: string
  timestamp: string
  details: string
}

export default function ActivityPage() {
  // Real-time data with SWR (auto-refresh) - with error handling and fallbacks
  const { data: metrics, error: metricsError } = useSWR<SystemMetrics>('/api/erp/dashboard/stats', metricsFetcher, {
    refreshInterval: 60000,
    fallbackData: { openBugs: 0, activeServices: 5, aiTasks: 0, inventorySync: 'Synced', salesToday: 0, systemLoad: 12 },
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })
  const { data: services, error: servicesError } = useSWR<ServiceHealth[]>('/api/erp/system/health', healthFetcher, {
    refreshInterval: 30000,
    fallbackData: [],
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })
  const { data: aiActivities, error: aiError } = useSWR<AIActivity[]>('/api/ai/activity', fetcher, {
    refreshInterval: 10000,
    fallbackData: [],
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })
  const { data: bugs, error: bugsError } = useSWR<BugReport[]>('/api/erp/bugs', bugsFetcher, {
    refreshInterval: 60000,
    fallbackData: [],
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })
  const { data: events, error: eventsError } = useSWR<BusinessEvent[]>('/api/erp/dashboard/activity', activityFetcher, {
    refreshInterval: 5000,
    fallbackData: [],
    shouldRetryOnError: false,
    revalidateOnFocus: false
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    if (status === 'OK') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'SLOW') return <AlertCircle className="w-4 h-4 text-orange-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getSeverityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-300'
    if (severity === 'MEDIUM') return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            System Activity Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time control center for ERP operations</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Live Updates
        </Badge>
      </div>

      {/* Top Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Open Bugs</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.openBugs || 0}</p>
              </div>
              <Bug className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.activeServices || 0}/5</p>
              </div>
              <Server className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">AI Tasks</p>
                <p className="text-2xl font-bold text-purple-600">{metrics?.aiTasks || 0}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Inventory Sync</p>
                <p className="text-xs font-semibold text-blue-600">{metrics?.inventorySync || 'N/A'}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-green-600">₹{metrics?.salesToday || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">System Load</p>
                <p className="text-2xl font-bold text-orange-600">{metrics?.systemLoad || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIInsightsWidget />
        <AnomalyDetectionCard />
        <PredictiveInsightsPanel />
      </div>

      {/* AI System Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI System Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiActivities?.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">{activity.agent}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            )) || <p className="text-sm text-gray-500 text-center py-4">No AI activities</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bug & Exception Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              Bug & Exception Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(bugs) && bugs.length > 0 ? (
                bugs.slice(0, 5).map(bug => (
                  <div key={bug.id} className={`p-3 border rounded-lg ${getSeverityColor(bug.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{bug.title}</p>
                        {bug.aiSuggestion && (
                          <p className="text-xs mt-1 text-gray-600">💡 {bug.aiSuggestion}</p>
                        )}
                      </div>
                      <Badge variant="outline">{bug.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No bugs reported ✨</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Microservice Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Microservice Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services?.map(service => (
                <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-gray-600">Port {service.port} • v{service.version}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{service.responseTime}ms</p>
                    <Badge variant={service.status === 'OK' ? 'default' : 'destructive'} className="text-xs">
                      {service.status}
                    </Badge>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500 text-center py-4">No services data</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Business Events Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events?.slice(0, 10).map(event => (
              <div key={event.id} className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                <Clock className="w-4 h-4 text-blue-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{event.module}</Badge>
                    <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-gray-600 mt-1">{event.details}</p>
                </div>
              </div>
            )) || <p className="text-sm text-gray-500 text-center py-4">No recent events</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
