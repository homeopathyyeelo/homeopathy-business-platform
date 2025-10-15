"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/settings/UserManagement";
import EmailManagement from "@/components/settings/EmailManagement";
import WhatsAppTemplates from "@/components/settings/WhatsAppTemplates";
import { DatabaseSettings } from "@/components/settings/DatabaseSettings";

export default function SettingsPage() {
  const [config, setConfig] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    gst_number: '',
    whatsapp_api_key: '',
    kaleyra_api_key: '',
    email_api_key: '',
    facebook_access_token: '',
    instagram_access_token: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/settings/company');
      if (!response.ok) throw new Error('Failed to load configuration');
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage system configuration, users, and integrations.
        </p>
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <DatabaseSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Configure your company details for invoices and documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={config.company_name}
                    onChange={(e) => handleConfigChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={config.gst_number}
                    onChange={(e) => handleConfigChange('gst_number', e.target.value)}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Input
                  id="company_address"
                  value={config.company_address}
                  onChange={(e) => handleConfigChange('company_address', e.target.value)}
                  placeholder="Enter company address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_phone">Phone</Label>
                  <Input
                    id="company_phone"
                    value={config.company_phone}
                    onChange={(e) => handleConfigChange('company_phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={config.company_email}
                    onChange={(e) => handleConfigChange('company_email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email service settings for sending notifications and communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email_api_key">Email API Key</Label>
                <Input
                  id="email_api_key"
                  type="password"
                  value={config.email_api_key}
                  onChange={(e) => handleConfigChange('email_api_key', e.target.value)}
                  placeholder="Enter email service API key"
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </CardContent>
          </Card>
          <EmailManagement />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>
                Configure WhatsApp Business API for customer communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whatsapp_api_key">WhatsApp API Key</Label>
                <Input
                  id="whatsapp_api_key"
                  type="password"
                  value={config.whatsapp_api_key}
                  onChange={(e) => handleConfigChange('whatsapp_api_key', e.target.value)}
                  placeholder="Enter WhatsApp Business API key"
                />
              </div>
              <div>
                <Label htmlFor="kaleyra_api_key">Kaleyra SMS API Key</Label>
                <Input
                  id="kaleyra_api_key"
                  type="password"
                  value={config.kaleyra_api_key}
                  onChange={(e) => handleConfigChange('kaleyra_api_key', e.target.value)}
                  placeholder="Enter Kaleyra SMS API key"
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save WhatsApp Settings'}
              </Button>
            </CardContent>
          </Card>
          <WhatsAppTemplates />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing API Configuration</CardTitle>
              <CardDescription>
                Configure social media API keys for marketing campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook_access_token">Facebook Access Token</Label>
                <Input
                  id="facebook_access_token"
                  type="password"
                  value={config.facebook_access_token}
                  onChange={(e) => handleConfigChange('facebook_access_token', e.target.value)}
                  placeholder="Enter Facebook Page access token"
                />
              </div>
              <div>
                <Label htmlFor="instagram_access_token">Instagram Access Token</Label>
                <Input
                  id="instagram_access_token"
                  type="password"
                  value={config.instagram_access_token}
                  onChange={(e) => handleConfigChange('instagram_access_token', e.target.value)}
                  placeholder="Enter Instagram Business access token"
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save Marketing Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
