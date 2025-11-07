'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Pause, Play, Trash2, ShoppingCart, DollarSign } from 'lucide-react'
import api from '@/lib/api-complete'
import { authFetch } from '@/lib/api/fetch-utils';

interface POSSession {
  id: string
  status: 'active' | 'paused' | 'completed'
  cart_data: any
  total_amount: number
  item_count: number
  created_at: string
}

export default function DualPanelPOSPage() {
  const [sessions, setSessions] = useState<POSSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUserSessions()
  }, [])

  const loadUserSessions = async () => {
    try {
      // Get current user ID from auth context or localStorage
      const userId = localStorage.getItem('user_id') || 'demo-user-id'
      const response = await api.graphql.query(`
        query GetSessions {
          pos_sessions(where: {user_id: {_eq: "${userId}"}}) {
            id
            status
            cart_data
            total_amount
            item_count
            created_at
          }
        }
      `)
      setSessions(response.data?.pos_sessions || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const createNewSession = async () => {
    setLoading(true)
    try {
      const userId = localStorage.getItem('user_id') || 'demo-user-id'
      const response = await authFetch('http://localhost:3005/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const data = await response.json()
      if (data.success) {
        await loadUserSessions()
        setActiveSession(data.data.id)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setLoading(false)
    }
  }

  const pauseSession = async (sessionId: string) => {
    try {
      await authFetch(`http://localhost:3005/api/pos/sessions/${sessionId}/pause`, {
        method: 'POST'
      })
      await loadUserSessions()
    } catch (error) {
      console.error('Failed to pause session:', error)
    }
  }

  const resumeSession = async (sessionId: string) => {
    try {
      await authFetch(`http://localhost:3005/api/pos/sessions/${sessionId}/resume`, {
        method: 'POST'
      })
      setActiveSession(sessionId)
      await loadUserSessions()
    } catch (error) {
      console.error('Failed to resume session:', error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await authFetch(`http://localhost:3005/api/pos/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      await loadUserSessions()
      if (activeSession === sessionId) {
        setActiveSession(null)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const pausedSessions = sessions.filter(s => s.status === 'paused')

  return (
    <div className="h-screen flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dual Panel POS</h1>
        <Button onClick={createNewSession} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Dual Panel Layout */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Left Panel - Active Session 1 */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Panel 1 {activeSessions[0] && `- Session ${activeSessions[0].id.substring(0, 8)}`}
              </span>
              {activeSessions[0] && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseSession(activeSessions[0].id)}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSession(activeSessions[0].id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {activeSessions[0] ? (
              <POSPanel session={activeSessions[0]} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No active session</p>
                  <Button onClick={createNewSession} className="mt-4">
                    Start Session
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Active Session 2 */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Panel 2 {activeSessions[1] && `- Session ${activeSessions[1].id.substring(0, 8)}`}
              </span>
              {activeSessions[1] && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseSession(activeSessions[1].id)}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSession(activeSessions[1].id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {activeSessions[1] ? (
              <POSPanel session={activeSessions[1]} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No active session</p>
                  <Button onClick={createNewSession} className="mt-4">
                    Start Session
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paused Sessions Bar */}
      {pausedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Paused Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {pausedSessions.map((session) => (
                <Badge
                  key={session.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => resumeSession(session.id)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {session.id.substring(0, 8)} - {session.total_amount.toFixed(2)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// POS Panel Component
function POSPanel({ session }: { session: POSSession }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Cart Items */}
        <div className="space-y-2 p-2">
          <p className="text-sm text-gray-500">
            {session.item_count} item(s) in cart
          </p>
          {/* Add cart items display here */}
        </div>
      </div>

      {/* Total and Checkout */}
      <div className="border-t p-4 space-y-4">
        <div className="flex justify-between items-center text-2xl font-bold">
          <span>Total:</span>
          <span>{session.total_amount.toFixed(2)}</span>
        </div>
        <Button className="w-full" size="lg">
          <DollarSign className="w-5 h-5 mr-2" />
          Process Payment
        </Button>
      </div>
    </div>
  )
}
