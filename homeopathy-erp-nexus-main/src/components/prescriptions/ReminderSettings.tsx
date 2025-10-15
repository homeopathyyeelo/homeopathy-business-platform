
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppSetting } from "@/types/appSettings";

interface ReminderConfig {
  enabled: boolean;
  daysBeforeRefill: number;
  daysBeforeExpiry: number;
  defaultChannel: 'whatsapp' | 'sms' | 'email';
  defaultMessage: string;
  sendTime: string;
}

const defaultConfig: ReminderConfig = {
  enabled: false,
  daysBeforeRefill: 2,
  daysBeforeExpiry: 7,
  defaultChannel: 'whatsapp',
  defaultMessage: 'Dear {name}, your prescription is due for a refill soon. Please visit our pharmacy at your earliest convenience.',
  sendTime: '09:00'
};

const ReminderSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ReminderConfig>(defaultConfig);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('key', 'prescription_reminders')
        .single();
      
      if (error) {
        // If not found, we'll use defaults
        if (error.code !== 'PGRST116') {
          console.error("Error fetching settings:", error);
          toast({
            title: "Error",
            description: "Failed to load reminder settings.",
            variant: "destructive",
          });
        }
      } else if (data) {
        // Safely parse the JSON value
        try {
          const parsedValue = typeof data.value === 'string' 
            ? JSON.parse(data.value) 
            : data.value;
          
          setSettings({
            ...defaultConfig,
            ...parsedValue
          });
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const { data: existingData, error: fetchError } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('key', 'prescription_reminders')
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Convert settings object to JSON string for storage
      const settingsValue = JSON.stringify(settings);
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('app_configuration')
          .update({ value: settingsValue })
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('app_configuration')
          .insert({
            key: 'prescription_reminders',
            value: settingsValue
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Reminder settings have been saved.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save reminder settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescription Reminder Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-reminders" className="font-medium">Enable Reminders</Label>
                <p className="text-sm text-muted-foreground">Send automatic reminders for prescription refills and expiry</p>
              </div>
              <Switch
                id="enable-reminders"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days-before-refill">Days Before Refill</Label>
                <Input
                  id="days-before-refill"
                  type="number"
                  min={1}
                  max={30}
                  value={settings.daysBeforeRefill}
                  onChange={(e) => setSettings({...settings, daysBeforeRefill: parseInt(e.target.value) || 1})}
                />
                <p className="text-sm text-muted-foreground">How many days before a refill is due to send the reminder</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="days-before-expiry">Days Before Expiry</Label>
                <Input
                  id="days-before-expiry"
                  type="number"
                  min={1}
                  max={90}
                  value={settings.daysBeforeExpiry}
                  onChange={(e) => setSettings({...settings, daysBeforeExpiry: parseInt(e.target.value) || 1})}
                />
                <p className="text-sm text-muted-foreground">How many days before a prescription expires to send the reminder</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-channel">Default Channel</Label>
                <Select
                  value={settings.defaultChannel}
                  onValueChange={(value: 'whatsapp' | 'sms' | 'email') => setSettings({...settings, defaultChannel: value})}
                >
                  <SelectTrigger id="default-channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Default communication channel for reminders</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="send-time">Send Time</Label>
                <Input
                  id="send-time"
                  type="time"
                  value={settings.sendTime}
                  onChange={(e) => setSettings({...settings, sendTime: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">Default time of day to send reminders</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default-message">Default Message Template</Label>
              <Textarea
                id="default-message"
                value={settings.defaultMessage}
                onChange={(e) => setSettings({...settings, defaultMessage: e.target.value})}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Use {"{name}"} for patient name, {"{medicine}"} for medication name, {"{date}"} for refill/expiry date
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={saveSettings} 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReminderSettings;
