'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone, CreditCard, MessageSquare, Mail, Truck, Building, Globe, Zap } from "lucide-react"

export default function ThirdPartyIntegrations() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("payments")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/masters')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Masters
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Third-Party Integrations</h2>
            <p className="text-gray-600">Comprehensive integration with external services and APIs</p>
          </div>
        </div>
      </div>

      {/* Integration Categories */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
          { id: 'communication', label: 'Communication', icon: MessageSquare },
          { id: 'logistics', label: 'Logistics', icon: Truck },
          { id: 'accounting', label: 'Accounting', icon: Building },
          { id: 'ecommerce', label: 'E-commerce', icon: Smartphone },
          { id: 'other', label: 'Other Services', icon: Zap }
        ].map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              selectedCategory === category.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <category.icon className="w-4 h-4" />
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Payment Gateways */}
      {selectedCategory === 'payments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Payment Gateway Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Razorpay</h4>
                    <Badge className="text-green-700 bg-green-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Payment processing, refunds, webhooks</p>
                  <div className="text-xs text-gray-500">
                    <div>Transactions: 12,847</div>
                    <div>Success Rate: 98.5%</div>
                    <div>Total Volume: 45.2L</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Stripe</h4>
                    <Badge className="text-blue-700 bg-blue-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">International payments, subscriptions</p>
                  <div className="text-xs text-gray-500">
                    <div>International: $2,847</div>
                    <div>Subscriptions: 156</div>
                    <div>Growth: +23%</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Paytm</h4>
                    <Badge className="text-purple-700 bg-purple-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">UPI, wallet, bank transfers</p>
                  <div className="text-xs text-gray-500">
                    <div>UPI Transactions: 8,234</div>
                    <div>Wallet Users: 1,245</div>
                    <div>Bank Transfer: 12.3L</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Communication Services */}
      {selectedCategory === 'communication' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Communication Service Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Twilio SMS</h4>
                    <Badge className="text-blue-700 bg-blue-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Transactional SMS, OTP, notifications</p>
                  <div className="text-xs text-gray-500">
                    <div>Messages Sent: 45,231</div>
                    <div>Delivery Rate: 97.8%</div>
                    <div>Cost: 0.25/msg</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">SendGrid Email</h4>
                    <Badge className="text-green-700 bg-green-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Email campaigns, transactional emails</p>
                  <div className="text-xs text-gray-500">
                    <div>Emails Sent: 23,456</div>
                    <div>Open Rate: 34.5%</div>
                    <div>Click Rate: 12.8%</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">WhatsApp Business</h4>
                    <Badge className="text-purple-700 bg-purple-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Customer support, order updates</p>
                  <div className="text-xs text-gray-500">
                    <div>Messages: 8,945</div>
                    <div>Response Time: &lt;2min</div>
                    <div>Satisfaction: 4.7/5</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logistics Services */}
      {selectedCategory === 'logistics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2 text-orange-600" />
                Logistics & Shipping Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Shiprocket</h4>
                    <Badge className="text-orange-700 bg-orange-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Multi-courier shipping, tracking</p>
                  <div className="text-xs text-gray-500">
                    <div>Shipments: 3,456</div>
                    <div>On-time: 94.2%</div>
                    <div>Avg. Cost: 67</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Delhivery</h4>
                    <Badge className="text-blue-700 bg-blue-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Express delivery, same-day service</p>
                  <div className="text-xs text-gray-500">
                    <div>Express: 1,234</div>
                    <div>Same-day: 567</div>
                    <div>Rating: 4.6/5</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">DTDC</h4>
                    <Badge className="text-green-700 bg-green-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Ground shipping, bulk delivery</p>
                  <div className="text-xs text-gray-500">
                    <div>Bulk Orders: 789</div>
                    <div>Ground: 2,345</div>
                    <div>Cost Savings: 15%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounting Software */}
      {selectedCategory === 'accounting' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                Accounting Software Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Tally ERP</h4>
                    <Badge className="text-gray-700 bg-gray-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Financial data synchronization</p>
                  <div className="text-xs text-gray-500">
                    <div>Sync Status: Real-time</div>
                    <div>Last Sync: 2 minutes ago</div>
                    <div>Data Points: 15,234</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">QuickBooks</h4>
                    <Badge className="text-blue-700 bg-blue-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">International accounting integration</p>
                  <div className="text-xs text-gray-500">
                    <div>Companies: 3</div>
                    <div>Multi-currency: Enabled</div>
                    <div>Reports: Auto-sync</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* E-commerce Platforms */}
      {selectedCategory === 'ecommerce' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
                E-commerce Platform Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Shopify</h4>
                    <Badge className="text-purple-700 bg-purple-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Product sync, order management</p>
                  <div className="text-xs text-gray-500">
                    <div>Products Synced: 847</div>
                    <div>Orders: 2,345</div>
                    <div>Revenue: 12.5L</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">WooCommerce</h4>
                    <Badge className="text-green-700 bg-green-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">WordPress e-commerce integration</p>
                  <div className="text-xs text-gray-500">
                    <div>Sites: 5</div>
                    <div>Products: 623</div>
                    <div>Plugin Version: 7.2</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Amazon Seller</h4>
                    <Badge className="text-blue-700 bg-blue-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Marketplace integration</p>
                  <div className="text-xs text-gray-500">
                    <div>Listings: 234</div>
                    <div>Orders: 1,456</div>
                    <div>Rating: 4.5</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Services */}
      {selectedCategory === 'other' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                Other Service Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Google Analytics</h4>
                    <Badge className="text-yellow-700 bg-yellow-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Website analytics and tracking</p>
                  <div className="text-xs text-gray-500">
                    <div>Page Views: 45,231</div>
                    <div>Unique Visitors: 12,847</div>
                    <div>Bounce Rate: 34.5%</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Firebase</h4>
                    <Badge className="text-red-700 bg-red-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Push notifications, crash reporting</p>
                  <div className="text-xs text-gray-500">
                    <div>Active Users: 2,345</div>
                    <div>Notifications Sent: 8,945</div>
                    <div>Crash Reports: 23</div>
                  </div>
                </div>

                <div className="p-4 border rounded bg-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Slack</h4>
                    <Badge className="text-indigo-700 bg-indigo-100">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Team communication, alerts</p>
                  <div className="text-xs text-gray-500">
                    <div>Team Members: 45</div>
                    <div>Messages: 12,456</div>
                    <div>Alerts Sent: 234</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Health Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded bg-green-50">
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <p className="text-sm text-green-700">API Uptime</p>
            </div>
            <div className="text-center p-4 border rounded bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">99.2%</div>
              <p className="text-sm text-blue-700">Data Sync Success</p>
            </div>
            <div className="text-center p-4 border rounded bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">2.3s</div>
              <p className="text-sm text-purple-700">Avg Response Time</p>
            </div>
            <div className="text-center p-4 border rounded bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">156</div>
              <p className="text-sm text-orange-700">Active Integrations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Globe className="w-6 h-6" />
              <span>API Documentation</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Zap className="w-6 h-6" />
              <span>Webhook Testing</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <CreditCard className="w-6 h-6" />
              <span>Payment Testing</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Truck className="w-6 h-6" />
              <span>Shipping Calculator</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <MessageSquare className="w-6 h-6" />
              <span>Communication Setup</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Building className="w-6 h-6" />
              <span>Accounting Sync</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
