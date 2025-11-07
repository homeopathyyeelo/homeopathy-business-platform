
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, RefreshCw, Send } from "lucide-react";
import { MarketingCampaign } from "@/types";
import { format } from 'date-fns';
import { authFetch } from '@/lib/api/fetch-utils';

const CampaignsList = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(`
          *,
          marketing_segments (name),
          campaign_analytics (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingCampaign[];
    }
  });
  
  const refreshCampaigns = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Campaign list has been refreshed."
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return "bg-gray-200 hover:bg-gray-300 text-gray-800";
      case 'scheduled': return "bg-blue-100 hover:bg-blue-200 text-blue-800";
      case 'in-progress': return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800";
      case 'completed': return "bg-green-100 hover:bg-green-200 text-green-800";
      case 'cancelled': return "bg-red-100 hover:bg-red-200 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campaign History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCampaigns}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-grow">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description || 'No description'}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Send className="h-4 w-4 mr-1" />
                    <span>{campaign.campaign_type}</span>
                  </div>
                  
                  {campaign.scheduled_at && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Scheduled: {format(new Date(campaign.scheduled_at), 'PP')}</span>
                    </div>
                  )}
                  
                  {campaign.campaign_analytics && campaign.campaign_analytics[0] && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-muted-foreground">Results:</div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>Delivered: {campaign.campaign_analytics[0].delivered_count}</span>
                        <span>Read: {campaign.campaign_analytics[0].read_count}</span>
                        <span>Failed: {campaign.campaign_analytics[0].failed_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Campaigns Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first marketing campaign to engage with your customers.
              </p>
              <Button
                onClick={() => {
                  // Navigate to new campaign page
                  window.location.href = "/marketing?tab=new";
                }}
              >
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignsList;
