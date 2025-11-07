import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Plus, MapPin, Users, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContactData {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  contact_type: string;
  category: string;
  city: string;
  area: string;
  society: string;
  is_doctor: boolean;
  is_existing_customer: boolean;
  is_subscribed: boolean; // Added missing property
}

const EnhancedImportContacts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Manual contact form
  const [manualContact, setManualContact] = useState<ContactData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    contact_type: '',
    category: '',
    city: '',
    area: '',
    society: '',
    is_doctor: false,
    is_existing_customer: false,
    is_subscribed: true // Initialize with default value
  });

  const FIELD_OPTIONS = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'phone_number', label: 'Phone Number' },
    { value: 'email', label: 'Email' },
    { value: 'contact_type', label: 'Contact Type' },
    { value: 'category', label: 'Category' },
    { value: 'city', label: 'City' },
    { value: 'area', label: 'Area' },
    { value: 'society', label: 'Society' },
    { value: 'skip', label: 'Skip This Column' }
  ];

  const CONTACT_CATEGORIES = [
    'doctor', 'patient', 'pharmacy', 'wholesaler', 
    'clinic', 'hospital', 'distributor', 'retailer'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }).filter(row => Object.values(row).some(value => value !== ''));

      setCsvData(data);
      setPreviewData(data);
      
      // Auto-map common field names
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
          autoMapping[header] = 'first_name';
        } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
          autoMapping[header] = 'last_name';
        } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) {
          autoMapping[header] = 'phone_number';
        } else if (lowerHeader.includes('email')) {
          autoMapping[header] = 'email';
        } else if (lowerHeader.includes('city')) {
          autoMapping[header] = 'city';
        } else if (lowerHeader.includes('area')) {
          autoMapping[header] = 'area';
        } else if (lowerHeader.includes('category') || lowerHeader.includes('type')) {
          autoMapping[header] = 'category';
        }
      });
      
      setFieldMapping(autoMapping);
    };
    
    reader.readAsText(file);
  };

  const importContacts = useMutation({
    mutationFn: async (contacts: any[]) => {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .insert(contacts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-contacts'] });
      toast({
        title: "Contacts imported",
        description: `Successfully imported ${data.length} contacts.`
      });
      // Reset form
      setCsvFile(null);
      setCsvData([]);
      setFieldMapping({});
      setPreviewData([]);
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addManualContact = useMutation({
    mutationFn: async (contact: ContactData) => {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-contacts'] });
      toast({
        title: "Contact added",
        description: "Contact has been added successfully."
      });
      // Reset form
      setManualContact({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        contact_type: '',
        category: '',
        city: '',
        area: '',
        society: '',
        is_doctor: false,
        is_existing_customer: false,
        is_subscribed: true // Reset with default
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleImport = () => {
    if (csvData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please upload a CSV file first.",
        variant: "destructive"
      });
      return;
    }

    // Map CSV data to contact format
    const mappedContacts = csvData.map(row => {
      const contact: any = {
        is_subscribed: true,
        is_doctor: false,
        is_existing_customer: false
      };

      Object.entries(fieldMapping).forEach(([csvField, dbField]) => {
        if (dbField !== 'skip' && row[csvField]) {
          if (dbField === 'is_doctor' || dbField === 'is_existing_customer') {
            contact[dbField] = row[csvField].toLowerCase() === 'true' || row[csvField] === '1';
          } else {
            contact[dbField] = row[csvField];
          }
        }
      });

      return contact;
    }).filter(contact => contact.phone_number); // Only import contacts with phone numbers

    importContacts.mutate(mappedContacts);
  };

  const handleManualSubmit = () => {
    if (!manualContact.first_name || !manualContact.phone_number) {
      toast({
        title: "Missing required fields",
        description: "Please fill in at least the name and phone number.",
        variant: "destructive"
      });
      return;
    }

    addManualContact.mutate(manualContact);
  };

  const downloadTemplate = () => {
    const csvContent = [
      'first_name,last_name,phone_number,email,category,city,area,society',
      'John,Doe,+919876543310,john.doe@email.com,doctor,Gurgaon,Sohna,Green Valley',
      'Jane,Smith,+919876543311,jane.smith@email.com,patient,Delhi,CP,Central Plaza'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Contacts</h2>
          <p className="text-muted-foreground">Add contacts to your marketing database</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-sm font-medium">Choose CSV file</span>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a CSV file with contact information
                </p>
                {csvFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Field Mapping */}
          {csvData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Map CSV Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(csvData[0] || {}).map((csvField) => (
                    <div key={csvField}>
                      <Label htmlFor={`mapping-${csvField}`}>
                        CSV Field: <strong>{csvField}</strong>
                      </Label>
                      <Select
                        value={fieldMapping[csvField] || ''}
                        onValueChange={(value) => 
                          setFieldMapping(prev => ({ ...prev, [csvField]: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database field" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={handleImport} 
                    disabled={importContacts.isPending}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import {csvData.length} Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={manualContact.first_name}
                    onChange={(e) => setManualContact(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={manualContact.last_name}
                    onChange={(e) => setManualContact(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={manualContact.phone_number}
                    onChange={(e) => setManualContact(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+919876543310"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={manualContact.email}
                    onChange={(e) => setManualContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={manualContact.category}
                    onValueChange={(value) => setManualContact(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={manualContact.city}
                    onChange={(e) => setManualContact(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={manualContact.area}
                    onChange={(e) => setManualContact(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Enter area/locality"
                  />
                </div>
                <div>
                  <Label htmlFor="society">Society/Building</Label>
                  <Input
                    id="society"
                    value={manualContact.society}
                    onChange={(e) => setManualContact(prev => ({ ...prev, society: e.target.value }))}
                    placeholder="Enter society or building name"
                  />
                </div>
              </div>

              <Button 
                onClick={handleManualSubmit} 
                disabled={addManualContact.isPending}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedImportContacts;
