'use client'

import { useState, useEffect } from 'react'

interface Vendor {
  id: string
  vendorCode: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  gstNumber: string
  paymentTerms: number
  creditLimit: number
  isActive: boolean
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    paymentTerms: 30,
    creditLimit: 0
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const response = await fetch('http://localhost:3001/purchase/vendors')
      const data = await response.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Error loading vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const createVendor = async () => {
    try {
      const response = await fetch('http://localhost:3001/purchase/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vendorCode: `VEN${Date.now()}`
        })
      })
      
      if (response.ok) {
        setShowDialog(false)
        loadVendors()
        setFormData({
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          gstNumber: '',
          paymentTerms: 30,
          creditLimit: 0
        })
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      <p className="text-sm text-gray-600">{vendor.contactPerson}</p>
                      <p className="text-sm">{vendor.email} | {vendor.phone}</p>
                      <p className="text-sm text-gray-500">GST: {vendor.gstNumber}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm">Payment Terms: {vendor.paymentTerms} days</span>
                        <span className="text-sm">Credit Limit: ₹{vendor.creditLimit?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Vendor Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Input
              placeholder="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Input
              placeholder="GST Number"
              value={formData.gstNumber}
              onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
            />
            <Input
              placeholder="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
            />
            <Button onClick={createVendor} className="w-full">Save Vendor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
