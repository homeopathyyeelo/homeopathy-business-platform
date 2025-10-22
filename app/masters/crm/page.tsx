'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Users, Gift, Star, TrendingUp, Award, Heart, MessageSquare, Phone, Mail } from "lucide-react"
import { golangAPI } from "@/lib/api"

export default function CRMLoyaltyPrograms() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("customers")

  // Fetch customer data
  const { data: customers = [] } = useQuery({
    queryKey: ['crm', 'customers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/crm/customers')
      return res.data
    },
    staleTime: 300_000,
  })

  // Fetch loyalty program data
  const { data: loyaltyPrograms = [] } = useQuery({
    queryKey: ['crm', 'loyalty-programs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/crm/loyalty-programs')
      return res.data
    },
    staleTime: 300_000,
  })

  // Fetch customer interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ['crm', 'interactions'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/crm/interactions')
      return res.data
    },
    staleTime: 300_000,
  })

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
            <h2 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h2>
            <p className="text-gray-600">Advanced CRM features with loyalty programs and customer engagement</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'customers', label: 'Customer Management', icon: Users },
          { id: 'loyalty', label: 'Loyalty Programs', icon: Gift },
          { id: 'interactions', label: 'Customer Interactions', icon: MessageSquare },
          { id: 'analytics', label: 'CRM Analytics', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              selectedTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Customer Management Tab */}
      {selectedTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.filter(c => c.is_active).length}</div>
                <p className="text-xs text-muted-foreground">95% retention rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">VIP Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{customers.filter(c => c.customer_group_name === 'VIP').length}</div>
                <p className="text-xs text-muted-foreground">Premium service tier</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.slice(0, 8).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.email || customer.phone}</p>
                        <p className="text-xs text-gray-500">{customer.city}, {customer.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={customer.customer_group_name === 'VIP' ? 'default' : 'outline'}>
                        {customer.customer_group_name || 'Regular'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loyalty Programs Tab */}
      {selectedTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-600" />
                  Loyalty Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loyaltyPrograms.map((program) => (
                    <div key={program.id} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{program.name}</h4>
                        <Badge variant={program.is_active ? 'default' : 'secondary'}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Points per 100:</span>
                          <span className="font-medium ml-2">{program.points_per_purchase}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Min. Redemption:</span>
                          <span className="font-medium ml-2">{program.min_points_for_redemption}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-600" />
                  Loyalty Program Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Members</span>
                    <span className="font-bold">2,847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Members</span>
                    <span className="font-bold">2,156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points Redeemed</span>
                    <span className="font-bold">45,230</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Points Balance</span>
                    <span className="font-bold">342</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Loyalty Status */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Loyalty Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">Loyalty Points: {customer.loyalty_points || 0}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={customer.customer_group_name === 'VIP' ? 'default' : 'outline'}>
                        {customer.customer_group_name || 'Regular'}
                      </Badge>
                      <div className="mt-1">
                        <Progress value={Math.min((customer.loyalty_points || 0) / 1000 * 100, 100)} className="w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Interactions Tab */}
      {selectedTab === 'interactions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Customer Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.slice(0, 8).map((interaction) => (
                  <div key={interaction.id} className="flex items-start space-x-4 p-4 border rounded">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {interaction.type === 'call' ? (
                        <Phone className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{interaction.customer_name}</h4>
                        <Badge variant="outline">{interaction.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{interaction.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{interaction.created_at}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CRM Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">4.8</div>
                <p className="text-xs text-muted-foreground">Average rating</p>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">2.3h</div>
                <p className="text-xs text-muted-foreground">Average response</p>
                <TrendingDown className="w-5 h-5 text-green-600 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">94%</div>
                <p className="text-xs text-muted-foreground">Customer retention</p>
                <TrendingUp className="w-5 h-5 text-green-600 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">23</div>
                <p className="text-xs text-muted-foreground">Open tickets</p>
                <div className="flex mt-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Journey Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <p className="text-sm text-blue-700">New Visitors</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <div className="text-2xl font-bold text-green-600">892</div>
                  <p className="text-sm text-green-700">First Purchases</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600">456</div>
                  <p className="text-sm text-purple-700">Repeat Customers</p>
                </div>
                <div className="text-center p-4 border rounded bg-orange-50">
                  <div className="text-2xl font-bold text-orange-600">123</div>
                  <p className="text-sm text-orange-700">VIP Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Program Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Program Enrollment Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Basic Program</span>
                      <span className="font-medium">1,847 members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Premium Program</span>
                      <span className="font-medium">423 members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">VIP Program</span>
                      <span className="font-medium">156 members</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Redemption Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Points Redeemed</span>
                      <span className="font-medium">67,890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Redemption</span>
                      <span className="font-medium">342</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Top Reward</span>
                      <span className="font-medium">Free Consultation</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CRM Tools */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Users className="w-6 h-6" />
              <span>Customer Segmentation</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Gift className="w-6 h-6" />
              <span>Loyalty Campaign</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <MessageSquare className="w-6 h-6" />
              <span>Interaction History</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Award className="w-6 h-6" />
              <span>Performance Reports</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <TrendingUp className="w-6 h-6" />
              <span>Customer Analytics</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Heart className="w-6 h-6" />
              <span>Satisfaction Survey</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
