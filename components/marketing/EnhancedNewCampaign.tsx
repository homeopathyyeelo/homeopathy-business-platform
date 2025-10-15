
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Send, Save, Target, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LocationSelector from "./LocationSelector";
import CategorySelector from "./CategorySelector";
import { LocationFilter } from "@/types/location";

interface CampaignFormData {
  name: string;
  description: string;
  campaign_type: string;
  message_content: string;
  scheduled_at?: Date;
  categories: string[];
  locations: LocationFilter;
}

const EnhancedNewCampaign = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    campaign_type: 'whatsapp',
    message_content: '',
    categories: [],
    locations: {}
  });
  
  const [scheduledDate, setScheduledDate] = useState<Date>();

  const createCampaign = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const campaignData = {
        name: data.name,
        description: data.description,
        campaign_type: data.campaign_type,
        message_content: data.message_content,
        scheduled_at: data.scheduled_at?.toISOString(),
        status: data.scheduled_at ? 'scheduled' : 'draft',
        // Store filter criteria as JSONB
        segment_id: null // We'll handle filtering in the backend
      };

      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({
        title: "Campaign created",
        description: "Your marketing campaign has been created successfully."
      });
      // Reset form
      setFormData({
        name: '',
        description: '',
        campaign_type: 'whatsapp',
        message_content: '',
        categories: [],
        locations: {}
      });
      setScheduledDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveDraft = () => {
    createCampaign.mutate({
      ...formData,
      scheduled_at: undefined
    });
  };

  const scheduleNow = () => {
    createCampaign.mutate({
      ...formData,
      scheduled_at: new Date()
    });
  };

  const scheduleForLater = () => {
    if (!scheduledDate) {
      toast({
        title: "Please select a date",
        description: "Choose when you want to send this campaign.",
        variant: "destructive"
      });
      return;
    }
    
    createCampaign.mutate({
      ...formData,
      scheduled_at: scheduledDate
    });
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getEstimatedReach = () => {
    // This would calculate based on selected categories and locations
    // For now, showing placeholder
    const categoryCount = formData.categories.length;
    const locationCount = Object.values(formData.locations).filter(arr => arr && arr.length > 0).length;
    
    if (categoryCount === 0 && locationCount === 0) return "Select audience to see estimated reach";
    
    return `Estimated reach: ~${Math.floor(Math.random() * 500) + 100} contacts`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Campaign</h2>
          <p className="text-muted-foreground">Design and schedule your marketing campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="Enter campaign name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                  id="campaign-description"
                  placeholder="Describe your campaign"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="campaign-type">Campaign Type</Label>
                <Select 
                  value={formData.campaign_type} 
                  onValueChange={(value) => handleInputChange('campaign_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message-content">Message Content</Label>
                <Textarea
                  id="message-content"
                  placeholder="Enter your message content"
                  rows={6}
                  value={formData.message_content}
                  onChange={(e) => handleInputChange('message_content', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.message_content.length}/1000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Audience Targeting */}
          <CategorySelector
            selectedCategories={formData.categories}
            onCategoryChange={(categories) => handleInputChange('categories', categories)}
          />

          <LocationSelector
            selectedLocations={formData.locations}
            onLocationChange={(locations) => handleInputChange('locations', locations)}
          />
        </div>

        {/* Campaign Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Audience Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {getEstimatedReach()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Schedule Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={scheduleNow} 
                  className="w-full"
                  disabled={!formData.name || !formData.message_content || createCampaign.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                
                <Button 
                  onClick={scheduleForLater} 
                  variant="outline" 
                  className="w-full"
                  disabled={!formData.name || !formData.message_content || createCampaign.isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule for Later
                </Button>
                
                <Button 
                  onClick={saveDraft} 
                  variant="ghost" 
                  className="w-full"
                  disabled={!formData.name || createCampaign.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNewCampaign;
