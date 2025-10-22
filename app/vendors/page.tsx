"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, FileDown, Building2, TrendingUp, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useVendors, useVendorTypes, useVendorStats, useVendorMutations } from "@/lib/hooks/vendors"

export default function VendorsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "distributor",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
    payment_terms: "",
    credit_limit: 0,
    rating: 0,
  })
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null)

  // Use React Query hooks
  const { data: vendors = [], isLoading } = useVendors()
  const { data: vendorTypes = [] } = useVendorTypes()
  const stats = useVendorStats(vendors)
  const { create, update, remove } = useVendorMutations()

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor: any) =>
    vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.phone && vendor.phone.includes(searchTerm)) ||
    (vendor.email && vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "distributor",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      gst_number: "",
      payment_terms: "",
      credit_limit: 0,
      rating: 0,
    })
    setEditingVendorId(null)
    setDeletingVendorId(null)
  }

  const handleAddVendor = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide at least name and phone number",
        variant: "destructive"
      })
      return
    }

    try {
      await create.mutateAsync(formData)
      toast({
        title: "Vendor Added",
        description: "Vendor has been added successfully"
      })
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive"
      })
    }
  }

  const handleEditVendor = (vendor: any) => {
    setFormData({
      name: vendor.name || "",
      type: vendor.type || vendor.vendor_type || "distributor",
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      gst_number: vendor.gst_number || "",
      payment_terms: vendor.payment_terms || "",
      credit_limit: vendor.credit_limit || 0,
      rating: vendor.rating || 0,
    })
    setEditingVendorId(vendor.id)
    setIsEditDialogOpen(true)
  }

  const handleUpdateVendor = async () => {
    if (!editingVendorId || !formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide at least name and phone number",
        variant: "destructive"
      })
      return
    }

    try {
      await update.mutateAsync({ id: editingVendorId, data: formData })
      toast({
        title: "Vendor Updated",
        description: "Vendor details have been updated successfully"
      })
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive"
      })
    }
  }

  const handleDeleteClick = (vendorId: string) => {
    setDeletingVendorId(vendorId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteVendor = async () => {
    if (!deletingVendorId) return

    try {
      await remove.mutateAsync(deletingVendorId)
      toast({
        title: "Vendor Deleted",
        description: "Vendor has been deleted successfully"
      })
      setIsDeleteDialogOpen(false)
      setDeletingVendorId(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive"
      })
    }
  }

  const exportVendors = () => {
    toast({
      title: "Export Started",
      description: "Vendor data is being prepared for download"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Vendor Management</h2>
        <div className="flex space-x-2">
          <Button onClick={exportVendors} variant="outline" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Total Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Active Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manufacturers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manufacturers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, contact person, phone or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    Loading vendors...
                  </TableCell>
                </TableRow>
              ) : filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((vendor: any) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant={vendor.type === 'manufacturer' ? 'default' : 'secondary'}>
                        {vendor.type === 'manufacturer' ? 'Manufacturer' : 'Distributor'}
                      </Badge>
                    </TableCell>
                    <TableCell>{vendor.contact_person || 'N/A'}</TableCell>
                    <TableCell>
                      <div>{vendor.phone}</div>
                      {vendor.email && <div className="text-xs text-muted-foreground">{vendor.email}</div>}
                    </TableCell>
                    <TableCell>{vendor.gst_number || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(vendor.credit_limit || 0)}</TableCell>
                    <TableCell className="text-right">
                      {vendor.outstanding > 0 ? (
                        <span className="text-red-600">{formatCurrency(vendor.outstanding)}</span>
                      ) : <span className="text-green-600">0</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-sm mr-1"></span>
                        <span className="text-sm">{vendor.rating || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditVendor(vendor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vendor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Vendor Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input id="gst_number" name="gst_number" value={formData.gst_number} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit</Label>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Textarea id="payment_terms" name="payment_terms" value={formData.payment_terms} onChange={handleInputChange} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVendor}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Vendor Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Vendor Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact_person">Contact Person</Label>
              <Input id="edit-contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input id="edit-phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gst_number">GST Number</Label>
              <Input id="edit-gst_number" name="gst_number" value={formData.gst_number} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-credit_limit">Credit Limit</Label>
              <Input
                id="edit-credit_limit"
                name="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rating">Rating (1-5)</Label>
              <Input
                id="edit-rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea id="edit-address" name="address" value={formData.address} onChange={handleInputChange} rows={3} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-payment_terms">Payment Terms</Label>
              <Textarea id="edit-payment_terms" name="payment_terms" value={formData.payment_terms} onChange={handleInputChange} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateVendor}>Update Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this vendor? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVendor}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
