'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Truck, Package, MapPin, Clock, AlertTriangle, CheckCircle, TrendingUp, BarChart3 } from "lucide-react"
import { golangAPI } from "@/lib/api"

export default function SupplyChainManagement() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("overview")

  // Fetch supply chain data
  const { data: suppliers = [] } = useQuery({
    queryKey: ['supply-chain', 'suppliers'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/supply-chain/suppliers')
      return res.data
    },
    staleTime: 300_000,
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['supply-chain', 'inventory'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/supply-chain/inventory')
      return res.data
    },
    staleTime: 300_000,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['supply-chain', 'orders'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/supply-chain/orders')
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
            <h2 className="text-3xl font-bold tracking-tight">Supply Chain Management</h2>
            <p className="text-gray-600">Comprehensive supply chain optimization and multi-location management</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'suppliers', label: 'Suppliers', icon: Truck },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'logistics', label: 'Logistics', icon: MapPin },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{suppliers.filter(s => s.is_active).length}</div>
                <p className="text-xs text-muted-foreground">Across all locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Inventory Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Warehouses & branches</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{orders.filter(o => o.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Supply Chain Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">94%</div>
                <p className="text-xs text-muted-foreground">On-time delivery rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Supply Chain Health Indicators */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.slice(0, 5).map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">Rating: {supplier.performance_rating}/10</p>
                      </div>
                      <Badge variant={supplier.performance_rating >= 8 ? 'default' : 'secondary'}>
                        {supplier.performance_rating >= 8 ? 'Excellent' : 'Good'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Main Warehouse</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Branch A</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full w-1/2"></div>
                      </div>
                      <span className="text-sm font-medium">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Branch B</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full w-1/4"></div>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {selectedTab === 'suppliers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">{supplier.contact_person}  {supplier.city}</p>
                        <p className="text-xs text-gray-500">Products: {supplier.product_count}  Rating: {supplier.rating}/5</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Tab */}
      {selectedTab === 'inventory' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Location Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku}  Batch: {item.batch_number}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline">{item.location}</Badge>
                          <span className="text-sm">Qty: {item.quantity}</span>
                          <span className="text-sm">Expiry: {item.expiry_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.quantity > item.reorder_level ? 'default' : 'destructive'}>
                        {item.quantity > item.reorder_level ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logistics Tab */}
      {selectedTab === 'logistics' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Delivery Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm">Order #12345</span>
                    <Badge className="text-green-700 bg-green-100">Delivered</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-sm">Order #12346</span>
                    <Badge className="text-blue-700 bg-blue-100">In Transit</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="text-sm">Order #12347</span>
                    <Badge className="text-yellow-700 bg-yellow-100">Processing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Delivery Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-Time Delivery</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Delivery Time</span>
                    <span className="font-bold">2.3 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-bold">4.7/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Optimization */}
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">15%</div>
                  <p className="text-sm text-blue-700">Route Efficiency</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <div className="text-2xl font-bold text-green-600">2,450</div>
                  <p className="text-sm text-green-700">Cost Savings</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600">8.5h</div>
                  <p className="text-sm text-purple-700">Avg. Delivery Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-gray-600">Order Fulfillment</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">2.1</div>
                  <p className="text-sm text-gray-600">Inventory Turnover</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-purple-600">4.2L</div>
                  <p className="text-sm text-gray-600">Monthly Savings</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <p className="text-sm text-gray-600">Active Suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supply Chain Optimization */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Supplier Consolidation</h4>
                      <p className="text-sm text-gray-600">Reduce supplier count from 15 to 8 for better pricing</p>
                    </div>
                  </div>
                  <Badge className="text-green-700 bg-green-100">High Impact</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Inventory Rebalancing</h4>
                      <p className="text-sm text-gray-600">Redistribute stock from Main Warehouse to Branch B</p>
                    </div>
                  </div>
                  <Badge className="text-blue-700 bg-blue-100">Medium Impact</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded bg-purple-50">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Delivery Route Optimization</h4>
                      <p className="text-sm text-gray-600">Implement dynamic routing for 20% faster delivery</p>
                    </div>
                  </div>
                  <Badge className="text-purple-700 bg-purple-100">High Impact</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Supply Chain Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Truck className="w-6 h-6" />
              <span>Supplier Portal</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Package className="w-6 h-6" />
              <span>Inventory Transfer</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <MapPin className="w-6 h-6" />
              <span>Route Planning</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <BarChart3 className="w-6 h-6" />
              <span>Performance Reports</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Clock className="w-6 h-6" />
              <span>Lead Time Analysis</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <CheckCircle className="w-6 h-6" />
              <span>Quality Control</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <AlertTriangle className="w-6 h-6" />
              <span>Risk Assessment</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <TrendingUp className="w-6 h-6" />
              <span>Demand Forecasting</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
