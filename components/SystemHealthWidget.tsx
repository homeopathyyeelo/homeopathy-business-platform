'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { authFetch } from '@/lib/api/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface ServiceHealth {
  service: string
  port: number
  status: 'up' | 'down' | 'degraded'
  latency: number
  last_check: string
}

export function SystemHealthWidget() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/system/health`)
      const data = await response.json()
      if (data.success) {
        setServices(data.data.services || [])
      }
    } catch (error) {
      console.error('Error fetching health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'down': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Checking...</div>
        ) : (
          <div className="space-y-2">
            {services.map((svc) => (
              <div key={svc.service} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  {getIcon(svc.status)}
                  <span className="font-medium">{svc.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">:{svc.port}</span>
                  {svc.status === 'up' && (
                    <span className="text-gray-500">{svc.latency}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
