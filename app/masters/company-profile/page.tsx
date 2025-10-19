"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    website: '',
    logo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company profile updated successfully');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Company Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="company@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="www.company.com"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter complete address"
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              
              <div>
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={formData.pan}
                  onChange={(e) => setFormData({...formData, pan: e.target.value})}
                  placeholder="AAAAA0000A"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">Save Company Profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
