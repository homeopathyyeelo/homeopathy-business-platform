
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { golangAPI } from "@/lib/api";

const FacebookCampaign = () => {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [postType, setPostType] = useState("status");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('app_configuration')
        .select('key, value')
        .in('key', ['facebook_access_token', 'facebook_page_id']);
        
      data?.forEach(item => {
        if (item.key === 'facebook_access_token') setAccessToken(item.value);
        if (item.key === 'facebook_page_id') setPageId(item.value);
      });
    };
    
    fetchConfig();
  }, []);
  
  const handlePostToFacebook = async () => {
    if (!accessToken || !message) {
      toast({
        title: "Missing Information",
        description: "Please provide access token and message",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call Facebook Graph API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save the configuration for future use
      await supabase.from('app_configuration')
        .upsert([
          {
            key: 'facebook_access_token',
            value: accessToken,
            description: 'Facebook Page Access Token'
          },
          {
            key: 'facebook_page_id',
            value: pageId,
            description: 'Facebook Page ID'
          }
        ], { onConflict: 'key' });
      
      toast({
        title: "Post Published",
        description: "Facebook post has been published successfully"
      });
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      toast({
        title: "Error",
        description: "Failed to post to Facebook",
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
          <CardTitle>Facebook Page Integration</CardTitle>
          <CardDescription>Post to your Facebook business page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Facebook Page Access Token</Label>
            <Input 
              id="accessToken" 
              type="password" 
              value={accessToken} 
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your Facebook page access token"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pageId">Facebook Page ID</Label>
            <Input 
              id="pageId" 
              value={pageId} 
              onChange={(e) => setPageId(e.target.value)}
              placeholder="Enter your Facebook page ID"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postType">Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger id="postType">
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status Update</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="link">Link Share</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {postType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="link">Link URL</Label>
              <Input 
                id="link" 
                value={link} 
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="message">Post Message</Label>
            <Textarea 
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your Facebook post..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Engage your audience with relevant content
            </p>
          </div>
          
          <Button 
            onClick={handlePostToFacebook}
            disabled={loading || !accessToken || !message}
            className="w-full"
          >
            {loading ? "Posting..." : "Post to Facebook"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookCampaign;
