
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, CalendarIcon, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SocialMediaCampaign = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("facebook");
  const [facebookToken, setFacebookToken] = useState("");
  const [instagramToken, setInstagramToken] = useState("");
  const [postContent, setPostContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleConnect = (platform: string) => {
    // In a real implementation, this would redirect to the OAuth flow
    toast({
      title: `Connect ${platform}`,
      description: `This would normally redirect to the ${platform} OAuth authorization page`,
    });
  };
  
  const handleSchedulePost = async () => {
    if (!postContent) {
      toast({
        title: "Content Required",
        description: "Please enter content for your social media post",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call the Facebook/Instagram API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Save a record of the scheduled post
      await supabase.from('marketing_campaigns')
        .insert({
          name: `Social Media Post - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
          description: `Scheduled post for ${scheduledDate || 'immediate posting'}`,
          campaign_type: 'social_media',
          message_content: postContent,
          status: scheduledDate ? 'scheduled' : 'in-progress',
          scheduled_at: scheduledDate || null
        });
      
      toast({
        title: "Post Scheduled",
        description: scheduledDate 
          ? `Your post has been scheduled for ${scheduledDate}` 
          : "Your post has been submitted for immediate posting"
      });
      
      // Clear the form
      setPostContent("");
      setScheduledDate("");
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Error",
        description: "Failed to schedule social media post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Campaigns</CardTitle>
          <CardDescription>Create and schedule posts for your social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="facebook" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Facebook Page</h3>
                  <p className="text-sm text-muted-foreground">Connect your Facebook business page</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect('Facebook')}
                >
                  Connect Account
                </Button>
              </div>
              
              {facebookToken && (
                <div className="p-2 bg-green-50 text-green-700 text-sm rounded-md">
                  Facebook account connected
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="instagram" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Instagram Business Account</h3>
                  <p className="text-sm text-muted-foreground">Connect your Instagram business account</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect('Instagram')}
                >
                  Connect Account
                </Button>
              </div>
              
              {instagramToken && (
                <div className="p-2 bg-green-50 text-green-700 text-sm rounded-md">
                  Instagram account connected
                </div>
              )}
            </TabsContent>
            
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="postContent">Post Content</Label>
                <Textarea 
                  id="postContent"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`What would you like to post on ${activeTab}?`}
                  className="min-h-[120px]"
                />
                <div className="flex justify-end">
                  <p className="text-xs text-muted-foreground">
                    {postContent.length} / {activeTab === 'facebook' ? '5000' : '2200'} characters
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>Add Image</span>
                </Button>
                
                <Label htmlFor="scheduleDate" className="flex items-center gap-1 text-sm cursor-pointer">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Schedule for later</span>
                </Label>
                <Input
                  id="scheduleDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              
              <Button 
                onClick={handleSchedulePost}
                disabled={loading || !postContent}
                className="w-full mt-4"
              >
                {loading ? "Scheduling..." : `Schedule ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Post`}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaCampaign;
