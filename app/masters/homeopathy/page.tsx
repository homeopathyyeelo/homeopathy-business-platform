'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { golangAPI } from "@/lib/api"

export default function HomeopathyDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedTab, setSelectedTab] = useState("products")

  // Fetch homeopathic products
  const { data: homeopathicProducts = [] } = useQuery({
    queryKey: ['homeopathy', 'products'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/homeopathy/products')
      return res.data
    },
    staleTime: 300_000,
  })

  // Fetch prescription trends
  const { data: prescriptionTrends = [] } = useQuery({
    queryKey: ['homeopathy', 'prescription-trends'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/homeopathy/analytics/prescription-trends')
      return res.data
    },
    staleTime: 600_000,
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
            <h2 className="text-3xl font-bold tracking-tight">Homeopathy Management</h2>
            <p className="text-gray-600">Advanced homeopathy-specific features and analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'products', label: 'Products' },
          { id: 'prescriptions', label: 'Prescriptions' },
          { id: 'interactions', label: 'Interactions' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'regulations', label: 'Regulations' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Homeopathic Products Tab */}
      {selectedTab === 'products' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {homeopathicProducts.slice(0, 6).map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600">{product.scientific_name}</p>
                    </div>
                    <Badge variant={product.requires_prescription ? 'destructive' : 'secondary'}>
                      {product.requires_prescription ? 'Rx Required' : 'OTC'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Potency Range:</span>
                      <span className="text-sm font-medium">
                        {product.potency_range.min}X - {product.potency_range.max}C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Preparation:</span>
                      <span className="text-sm font-medium">{product.preparation_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shelf Life:</span>
                      <span className="text-sm font-medium">{product.shelf_life_months} months</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Therapeutic Uses:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.therapeutic_uses.slice(0, 3).map((use, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {use}
                          </Badge>
                        ))}
                        {product.therapeutic_uses.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.therapeutic_uses.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {selectedTab === 'prescriptions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Prescription management system coming soon...
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactions Tab */}
      {selectedTab === 'interactions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Interaction Checker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Medicine interaction checking system coming soon...
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {prescriptionTrends.map((trend, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{trend.status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{trend._count?.id || 0}</div>
                  <p className="text-sm text-gray-600">Prescriptions</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Popular Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Arnica Montana</span>
                  <Badge>Most Popular</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Nux Vomica</span>
                  <Badge variant="secondary">High Demand</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Rhus Toxicodendron</span>
                  <Badge variant="outline">Trending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regulations Tab */}
      {selectedTab === 'regulations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Schedule H Compliance</h4>
                    <p className="text-sm text-gray-600">All prescription medicines properly categorized</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium">Batch Tracking</h4>
                    <p className="text-sm text-gray-600">Complete batch traceability implemented</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-medium">Expiry Management</h4>
                    <p className="text-sm text-gray-600">Automated expiry alerts pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
