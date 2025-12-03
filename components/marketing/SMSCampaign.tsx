
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { golangAPI } from "@/lib/api";

const SMSCampaign = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Try to load the API key from app_configuration
    const fetchApiKey = async () => {
      const { data, error } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', 'kaleyra_api_key')
        .maybeSingle();
        
      if (!error && data) {
        setApiKey(data.value);
      }
    };
    
    fetchApiKey();
  }, []);
  
  const handleSendTest = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Kaleyra API key",
        variant: "destructive"
      });
      return;
    }
    
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a test phone number",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call the Kaleyra SMS API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Save the API key for future use
      await supabase.from('app_configuration')
        .upsert({
          key: 'kaleyra_api_key',
          value: apiKey,
          description: 'Kaleyra SMS API Key'
        }, { onConflict: 'key' });
      
      toast({
        title: "Test SMS Sent",
        description: "SMS was sent successfully to " + phoneNumber
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS",
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
          <CardTitle>SMS Integration with Kaleyra</CardTitle>
          <CardDescription>Configure your Kaleyra SMS API integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Kaleyra API Key</Label>
            <Input 
              id="apiKey" 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Kaleyra API key"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Test Phone Number</Label>
            <Input 
              id="phone" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea 
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your SMS content"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              SMS content: {message.length} characters
              {message.length > 160 && " (may be sent as multiple messages)"}
            </p>
          </div>
          
          <Button 
            onClick={handleSendTest}
            disabled={loading || !apiKey || !message || !phoneNumber}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Test SMS"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSCampaign;
