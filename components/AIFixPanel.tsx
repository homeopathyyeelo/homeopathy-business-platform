'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Code, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { authFetch } from '@/lib/api/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

interface AIFixSuggestion {
  bug_id: string
  bug_code: string
  title: string
  service_name: string
  confidence: number
  status: string
  created_at: string
}

export function AIFixPanel() {
  const [suggestions, setSuggestions] = useState<AIFixSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
    const interval = setInterval(fetchSuggestions, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchSuggestions = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/system/bugs?status=open&limit=5`)
      const data = await response.json()
      if (data.success) {
        setSuggestions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-500" />
          AI Fix Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-600">No pending fixes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((bug) => (
              <Link key={bug.bug_id} href={`/admin/bugs/${bug.bug_id}`}>
                <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gray-500">{bug.bug_code}</span>
                    <Badge variant="outline" className="text-xs">
                      {bug.service_name}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-2 line-clamp-2">{bug.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span>{(bug.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 text-xs">
                      Review
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link href="/admin/bugs">
            <Button variant="outline" className="w-full" size="sm">
              View All Bugs
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
