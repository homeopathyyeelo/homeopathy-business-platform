'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Activity, User, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface ActivityLog {
  id: string
  action: string
  module: string
  description: string
  user_name: string
  user_email: string
  timestamp: string
  ip_address: string
  metadata: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')

  useEffect(() => {
    fetchActivities()
  }, [moduleFilter])

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams()
      if (moduleFilter !== 'all') params.append('module', moduleFilter)

      const response = await fetch(`${API_URL}/api/erp/dashboard/activity?${params}`)
      const data = await response.json()
      if (data.success) {
        setActivities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800'
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800'
    if (action.includes('deleted')) return 'bg-red-100 text-red-800'
    if (action.includes('login')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getModuleIcon = (module: string) => {
    // Return appropriate icon based on module
    return <Activity className="w-4 h-4" />
  }

  const filteredActivities = activities.filter(activity =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            Activity Log
          </h1>
          <p className="text-gray-600 mt-1">Real-time system activity and user actions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchases">Purchases</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activities found</div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-1">
                    {getModuleIcon(activity.module)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionColor(activity.action)}>
                        {activity.action}
                      </Badge>
                      <Badge variant="outline">{activity.module}</Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      <span>IP: {activity.ip_address}</span>
                    </div>
                    
                    {activity.metadata && activity.metadata !== '{}' && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                          View metadata
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(JSON.parse(activity.metadata), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
