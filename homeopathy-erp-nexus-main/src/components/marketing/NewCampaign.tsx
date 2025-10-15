
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Send, Save } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WhatsAppCampaign from "./WhatsAppCampaign";
import SMSCampaign from "./SMSCampaign";
import EmailCampaign from "./EmailCampaign";
import SocialMediaCampaign from "./SocialMediaCampaign";

const campaignSchema = z.object({
  name: z.string().min(3, { message: "Campaign name is required" }),
  description: z.string().optional(),
  campaignType: z.enum(["whatsapp", "sms", "email", "social"]),
  messageContent: z.string().min(10, { message: "Message content is required" }),
  segmentId: z.string().optional(),
  templateId: z.string().optional(),
  scheduledAt: z.date().optional(),
  status: z.enum(["draft", "scheduled"]).default("draft"),
});

type FormValues = z.infer<typeof campaignSchema>;

const NewCampaign = () => {
  const { toast } = useToast();
  const [isScheduled, setIsScheduled] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Fetch segments
  const { data: segments = [] } = useQuery({
    queryKey: ['marketing-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_segments')
        .select('*')
        .eq('is_active', true);
        
      if (error) throw error;
      return data;
    },
    initialData: []
  });
  
  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*');
        
      if (error) throw error;
      return data;
    },
    initialData: []
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      campaignType: 'whatsapp',
      messageContent: '',
      status: 'draft'
    }
  });
  
  const createCampaign = useMutation({
    mutationFn: async (formData: FormValues) => {
      const campaignData = {
        name: formData.name,
        description: formData.description || null,
        campaign_type: formData.campaignType,
        message_content: formData.messageContent,
        segment_id: formData.segmentId || null,
        template_id: formData.templateId || null,
        scheduled_at: formData.scheduledAt ? formData.scheduledAt.toISOString() : null,
        status: formData.status
      };
      
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert(campaignData)
        .select();
        
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully."
      });
      
      // Create initial analytics entry
      createAnalytics(data.id);
      
      // Reset form
      form.reset();
      setIsScheduled(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const createAnalytics = async (campaignId: string) => {
    try {
      await supabase
        .from('campaign_analytics')
        .insert({
          campaign_id: campaignId,
          delivered_count: 0,
          read_count: 0,
          clicked_count: 0,
          failed_count: 0
        });
    } catch (error) {
      console.error('Error creating analytics:', error);
    }
  };
  
  const onSubmit = (data: FormValues) => {
    // If scheduled but no date selected, show error
    if (isScheduled && !data.scheduledAt) {
      toast({
        title: "Schedule missing",
        description: "Please select a date and time for the scheduled campaign.",
        variant: "destructive"
      });
      return;
    }
    
    // Set status based on scheduling
    data.status = isScheduled ? 'scheduled' : 'draft';
    
    // Create campaign
    createCampaign.mutate(data);
  };
  
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      form.setValue('messageContent', template.content);
    }
  };

  return (
    <div>
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General Campaign</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>New Campaign</CardTitle>
                  <CardDescription>
                    Create a new marketing campaign to engage with your contacts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter campaign name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="campaignType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="social">Social Media</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter campaign description" 
                            className="resize-none h-20" 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="segmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Segment (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select segment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">All Contacts</SelectItem>
                              {segments.map((segment) => (
                                <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Target a specific segment or leave blank to target all contacts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Template (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              loadTemplate(value);
                            }}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Custom Message</SelectItem>
                              {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Use a predefined template or create a custom message
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="messageContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter message content" 
                            className="resize-none h-32" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use {"{name}"} to personalize with contact name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="scheduleToggle" 
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="scheduleToggle" className="text-sm font-medium">
                        Schedule this campaign
                      </label>
                    </div>
                    
                    {isScheduled && (
                      <FormField
                        control={form.control}
                        name="scheduledAt"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Schedule Date & Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP 'at' p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                                <div className="p-3 border-t border-border">
                                  <Input
                                    type="time"
                                    onChange={(e) => {
                                      const [hour, minute] = e.target.value.split(':');
                                      const date = field.value || new Date();
                                      date.setHours(parseInt(hour));
                                      date.setMinutes(parseInt(minute));
                                      field.onChange(date);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/marketing";
                  }}
                >
                  Cancel
                </Button>
                {isScheduled ? (
                  <Button 
                    type="submit"
                    disabled={createCampaign.isPending}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {createCampaign.isPending ? "Scheduling..." : "Schedule Campaign"}
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={createCampaign.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createCampaign.isPending ? "Saving..." : "Save as Draft"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="whatsapp">
          <WhatsAppCampaign />
        </TabsContent>
        
        <TabsContent value="sms">
          <SMSCampaign />
        </TabsContent>
        
        <TabsContent value="email">
          <EmailCampaign />
        </TabsContent>
        
        <TabsContent value="social">
          <SocialMediaCampaign />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewCampaign;
