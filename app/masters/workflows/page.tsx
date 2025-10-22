'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ShoppingCart, Truck, Package, Users, Calculator, TrendingUp, Workflow, Play, CheckCircle, Clock, AlertTriangle, Globe, Shield, Heart, Zap, Building2, Award, Activity, FlaskConical, FileText, Languages, DollarSign } from "lucide-react"
import { golangAPI } from "@/lib/api"
import type {
  WorkflowDefinition,
  HomeopathyWorkflow,
  PharmacyComplianceWorkflow,
  SupplyChainWorkflow,
  InternationalWorkflow,
  CRMWorkflow,
  AnalyticsWorkflow
} from "@/types/workflows"

export default function BusinessWorkflows() {
  const router = useRouter()
  const [selectedWorkflow, setSelectedWorkflow] = useState("overview")

  // Fetch workflow data
  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', 'all'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/workflows')
      return res.data as WorkflowDefinition[]
    },
    staleTime: 300_000,
  })

  // Fetch workflow metrics
  const { data: workflowMetrics } = useQuery({
    queryKey: ['workflows', 'metrics'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/workflows/metrics')
      return res.data
    },
    staleTime: 60_000, // Refresh every minute for real-time data
  })

  // Fetch inventory levels by location
  const { data: inventoryLevels = [] } = useQuery({
    queryKey: ['inventory', 'levels'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/inventory/levels')
      return res.data
    },
    staleTime: 300_000,
  })

  // Fetch customer service metrics
  const { data: customerServiceMetrics } = useQuery({
    queryKey: ['customer-service', 'metrics'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/customer-service/metrics')
      return res.data
    },
    staleTime: 300_000,
  })

  // Fetch financial metrics
  const { data: financialMetrics } = useQuery({
    queryKey: ['finance', 'metrics'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/finance/metrics')
      return res.data
    },
    staleTime: 300_000,
  })

  const workflowCategories = [
    { id: 'overview', label: 'Overview', icon: Workflow, color: 'bg-gray-100' },
    { id: 'homeopathy', label: 'Homeopathy', icon: Heart, color: 'bg-red-100' },
    { id: 'pharmacy', label: 'Pharmacy Compliance', icon: Shield, color: 'bg-blue-100' },
    { id: 'supply-chain', label: 'Supply Chain', icon: Package, color: 'bg-green-100' },
    { id: 'international', label: 'International', icon: Globe, color: 'bg-purple-100' },
    { id: 'crm', label: 'CRM & Loyalty', icon: Users, color: 'bg-pink-100' },
    { id: 'analytics', label: 'Analytics & ML', icon: TrendingUp, color: 'bg-orange-100' },
  ]

  const getWorkflowIcon = (category: string) => {
    const icons: Record<string, any> = {
      homeopathy: Heart,
      pharmacy: Shield,
      'supply-chain': Package,
      international: Globe,
      crm: Users,
      analytics: TrendingUp,
    }
    return icons[category] || Workflow
  }

  const getWorkflowColor = (category: string) => {
    const colors: Record<string, string> = {
      homeopathy: 'text-red-600',
      pharmacy: 'text-blue-600',
      'supply-chain': 'text-green-600',
      international: 'text-purple-600',
      crm: 'text-pink-600',
      analytics: 'text-orange-600',
    }
    return colors[category] || 'text-gray-600'
  }

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
            <h2 className="text-3xl font-bold tracking-tight">Advanced Business Workflows</h2>
            <p className="text-gray-600">Comprehensive business processes integrating all master data types</p>
          </div>
        </div>
      </div>

      {/* Workflow Categories */}
      <Tabs value={selectedWorkflow} onValueChange={setSelectedWorkflow} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {workflowCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
              <category.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {workflowCategories.slice(1).map((category) => {
              const categoryWorkflows = workflows.filter(w => w.category === category.id)
              const activeWorkflows = categoryWorkflows.filter(w => w.active)
              const Icon = getWorkflowIcon(category.id)

              return (
                <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedWorkflow(category.id)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Icon className={`w-5 h-5 mr-2 ${getWorkflowColor(category.id)}`} />
                      {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Workflows:</span>
                        <span className="font-medium">{categoryWorkflows.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active:</span>
                        <span className="font-medium text-green-600">{activeWorkflows.length}</span>
                      </div>
                      <Progress value={(activeWorkflows.length / categoryWorkflows.length) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Workflow Health Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-600" />
                Workflow Health Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {workflowMetrics?.successRate ? `${workflowMetrics.successRate}%` : 'Loading...'}
                  </div>
                  <p className="text-sm text-gray-600">Workflow Success Rate</p>
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mt-2" />
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {workflowMetrics?.avgProcessingTime ? `${workflowMetrics.avgProcessingTime}h` : 'Loading...'}
                  </div>
                  <p className="text-sm text-gray-600">Average Processing Time</p>
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mt-2" />
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {workflowMetrics?.activeAlerts ?? 'Loading...'}
                  </div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homeopathy Workflows */}
        <TabsContent value="homeopathy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-600" />
                Homeopathy-Specific Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-red-50">
                  <FlaskConical className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Potency Management</h4>
                  <p className="text-xs text-gray-600">Dilution calculations & succussion</p>
                </div>
                <div className="text-center p-4 border rounded bg-blue-50">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Medicine Preparation</h4>
                  <p className="text-xs text-gray-600">Classical & combination remedies</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Quality Control</h4>
                  <p className="text-xs text-gray-600">Batch testing & compliance</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Certification</h4>
                  <p className="text-xs text-gray-600">AYUSH & international standards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inventory Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryLevels.slice(0, 4).map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Package className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{transfer.productName || 'Product'}</p>
                          <p className="text-xs text-gray-600">{transfer.quantity || 0} units</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{transfer.fromLocation || 'Source'}  {transfer.toLocation || 'Destination'}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{transfer.createdAt || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {inventoryLevels.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No recent movements
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medicine Preparation Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Medicine Preparation Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="text-center p-4 border rounded bg-red-50">
                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                    <h4 className="font-medium text-sm">Source Material</h4>
                    <p className="text-xs text-gray-600">Plant, mineral, or animal source</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-blue-50">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                    <h4 className="font-medium text-sm">Mother Tincture</h4>
                    <p className="text-xs text-gray-600">Initial extraction process</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-green-50">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                    <h4 className="font-medium text-sm">Dilution Series</h4>
                    <p className="text-xs text-gray-600">Hahnemannian or Korsakovian</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-purple-50">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">4</div>
                    <h4 className="font-medium text-sm">Succussion</h4>
                    <p className="text-xs text-gray-600">10-100 strokes per dilution</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-orange-50">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">5</div>
                    <h4 className="font-medium text-sm">Medication</h4>
                    <p className="text-xs text-gray-600">Impregnation with vehicle</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-indigo-50">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">6</div>
                    <h4 className="font-medium text-sm">Quality Testing</h4>
                    <p className="text-xs text-gray-600">Final verification & packaging</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pharmacy Compliance Workflows */}
        <TabsContent value="pharmacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Pharmacy Regulations Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-blue-50">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Schedule H Management</h4>
                  <p className="text-xs text-gray-600">Prescription drug controls</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Drug Interaction Checking</h4>
                  <p className="text-xs text-gray-600">Safety validation system</p>
                </div>
                <div className="text-center p-4 border rounded bg-red-50">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Expiry Monitoring</h4>
                  <p className="text-xs text-gray-600">Automated alerts & disposal</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Audit Trail</h4>
                  <p className="text-xs text-gray-600">Complete compliance logging</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drug Interaction Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Drug Interaction Checking Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="text-center p-4 border rounded bg-blue-50">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                    <h4 className="font-medium text-sm">Prescription Input</h4>
                    <p className="text-xs text-gray-600">Medicine list entry</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-green-50">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                    <h4 className="font-medium text-sm">Database Lookup</h4>
                    <p className="text-xs text-gray-600">Interaction database check</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-red-50">
                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                    <h4 className="font-medium text-sm">Severity Assessment</h4>
                    <p className="text-xs text-gray-600">Risk level determination</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-orange-50">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">4</div>
                    <h4 className="font-medium text-sm">Clinical Review</h4>
                    <p className="text-xs text-gray-600">Pharmacist validation</p>
                  </div>
                  <div className="text-center p-4 border rounded bg-purple-50">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">5</div>
                    <h4 className="font-medium text-sm">Patient Counseling</h4>
                    <p className="text-xs text-gray-600">Usage instructions & warnings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supply Chain Workflows */}
        <TabsContent value="supply-chain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Multi-Location Supply Chain Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-green-50">
                  <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Warehouse Management</h4>
                  <p className="text-xs text-gray-600">Multi-location inventory</p>
                </div>
                <div className="text-center p-4 border rounded bg-blue-50">
                  <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Transportation</h4>
                  <p className="text-xs text-gray-600">Route optimization & tracking</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Demand Forecasting</h4>
                  <p className="text-xs text-gray-600">ML-based predictions</p>
                </div>
                <div className="text-center p-4 border rounded bg-orange-50">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Just-in-Time</h4>
                  <p className="text-xs text-gray-600">Automated replenishment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* International Expansion Workflows */}
        <TabsContent value="international" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                International Expansion Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-purple-50">
                  <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Multi-Currency</h4>
                  <p className="text-xs text-gray-600">Real-time exchange rates</p>
                </div>
                <div className="text-center p-4 border rounded bg-blue-50">
                  <Languages className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Multi-Language</h4>
                  <p className="text-xs text-gray-600">Localized interfaces</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Regulatory Compliance</h4>
                  <p className="text-xs text-gray-600">Country-specific rules</p>
                </div>
                <div className="text-center p-4 border rounded bg-red-50">
                  <Globe className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Cultural Adaptation</h4>
                  <p className="text-xs text-gray-600">Market localization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM & Loyalty Workflows */}
        <TabsContent value="crm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-pink-600" />
                Customer Relationship Management & Loyalty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-pink-50">
                  <Users className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Customer Lifecycle</h4>
                  <p className="text-xs text-gray-600">From prospect to advocate</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Loyalty Programs</h4>
                  <p className="text-xs text-gray-600">Points, tiers & rewards</p>
                </div>
                <div className="text-center p-4 border rounded bg-blue-50">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Purchase Analytics</h4>
                  <p className="text-xs text-gray-600">Behavior insights</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Satisfaction Tracking</h4>
                  <p className="text-xs text-gray-600">Feedback management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics & ML Workflows */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                Advanced Analytics & ML Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded bg-orange-50">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Demand Forecasting</h4>
                  <p className="text-xs text-gray-600">ML-based predictions</p>
                </div>
                <div className="text-center p-4 border rounded bg-blue-50">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Customer Analytics</h4>
                  <p className="text-xs text-gray-600">Behavior patterns</p>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Inventory Optimization</h4>
                  <p className="text-xs text-gray-600">Stock level recommendations</p>
                </div>
                <div className="text-center p-4 border rounded bg-purple-50">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Performance Metrics</h4>
                  <p className="text-xs text-gray-600">KPI tracking & alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Service Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {customerServiceMetrics?.avgResponseTime ? `${customerServiceMetrics.avgResponseTime}h` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
            <TrendingUp className="w-5 h-5 text-green-600 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {customerServiceMetrics?.resolutionRate ? `${customerServiceMetrics.resolutionRate}%` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">First-contact resolution</p>
            <CheckCircle className="w-5 h-5 text-blue-600 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {customerServiceMetrics?.avgSatisfaction || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
            <div className="flex mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className={`w-4 h-4 rounded-sm mr-1 ${
                  star <= (customerServiceMetrics?.avgSatisfaction || 0) ? 'bg-yellow-400' : 'bg-gray-200'
                }`}></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicators */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {financialMetrics?.revenue ? `${financialMetrics.revenue}` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics?.revenueGrowth ? `+${financialMetrics.revenueGrowth}% from last month` : 'Revenue data'}
            </p>
            <TrendingUp className="w-5 h-5 text-green-600 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {financialMetrics?.profitMargin ? `${financialMetrics.profitMargin}%` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">Above industry average</p>
            <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Outstanding Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {financialMetrics?.outstandingPayments ? `${financialMetrics.outstandingPayments}` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">Within credit limits</p>
            <Clock className="w-5 h-5 text-orange-600 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {financialMetrics?.cashFlowStatus || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics?.cashFlowAmount ? `${financialMetrics.cashFlowAmount} surplus` : 'Cash flow data'}
            </p>
            <CheckCircle className="w-5 h-5 text-blue-600 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Workflow Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Workflow className="w-5 h-5 mr-2 text-gray-600" />
            Workflow Management Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Play className="w-6 h-6" />
              <span>Start Workflow</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Clock className="w-6 h-6" />
              <span>Monitor Progress</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <AlertTriangle className="w-6 h-6" />
              <span>Handle Exceptions</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <CheckCircle className="w-6 h-6" />
              <span>Approve Actions</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <TrendingUp className="w-6 h-6" />
              <span>Performance Reports</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Users className="w-6 h-6" />
              <span>Team Collaboration</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Package className="w-6 h-6" />
              <span>Resource Allocation</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Calculator className="w-6 h-6" />
              <span>Cost Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

