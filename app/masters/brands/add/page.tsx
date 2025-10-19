"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AddBrandPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    country: '',
    website: '',
    logo_url: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Brand created successfully');
    router.push('/masters/brands');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Brand</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., SBL, Dr. Reckeweg"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="code">Brand Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., SBL, RECK"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="e.g., Germany, India"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter brand description"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Brand
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
