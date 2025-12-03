"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/settings/UserManagement";
import EmailManagement from "@/components/settings/EmailManagement";
import WhatsAppTemplates from "@/components/settings/WhatsAppTemplates";
import { DatabaseSettings } from "@/components/settings/DatabaseSettings";
import { authFetch } from '@/lib/api/fetch-utils';
import { apiFetch } from '@/lib/utils/api-fetch';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    id: '',
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
      // 1. Load company info
      const companyResponse = await apiFetch('/api/erp/companies?limit=1');
      if (!companyResponse.ok) throw new Error('Failed to load company info');

      const companyResult = await companyResponse.json();
      const company = companyResult.success && companyResult.data && companyResult.data.length > 0 
        ? companyResult.data[0] 
        : null;

      // 2. Load API keys from app_settings
      const settingsResponse = await apiFetch('/api/erp/settings');
      const settingsResult = settingsResponse.ok ? await settingsResponse.json() : { data: [] };
      const settings = settingsResult.data || [];

      // Helper to get setting value
      const getSetting = (key: string) => {
        const setting = settings.find((s: any) => s.key === key);
        if (!setting || !setting.value) return '';
        try {
          // Values are stored as JSON, so we need to parse them
          const parsed = JSON.parse(setting.value);
          return typeof parsed === 'string' ? parsed : '';
        } catch {
          return '';
        }
      };

      setConfig({
        id: company?.id || '',
        company_name: company?.name || '',
        company_address: company?.address || '',
        company_phone: company?.phone || '',
        company_email: company?.email || '',
        gst_number: company?.gstin || '',
        whatsapp_api_key: getSetting('whatsapp.apiKey'),
        kaleyra_api_key: getSetting('sms.kaleyra.apiKey'),
        email_api_key: getSetting('email.apiKey'),
        facebook_access_token: getSetting('social.facebook.accessToken'),
        instagram_access_token: getSetting('social.instagram.accessToken')
      });
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
      // 1. Save company info
      const companyData = {
        name: config.company_name,
        address: config.company_address,
        phone: config.company_phone,
        email: config.company_email,
        gstin: config.gst_number,
      };

      let companyResponse;
      if (config.id) {
        companyResponse = await apiFetch(`/api/erp/companies/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        });
      } else {
        companyResponse = await apiFetch('/api/erp/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...companyData, code: 'DEFAULT' })
        });
      }

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json();
        throw new Error(errorData.error || 'Failed to save company info');
      }

      const companyResult = await companyResponse.json();
      if (companyResult.success && !config.id && companyResult.data?.id) {
        setConfig(prev => ({ ...prev, id: companyResult.data.id }));
      }

      // 2. Save all API keys and settings to app_settings
      const settingsToSave = [
        {
          key: 'whatsapp.apiKey',
          value: config.whatsapp_api_key,
          category: 'whatsapp',
          type: 'string',
          description: 'WhatsApp Business API key',
          is_secret: true
        },
        {
          key: 'sms.kaleyra.apiKey',
          value: config.kaleyra_api_key,
          category: 'sms',
          type: 'string',
          description: 'Kaleyra SMS API key',
          is_secret: true
        },
        {
          key: 'email.apiKey',
          value: config.email_api_key,
          category: 'email',
          type: 'string',
          description: 'Email service API key',
          is_secret: true
        },
        {
          key: 'social.facebook.accessToken',
          value: config.facebook_access_token,
          category: 'social',
          type: 'string',
          description: 'Facebook Page Access Token',
          is_secret: true
        },
        {
          key: 'social.instagram.accessToken',
          value: config.instagram_access_token,
          category: 'social',
          type: 'string',
          description: 'Instagram Access Token',
          is_secret: true
        }
      ];

      const settingsResponse = await apiFetch('/api/erp/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json();
        throw new Error(errorData.error || 'Failed to save API keys');
      }
        
      toast({
        title: "Success",
        description: "All settings saved successfully to database",
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <DatabaseSettings />
        </TabsContent>

        <TabsContent value="apikeys" className="space-y-6">
          <APIKeysSettings />
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

        <TabsContent value="printer" className="space-y-6">
          <PrinterSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrinterSettings() {
  const [paperSize, setPaperSize] = useState("3x5");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPrinterSettings();
  }, []);

  const loadPrinterSettings = async () => {
    try {
      const res = await apiFetch('/api/erp/settings/pos.printer.paperSize');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.value) {
          // Value is stored as JSON string in backend, but might be returned as parsed JSON if using json.RawMessage?
          // The backend handler returns `value` as json.RawMessage.
          // If it was saved as "3x5" (string), it comes back as "3x5".
          // If it was saved as "\"3x5\"", it comes back as "3x5".
          // Let's handle both.
          let val = data.data.value;
          if (typeof val === 'string' && (val === '"3x5"' || val === '"4x6"')) {
            val = JSON.parse(val);
          }
          setPaperSize(val);
        }
      }
    } catch (e) {
      console.error("Failed to load printer settings", e);
    }
  };

  const savePrinterSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/erp/settings/pos.printer.paperSize', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: paperSize, // Will be JSON encoded by stringify
          category: 'pos',
          type: 'string',
          description: 'Thermal printer paper size preference'
        })
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({ title: "Success", description: "Printer settings saved" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save printer settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Printer Configuration</CardTitle>
        <CardDescription>Configure thermal printer settings for POS receipts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Paper Size</Label>
          <div className="flex gap-4">
            <Button
              variant={paperSize === "3x5" ? "default" : "outline"}
              onClick={() => setPaperSize("3x5")}
              className="w-32"
            >
              3" x 5" (Default)
            </Button>
            <Button
              variant={paperSize === "4x6" ? "default" : "outline"}
              onClick={() => setPaperSize("4x6")}
              className="w-32"
            >
              4" x 6"
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Select the paper size loaded in your thermal printer.
            3x5 is standard for most receipts. 4x6 allows for more detailed columns.
          </p>
        </div>
        <Button onClick={savePrinterSettings} disabled={loading}>
          {loading ? "Saving..." : "Save Printer Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// API Keys & Credentials Management Component
function APIKeysSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState({
    // OpenAI / AI Services
    'ai.openai.apiKey': '',
    'ai.openai.model': 'gpt-4',

    // Database
    'database.password': '',

    // Email Services
    'email.smtp.host': '',
    'email.smtp.port': '587',
    'email.smtp.user': '',
    'email.smtp.password': '',

    // WhatsApp / SMS
    'whatsapp.apiKey': '',
    'sms.kaleyra.apiKey': '',

    // Payment Gateways
    'payment.razorpay.keyId': '',
    'payment.razorpay.keySecret': '',
    'payment.stripe.publishableKey': '',
    'payment.stripe.secretKey': '',

    // Social Media
    'social.facebook.accessToken': '',
    'social.instagram.accessToken': '',

    // Other Services
    'maps.google.apiKey': '',
    'storage.s3.accessKey': '',
    'storage.s3.secretKey': '',
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const res = await apiFetch('/api/erp/settings?category=ai,database,email,whatsapp,sms,payment,social,maps,storage');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const loadedKeys: any = {};
          data.data.forEach((setting: any) => {
            if (setting.value) {
              try {
                loadedKeys[setting.key] = JSON.parse(setting.value);
              } catch {
                loadedKeys[setting.key] = setting.value;
              }
            }
          });
          setKeys(prev => ({ ...prev, ...loadedKeys }));
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const saveAPIKey = async (key: string, value: string) => {
    try {
      const category = key.split('.')[0];
      const res = await apiFetch(`/api/erp/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: value,
          category: category,
          type: 'string',
          description: `API key for ${key}`
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({
        title: "Success",
        description: `${key} saved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${key}`,
        variant: "destructive"
      });
    }
  };

  const saveAllKeys = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(keys).map(([key, value]) => {
        if (value) {
          return saveAPIKey(key, value);
        }
      });
      await Promise.all(promises);

      toast({
        title: "Success",
        description: "All API keys saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save some API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKey = (key: string, value: string) => {
    setKeys(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All sensitive credentials are stored encrypted in the database.
          Never commit API keys to version control or share them publicly.
        </AlertDescription>
      </Alert>

      {/* AI Services */}
      <Card>
        <CardHeader>
          <CardTitle>AI Services</CardTitle>
          <CardDescription>
            Configure AI and machine learning service credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={keys['ai.openai.apiKey']}
                onChange={(e) => updateKey('ai.openai.apiKey', e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-model">OpenAI Model</Label>
              <Input
                id="openai-model"
                value={keys['ai.openai.model']}
                onChange={(e) => updateKey('ai.openai.model', e.target.value)}
                placeholder="gpt-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Services */}
      <Card>
        <CardHeader>
          <CardTitle>Email Services (SMTP)</CardTitle>
          <CardDescription>
            Configure SMTP settings for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={keys['email.smtp.host']}
                onChange={(e) => updateKey('email.smtp.host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                value={keys['email.smtp.port']}
                onChange={(e) => updateKey('email.smtp.port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                value={keys['email.smtp.user']}
                onChange={(e) => updateKey('email.smtp.user', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                value={keys['email.smtp.password']}
                onChange={(e) => updateKey('email.smtp.password', e.target.value)}
                placeholder="App password"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp & SMS */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp & SMS Services</CardTitle>
          <CardDescription>
            Configure messaging service credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>WhatsApp API Key</Label>
              <Input
                type="password"
                value={keys['whatsapp.apiKey']}
                onChange={(e) => updateKey('whatsapp.apiKey', e.target.value)}
                placeholder="WhatsApp Business API key"
              />
            </div>
            <div className="space-y-2">
              <Label>Kaleyra SMS API Key</Label>
              <Input
                type="password"
                value={keys['sms.kaleyra.apiKey']}
                onChange={(e) => updateKey('sms.kaleyra.apiKey', e.target.value)}
                placeholder="Kaleyra API key"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateways */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Configure payment gateway credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Razorpay</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key ID</Label>
                <Input
                  value={keys['payment.razorpay.keyId']}
                  onChange={(e) => updateKey('payment.razorpay.keyId', e.target.value)}
                  placeholder="rzp_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Key Secret</Label>
                <Input
                  type="password"
                  value={keys['payment.razorpay.keySecret']}
                  onChange={(e) => updateKey('payment.razorpay.keySecret', e.target.value)}
                  placeholder="Secret key"
                />
              </div>
            </div>

            <h4 className="font-medium mt-4">Stripe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Publishable Key</Label>
                <Input
                  value={keys['payment.stripe.publishableKey']}
                  onChange={(e) => updateKey('payment.stripe.publishableKey', e.target.value)}
                  placeholder="pk_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  value={keys['payment.stripe.secretKey']}
                  onChange={(e) => updateKey('payment.stripe.secretKey', e.target.value)}
                  placeholder="sk_..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Services */}
      <Card>
        <CardHeader>
          <CardTitle>Other Services</CardTitle>
          <CardDescription>
            Additional service credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Google Maps API Key</Label>
              <Input
                type="password"
                value={keys['maps.google.apiKey']}
                onChange={(e) => updateKey('maps.google.apiKey', e.target.value)}
                placeholder="Google Maps API key"
              />
            </div>
            <div className="space-y-2">
              <Label>AWS S3 Access Key</Label>
              <Input
                value={keys['storage.s3.accessKey']}
                onChange={(e) => updateKey('storage.s3.accessKey', e.target.value)}
                placeholder="AWS access key"
              />
            </div>
            <div className="space-y-2">
              <Label>AWS S3 Secret Key</Label>
              <Input
                type="password"
                value={keys['storage.s3.secretKey']}
                onChange={(e) => updateKey('storage.s3.secretKey', e.target.value)}
                placeholder="AWS secret key"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveAllKeys} disabled={loading} size="lg">
          {loading ? "Saving..." : "Save All API Keys"}
        </Button>
      </div>
    </div>
  );
}
