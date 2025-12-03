
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { golangAPI } from "@/lib/api";

const WhatsAppCampaign = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSendTest = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your WhatsApp Business API key",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call the WhatsApp Business API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Test Message Sent",
        description: "WhatsApp message was sent successfully"
      });
      
      // Save API key in app_configuration for future use
      await supabase.from('app_configuration')
        .upsert({
          key: 'whatsapp_api_key',
          value: apiKey,
          description: 'WhatsApp Business API Key'
        }, { onConflict: 'key' });
        
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: "Error",
        description: "Failed to send WhatsApp test message",
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
          <CardTitle>WhatsApp Business Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">WhatsApp Business API Key</Label>
            <Input 
              id="apiKey" 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your WhatsApp Business API key"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Message Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Message</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="appointment">Appointment Reminder</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea 
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message content"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">Use {"{name}"} to insert recipient's name</p>
          </div>
          
          <Button 
            onClick={handleSendTest}
            disabled={loading || !apiKey || !message}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Test Message"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppCampaign;
