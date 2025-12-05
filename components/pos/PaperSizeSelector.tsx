"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Printer, Settings, CheckCircle2 } from 'lucide-react';

interface PrinterSettings {
  id?: string;
  counterId: string;
  counterName?: string;
  paperSize: '3x5' | '4x6';
  printerType: string;
  printerName?: string;
  autoPrint: boolean;
  copiesPerPrint: number;
  isActive: boolean;
}

interface PaperSizeSelectorProps {
  counterId?: string;
  onSettingsChange?: (settings: PrinterSettings) => void;
}

export default function PaperSizeSelector({ 
  counterId = 'COUNTER-1',
  onSettingsChange 
}: PaperSizeSelectorProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrinterSettings>({
    counterId: counterId,
    paperSize: '3x5',
    printerType: 'thermal',
    autoPrint: false,
    copiesPerPrint: 1,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [counterId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await golangAPI.get(`/api/erp/printer-settings/${counterId}`);
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
        if (onSettingsChange) {
          onSettingsChange(res.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load printer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await golangAPI.put(`/api/erp/printer-settings/${counterId}`, settings);
      if (res.data?.success) {
        toast({
          title: '✅ Settings Saved',
          description: 'Printer settings updated successfully',
        });
        if (onSettingsChange) {
          onSettingsChange(settings);
        }
      }
    } catch (error: any) {
      toast({
        title: '❌ Failed to Save',
        description: error.response?.data?.error || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaperSizeChange = (size: '3x5' | '4x6') => {
    const newSettings = { ...settings, paperSize: size };
    setSettings(newSettings);
    // Auto-save on paper size change
    setTimeout(() => {
      golangAPI.put(`/api/erp/printer-settings/${counterId}`, newSettings)
        .then(() => {
          if (onSettingsChange) {
            onSettingsChange(newSettings);
          }
        })
        .catch(console.error);
    }, 100);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading printer settings...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Printer Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Paper Size Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Paper Size</Label>
          <RadioGroup
            value={settings.paperSize}
            onValueChange={(value) => handlePaperSizeChange(value as '3x5' | '4x6')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3x5" id="size-3x5" />
              <Label htmlFor="size-3x5" className="cursor-pointer font-normal">
                <div className="flex items-center gap-2">
                  <div className="text-sm">3×5 inch</div>
                  <div className="text-xs text-gray-500">(Standard)</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="4x6" id="size-4x6" />
              <Label htmlFor="size-4x6" className="cursor-pointer font-normal">
                <div className="flex items-center gap-2">
                  <div className="text-sm">4×6 inch</div>
                  <div className="text-xs text-gray-500">(Wide)</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Paper Size Preview */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-xs text-gray-600 mb-2">Bill Layout Preview:</div>
          <div className="flex justify-center">
            {settings.paperSize === '3x5' ? (
              <div className="border-2 border-dashed border-gray-400 bg-white"
                   style={{ width: '180px', height: '300px' }}>
                <div className="p-2 text-[8px] leading-tight">
                  <div className="font-bold text-center mb-1">YEELO HOMEOPATHY</div>
                  <div className="text-center text-[7px]">Sohna, Gurugram</div>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div className="text-[7px]">ORDER: SO-2024-001</div>
                  <div className="text-[6px] text-gray-600">48 characters width</div>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div className="text-[6px]">Standard thermal receipt size</div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-400 bg-white"
                   style={{ width: '240px', height: '360px' }}>
                <div className="p-3 text-[9px] leading-tight">
                  <div className="font-bold text-center mb-1 text-sm">YEELO HOMEOPATHY</div>
                  <div className="text-center text-[8px]">Sohna, Gurugram</div>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div className="text-[8px]">ORDER: SO-2024-001</div>
                  <div className="text-[7px] text-gray-600">64 characters width</div>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div className="text-[7px]">Wider format, more details per line</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Print Option */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-print" className="text-sm">Auto-print on order completion</Label>
          <Switch
            id="auto-print"
            checked={settings.autoPrint}
            onCheckedChange={(checked) => setSettings({ ...settings, autoPrint: checked })}
          />
        </div>

        {/* Copies Per Print */}
        <div className="flex items-center justify-between">
          <Label htmlFor="copies" className="text-sm">Copies per print</Label>
          <select
            id="copies"
            value={settings.copiesPerPrint}
            onChange={(e) => setSettings({ ...settings, copiesPerPrint: parseInt(e.target.value) })}
            className="border rounded px-2 py-1 text-sm"
          >
            {[1, 2, 3].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full"
          size="sm"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
