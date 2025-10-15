
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoyaltyProgram } from '@/types/loyalty';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const LoyaltyProgramSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<LoyaltyProgram>({
    id: "",
    name: "Customer Loyalty Program",
    description: "Earn points on every purchase and redeem for discounts",
    pointsPerRupee: 1,
    minimumPointsRedemption: 100,
    redemptionValue: 0.5, // 1 point is worth 0.5 rupees
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configuration')
        .select('*')
        .eq('key', 'loyalty_program_settings')
        .maybeSingle();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found
          console.error("Error fetching settings:", error);
          toast({
            title: "Error",
            description: "Failed to load loyalty program settings.",
            variant: "destructive",
          });
        }
      } else if (data) {
        // Parse the JSON value
        try {
          const parsedValue = typeof data.value === 'string' 
            ? JSON.parse(data.value) 
            : data.value;
          
          setSettings({
            ...settings,
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
        .eq('key', 'loyalty_program_settings')
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
            key: 'loyalty_program_settings',
            value: settingsValue,
            description: 'Loyalty Program Configuration'
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Loyalty program settings have been saved.",
      });
      
      // Update the updatedAt field
      setSettings({
        ...settings,
        updatedAt: new Date()
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save loyalty program settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loyalty Program Configuration</CardTitle>
        <CardDescription>Configure how customers earn and redeem loyalty points</CardDescription>
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
                <Label htmlFor="enable-program" className="font-medium">Enable Loyalty Program</Label>
                <p className="text-sm text-muted-foreground">Activate the customer loyalty points system</p>
              </div>
              <Switch
                id="enable-program"
                checked={settings.isActive}
                onCheckedChange={(checked) => setSettings({...settings, isActive: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="program-description">Program Description</Label>
              <Input
                id="program-description"
                value={settings.description || ''}
                onChange={(e) => setSettings({...settings, description: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">This description will be shown to customers</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="points">
                <AccordionTrigger>Points Configuration</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="points-per-rupee">Points per Rupee</Label>
                      <Input
                        id="points-per-rupee"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={settings.pointsPerRupee}
                        onChange={(e) => setSettings({...settings, pointsPerRupee: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">Number of points earned for each Rupee spent</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="min-redemption">Minimum Points for Redemption</Label>
                      <Input
                        id="min-redemption"
                        type="number"
                        min="1"
                        value={settings.minimumPointsRedemption}
                        onChange={(e) => setSettings({...settings, minimumPointsRedemption: parseInt(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">Minimum points required before redemption is allowed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="redemption-value">Redemption Value (in Rupees)</Label>
                      <Input
                        id="redemption-value"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={settings.redemptionValue}
                        onChange={(e) => setSettings({...settings, redemptionValue: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-muted-foreground">Value of each point when redeemed (in Rupees)</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoyaltyProgramSettings;
