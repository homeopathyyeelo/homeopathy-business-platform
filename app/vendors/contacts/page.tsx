'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVendors } from "@/lib/hooks/vendors";

interface VendorContact {
  id: string;
  vendor_id: string;
  vendor_name: string;
  contact_person: string;
  designation: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

export default function VendorContactsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    vendor_id: "",
    contact_person: "",
    designation: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    is_primary: false,
  });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Use React Query hooks
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors();

  // Mock contacts data for now
  const [contacts, setContacts] = useState<VendorContact[]>([
    {
      id: '1',
      vendor_id: '1',
      vendor_name: 'ABC Pharmaceuticals',
      contact_person: 'Rajesh Kumar',
      designation: 'Sales Manager',
      phone: '+91 98765 43210',
      email: 'rajesh@abcpharma.com',
      address: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      is_primary: true
    },
    {
      id: '2',
      vendor_id: '2',
      vendor_name: 'XYZ Distributors',
      contact_person: 'Priya Sharma',
      designation: 'Regional Head',
      phone: '+91 87654 32109',
      email: 'priya@xyzdist.com',
      address: '456 Business Park',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      is_primary: false
    }
  ]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact: VendorContact) =>
    contact.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      vendor_id: "",
      contact_person: "",
      designation: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      is_primary: false,
    });
    setEditingContactId(null);
  };

  const handleAddContact = () => {
    if (!formData.contact_person || !formData.phone || !formData.vendor_id) {
      toast({
        title: "Missing Information",
        description: "Please provide contact person, phone, and vendor",
        variant: "destructive"
      });
      return;
    }

    // For now, just show a toast - in real implementation, this would call an API
    toast({
      title: "Feature Coming Soon",
      description: "Vendor contact creation will be implemented with backend API"
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditContact = (contact: VendorContact) => {
    setFormData({
      vendor_id: contact.vendor_id,
      contact_person: contact.contact_person,
      designation: contact.designation,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      pincode: contact.pincode,
      is_primary: contact.is_primary,
    });
    setEditingContactId(contact.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = () => {
    if (!formData.contact_person || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide contact person and phone",
        variant: "destructive"
      });
      return;
    }

    // For now, just show a toast - in real implementation, this would call an API
    toast({
      title: "Feature Coming Soon",
      description: "Vendor contact update will be implemented with backend API"
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Vendor Contacts</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Active Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Set(contacts.map(c => c.vendor_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Primary Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.is_primary).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">States Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(contacts.map(c => c.state)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
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
                <TableHead>Vendor</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact: VendorContact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.vendor_name}</TableCell>
                  <TableCell>{contact.contact_person}</TableCell>
                  <TableCell>{contact.designation}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-1" />
                        {contact.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1" />
                        {contact.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      {contact.city}, {contact.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.is_primary ? 'default' : 'secondary'}>
                      {contact.is_primary ? 'Primary' : 'Secondary'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditContact(contact)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vendor Contact</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor *</Label>
              <Select value={formData.vendor_id} onValueChange={(value) => handleSelectChange('vendor_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" value={formData.designation} onChange={handleInputChange} />
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
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContact}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor Contact</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor_id">Vendor *</Label>
              <Select value={formData.vendor_id} onValueChange={(value) => handleSelectChange('vendor_id', value)}>
                <SelectTrigger id="edit-vendor_id">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact_person">Contact Person *</Label>
              <Input id="edit-contact_person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <Input id="edit-designation" name="designation" value={formData.designation} onChange={handleInputChange} />
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
              <Label htmlFor="edit-pincode">Pincode</Label>
              <Input id="edit-pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" name="city" value={formData.city} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State</Label>
              <Input id="edit-state" name="state" value={formData.state} onChange={handleInputChange} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea id="edit-address" name="address" value={formData.address} onChange={handleInputChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateContact}>Update Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
