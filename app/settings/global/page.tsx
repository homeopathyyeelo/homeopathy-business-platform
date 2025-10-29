'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSystemSettings, useSystemSettingMutations, SystemSetting } from '@/lib/hooks/settings';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RotateCcw, Loader2 } from 'lucide-react';

const SETTING_CATEGORIES = [
  { id: 'ui', label: 'UI Settings', description: 'Default UI behaviors and preferences' },
  { id: 'pagination', label: 'Pagination & Listing', description: 'Global listing defaults' },
  { id: 'defaults', label: 'Defaults & Preferences', description: 'Pre-filled defaults across modules' },
  { id: 'inventory', label: 'Inventory & Stock', description: 'Core inventory behaviors' },
  { id: 'sales', label: 'Sales & Purchase', description: 'Default billing & PO rules' },
  { id: 'finance', label: 'Finance Settings', description: 'Global finance rules' },
  { id: 'notifications', label: 'Notification Rules', description: 'AI & event triggers' },
  { id: 'ai', label: 'AI & Automation', description: 'Agent tuning parameters' },
  { id: 'system', label: 'System Behavior', description: 'Maintenance & performance' },
];

interface SettingEditorProps {
  setting: SystemSetting;
  onUpdate: (key: string, value: string) => void;
  isUpdating: boolean;
}

function SettingEditor({ setting, onUpdate, isUpdating }: SettingEditorProps) {
  const [localValue, setLocalValue] = useState(setting.value);

  const handleSave = () => {
    if (localValue !== setting.value) {
      onUpdate(setting.key, localValue);
    }
  };

  const renderInput = () => {
    switch (setting.data_type) {
      case 'boolean':
        return (
          <Switch
            checked={localValue === 'true'}
            onCheckedChange={(checked) => setLocalValue(checked ? 'true' : 'false')}
            disabled={!setting.is_editable || isUpdating}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            disabled={!setting.is_editable || isUpdating}
            className="max-w-xs"
          />
        );
      case 'json':
        return (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            disabled={!setting.is_editable || isUpdating}
            className="w-full p-2 border rounded-md font-mono text-sm min-h-[100px]"
          />
        );
      default:
        return (
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            disabled={!setting.is_editable || isUpdating}
            className="max-w-md"
          />
        );
    }
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Label className="font-semibold">{setting.key}</Label>
          {setting.is_system && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">System</span>
          )}
          {!setting.is_editable && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Read-only</span>
          )}
        </div>
        {setting.description && (
          <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
        )}
        <div className="flex items-center gap-2">
          {renderInput()}
          {setting.is_editable && localValue !== setting.value && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Type: {setting.data_type} • Last updated: {new Date(setting.updated_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function GlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState('ui');
  const { toast } = useToast();
  const { data, isLoading } = useSystemSettings({ category: activeTab, limit: 100 });
  const { update } = useSystemSettingMutations();

  const handleUpdate = async (key: string, value: string) => {
    try {
      await update.mutateAsync({
        key,
        data: { value },
      });
      toast({
        title: 'Setting Updated',
        description: `${key} has been updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update setting',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global ERP Settings</h1>
            <p className="text-gray-600">Centralized configuration for system-wide defaults and constants</p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>
            Modify ERP-wide parameters. Changes apply immediately to all modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-2 h-auto">
              {SETTING_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-sm">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {SETTING_CATEGORIES.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{cat.label}</h3>
                  <p className="text-sm text-gray-600">{cat.description}</p>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : data?.settings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No settings found for this category.</p>
                    <p className="text-sm mt-2">Settings can be added via the API or database.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data?.settings.map((setting) => (
                      <SettingEditor
                        key={setting.id}
                        setting={setting}
                        onUpdate={handleUpdate}
                        isUpdating={update.isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Integration Points</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• All microservices load settings at boot from <code className="bg-blue-100 px-1 rounded">api-core/settings</code></p>
          <p>• Frontend auto-refreshes cached config via SWR hooks</p>
          <p>• Kafka event <code className="bg-blue-100 px-1 rounded">settings.updated</code> triggers reload across all services</p>
          <p>• Settings are cached in Redis with key pattern: <code className="bg-blue-100 px-1 rounded">erp_settings:*</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
