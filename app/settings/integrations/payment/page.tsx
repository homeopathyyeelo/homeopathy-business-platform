'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { CreditCard, Check, X } from 'lucide-react'

export default function PaymentIntegrationsPage() {
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGateways()
  }, [])

  const loadGateways = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/payments/gateways')
      const data = await response.json()
      setGateways(data.data || [])
    } catch (error) {
      console.error('Error loading payment gateways:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGateway = async (id, isActive) => {
    try {
      await fetch(`http://localhost:3005/api/payments/gateways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      loadGateways()
    } catch (error) {
      console.error('Error toggling gateway:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const gatewayOptions = [
    { provider: 'razorpay', name: 'Razorpay', icon: '', color: 'bg-blue-500' },
    { provider: 'stripe', name: 'Stripe', icon: '', color: 'bg-purple-500' },
    { provider: 'paypal', name: 'PayPal', icon: '', color: 'bg-blue-600' },
    { provider: 'paytm', name: 'Paytm', icon: '', color: 'bg-indigo-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payment Gateway Integrations</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {gatewayOptions.map((option) => {
          const gateway = gateways.find(g => g.provider === option.provider)
          const isConfigured = !!gateway
          const isActive = gateway?.is_active || false

          return (
            <Card key={option.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center text-2xl`}>
                      {option.icon}
                    </div>
                    <div>
                      <CardTitle>{option.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {isConfigured ? (
                          <Badge variant="outline" className="mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-1">
                            <X className="w-3 h-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  {isConfigured && (
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleGateway(gateway.id, isActive)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConfigured ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Mode</p>
                      <Badge variant={gateway.is_live ? 'success' : 'warning'}>
                        {gateway.is_live ? 'Live' : 'Test'}
                      </Badge>
                    </div>
                    <Button variant="outline" className="w-full">
                      Configure
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Connect your {option.name} account to accept payments
                    </p>
                    <Button className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Setup {option.name}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Transaction history will appear here</p>
        </CardContent>
      </Card>
    </div>
  )
}
