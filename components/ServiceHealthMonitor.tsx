'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface ServiceHealth {
  service: string
  port: number
  status: 'up' | 'down' | 'degraded'
  latency: number
  last_check: string
  url: string
  version: string
}

interface SystemHealth {
  status: string
  services: ServiceHealth[]
  timestamp: string
  uptime: number
}

export function ServiceHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/system/health`)
      const data = await response.json()
      if (data.success) {
        setHealth(data.data)
      }
    } catch (error) {
      console.error('Error fetching health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'bg-green-100 text-green-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-500">Loading health status...</div>
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-red-500">Failed to load health status</div>
        </CardContent>
      </Card>
    )
  }

  const upCount = health.services.filter(s => s.status === 'up').length
  const downCount = health.services.filter(s => s.status === 'down').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>System Health</span>
          <Badge className={getStatusColor(health.status)}>
            {health.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Services: {upCount}/{health.services.length} UP</span>
            <span className="text-gray-600">Uptime: {Math.floor(health.uptime / 60)}m</span>
          </div>

          <div className="space-y-2">
            {health.services.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="font-medium">{service.service}</span>
                  <span className="text-gray-500">:{service.port}</span>
                </div>
                <div className="flex items-center gap-2">
                  {service.status === 'up' && (
                    <span className="text-gray-500">{service.latency}ms</span>
                  )}
                  <Badge variant="outline" className="text-xs py-0">
                    {service.version}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {downCount > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-800">
                <strong>Warning:</strong> {downCount} service(s) are down. Run service audit or restart services.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
