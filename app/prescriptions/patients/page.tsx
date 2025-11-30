'use client';

import { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrescriptionPatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const patients = [
    {
      id: 1,
      name: 'Amit Patel',
      age: 45,
      phone: '+91 98765 43210',
      email: 'amit@email.com',
      city: 'Mumbai',
      lastVisit: '2024-11-28',
      totalPrescriptions: 5
    },
    {
      id: 2,
      name: 'Sunita Verma',
      age: 38,
      phone: '+91 98765 43211',
      email: 'sunita@email.com',
      city: 'Delhi',
      lastVisit: '2024-11-30',
      totalPrescriptions: 3
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient List</h1>
            <p className="text-gray-500">Manage patient records and prescriptions</p>
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
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>All registered patients with prescription history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{patient.name}</h3>
                    <Badge variant="outline">{patient.age} yrs</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {patient.city}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900 font-medium">
                    {patient.totalPrescriptions} Prescriptions
                  </div>
                  <div className="text-xs text-gray-500">
                    Last visit: {patient.lastVisit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
