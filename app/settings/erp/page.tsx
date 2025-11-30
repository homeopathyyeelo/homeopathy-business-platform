'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, DollarSign, ShoppingCart, Package, FileText, TrendingUp, Building } from 'lucide-react';
import { golangAPI } from '@/lib/api';

interface ERPSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: string;
  category: string;
  label: string;
  description: string;
  isEditable: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  credit: DollarSign,
  pos: ShoppingCart,
  inventory: Package,
  gst: FileText,
  discount: TrendingUp,
  business: Building,
};

export default function ERPSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ERPSetting[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('credit');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  // Fetch all settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await golangAPI.get('/api/erp/erp-settings');
      const data = res.data?.data || [];
      setSettings(data);
      
      // Extract unique categories
      const cats = Array.from(new Set(data.map((s: ERPSetting) => s.category))) as string[];
      setCategories(cats.sort());
      
      if (cats.length > 0 && !cats.includes(activeCategory)) {
        setActiveCategory(cats[0] as string);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ERP settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (setting: ERPSetting) => {
    const newValue = editedValues[setting.settingKey];
    if (!newValue || newValue === setting.settingValue) {
      return;
    }

    setIsSaving(true);
    try {
      await golangAPI.put(`/api/erp/erp-settings/${setting.settingKey}`, {
        settingValue: newValue,
      });
      
      toast({
        title: 'Success',
        description: `${setting.label} updated successfully`,
      });
      
      // Update local state
      setSettings(prev =>
        prev.map(s =>
          s.settingKey === setting.settingKey ? { ...s, settingValue: newValue } : s
        )
      );
      
      // Clear edited value
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[setting.settingKey];
        return updated;
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update setting',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (Object.keys(editedValues).length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      const updates = Object.entries(editedValues).map(([key, value]) => ({
        key,
        value,
      }));

      await golangAPI.post('/api/erp/erp-settings/bulk-update', {
        settings: updates,
      });

      toast({
        title: 'Success',
        description: `${updates.length} settings updated successfully`,
      });

      // Update local state
      setSettings(prev =>
        prev.map(s => {
          const newValue = editedValues[s.settingKey];
          return newValue ? { ...s, settingValue: newValue } : s;
        })
      );

      setEditedValues({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (setting: ERPSetting) => {
    const currentValue = editedValues[setting.settingKey] ?? setting.settingValue;
    const hasChanges = editedValues[setting.settingKey] !== undefined;

    switch (setting.settingType) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue === 'true'}
            onCheckedChange={(checked) =>
              handleValueChange(setting.settingKey, checked ? 'true' : 'false')
            }
            disabled={!setting.isEditable || isSaving}
          />
        );
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleValueChange(setting.settingKey, e.target.value)}
              disabled={!setting.isEditable || isSaving}
              className="max-w-[200px]"
              step="any"
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(setting)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <Input
              value={currentValue}
              onChange={(e) => handleValueChange(setting.settingKey, e.target.value)}
              disabled={!setting.isEditable || isSaving}
              className="max-w-md"
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(setting)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            )}
          </div>
        );
    }
  };

  const getCategorySettings = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || Settings;
    return <Icon className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ERP Settings</h1>
          <p className="text-muted-foreground mt-2">
            Centralized configuration for POS, Credit, GST, Inventory and more
          </p>
        </div>
        {Object.keys(editedValues).length > 0 && (
          <Button onClick={handleBulkSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Changes ({Object.keys(editedValues).length})
          </Button>
        )}
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="flex items-center gap-2">
              {getCategoryIcon(cat)}
              {getCategoryLabel(cat)}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(cat)}
                  {getCategoryLabel(cat)} Settings
                </CardTitle>
                <CardDescription>
                  Configure {getCategoryLabel(cat).toLowerCase()} related parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getCategorySettings(cat).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No settings available in this category
                  </div>
                ) : (
                  getCategorySettings(cat).map(setting => (
                    <div
                      key={setting.settingKey}
                      className="flex items-start justify-between gap-4 py-4 border-b last:border-0"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold">
                            {setting.label}
                          </Label>
                          {!setting.isEditable && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Read-only
                            </span>
                          )}
                          {editedValues[setting.settingKey] !== undefined && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Modified
                            </span>
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="px-2 py-1 bg-gray-100 rounded">
                            {setting.settingKey}
                          </code>
                          <span>•</span>
                          <span>Type: {setting.settingType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderSettingInput(setting)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            How ERP Settings Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>
            • <strong>Credit Settings:</strong> Control customer credit periods, interest rates, and grace periods
          </p>
          <p>
            • <strong>POS Settings:</strong> Default tax rates, printer settings, and billing behaviors
          </p>
          <p>
            • <strong>Inventory:</strong> Low stock thresholds, expiry alerts, batch selection methods
          </p>
          <p>
            • <strong>GST:</strong> E-Invoice and E-Way Bill configurations
          </p>
          <p>
            • <strong>Changes take effect immediately</strong> across all POS terminals and modules
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
