'use client';

import { useState } from 'react';
import { Globe, Plus, Search, LogIn, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VendorPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const portalAccess = [
    {
      id: 1,
      vendorName: 'SBL Pharmaceuticals',
      email: 'sbl@vendor.com',
      status: 'Active',
      lastLogin: '2024-11-30 09:15 AM'
    },
    {
      id: 2,
      vendorName: 'Dr. Reckeweg & Co',
      email: 'reckeweg@vendor.com',
      status: 'Active',
      lastLogin: '2024-11-29 03:45 PM'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Portal</h1>
            <p className="text-gray-500">Manage vendor access to portal</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portal Access List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Portal Access</CardTitle>
          <CardDescription>Manage vendor login credentials and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portalAccess.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                <div>
                  <h3 className="font-medium">{vendor.vendorName}</h3>
                  <p className="text-sm text-gray-500">{vendor.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <LogIn className="h-3 w-3" />
                      {vendor.lastLogin}
                    </div>
                  </div>
                  <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                    {vendor.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <KeyRound className="h-3 w-3 mr-1" />
                    Reset Password
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
