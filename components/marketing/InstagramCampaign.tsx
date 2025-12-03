
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { golangAPI } from "@/lib/api";

const InstagramCampaign = () => {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postType, setPostType] = useState("photo");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', 'instagram_access_token')
        .maybeSingle();
        
      if (data) setAccessToken(data.value);
    };
    
    fetchConfig();
  }, []);
  
  const handlePostToInstagram = async () => {
    if (!accessToken || !caption) {
      toast({
        title: "Missing Information",
        description: "Please provide access token and caption",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call Instagram Basic Display API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save the access token for future use
      await supabase.from('app_configuration')
        .upsert({
          key: 'instagram_access_token',
          value: accessToken,
          description: 'Instagram Access Token'
        }, { onConflict: 'key' });
      
      toast({
        title: "Post Scheduled",
        description: "Instagram post has been scheduled successfully"
      });
    } catch (error) {
      console.error('Error posting to Instagram:', error);
      toast({
        title: "Error",
        description: "Failed to post to Instagram",
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
          <CardTitle>Instagram Business Integration</CardTitle>
          <CardDescription>Post to your Instagram business account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Instagram Access Token</Label>
            <Input 
              id="accessToken" 
              type="password" 
              value={accessToken} 
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your Instagram access token"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postType">Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger id="postType">
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image/Video URL</Label>
            <Input 
              id="imageUrl" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea 
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your Instagram caption..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Use relevant hashtags to increase reach
            </p>
          </div>
          
          <Button 
            onClick={handlePostToInstagram}
            disabled={loading || !accessToken || !caption}
            className="w-full"
          >
            {loading ? "Posting..." : "Post to Instagram"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramCampaign;
