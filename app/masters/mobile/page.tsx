'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Smartphone, Camera, MapPin, Bell, Wifi, WifiOff, Search, Plus } from "lucide-react"

export default function MobileAppFeatures() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Low Stock Alert", message: "Arnica Montana 30C running low", type: "warning" },
    { id: 2, title: "Order Update", message: "Order #12345 has been shipped", type: "info" },
    { id: 3, title: "Prescription Reminder", message: "Patient follow-up due tomorrow", type: "reminder" }
  ])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
            <h2 className="text-3xl font-bold tracking-tight">Mobile App Features</h2>
            <p className="text-gray-600">Mobile-first features for field operations and customer service</p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              {isOnline ? (
                <Wifi className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 mr-2 text-red-600" />
              )}
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-sm text-gray-600">
              {isOnline ? 'Connected to server' : 'Using offline mode'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Location Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {location ? 'Active' : 'Disabled'}
            </div>
            <p className="text-sm text-gray-600">
              {location ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : 'Location access required'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2 text-orange-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-sm text-gray-600">Active notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-blue-600" />
              Barcode Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Scan product barcodes for instant inventory lookup and stock management
            </p>
            <Button className="w-full">Scan Product</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2 text-green-600" />
              Medicine Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="w-full">Search</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-purple-600" />
              Quick Prescribe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create prescriptions on-the-go with symptom-based medicine suggestions
            </p>
            <Button className="w-full">Start Prescription</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Badge variant={
                    notification.type === 'warning' ? 'destructive' :
                    notification.type === 'info' ? 'default' : 'secondary'
                  }>
                    {notification.type}
                  </Badge>
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Offline Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Product Catalog</p>
                  <p className="text-sm text-gray-600">Access full product database offline</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Customer Records</p>
                  <p className="text-sm text-gray-600">View customer history offline</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Prescription Creation</p>
                  <p className="text-sm text-gray-600">Create prescriptions offline</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Inventory Check</p>
                  <p className="text-sm text-gray-600">Check stock levels offline</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Sales Recording</p>
                  <p className="text-sm text-gray-600">Record sales for later sync</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Order Management</p>
                  <p className="text-sm text-gray-600">Manage orders offline</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Specific Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GPS-Enabled Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm">Live Tracking</span>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm">Route Optimization</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm">ETA Calculation</span>
                <Badge variant="outline">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span className="text-sm">Voice Search</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span className="text-sm">Dictate Notes</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span className="text-sm">Voice Prescriptions</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile App Screenshots/Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile App Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded bg-gray-50">
              <Smartphone className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Medicine Scanner</p>
              <p className="text-xs text-gray-600">Scan & identify medicines instantly</p>
            </div>
            <div className="text-center p-4 border rounded bg-gray-50">
              <Smartphone className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Prescription Creator</p>
              <p className="text-xs text-gray-600">Create prescriptions on-the-go</p>
            </div>
            <div className="text-center p-4 border rounded bg-gray-50">
              <Smartphone className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Inventory Tracker</p>
              <p className="text-xs text-gray-600">Real-time stock monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
