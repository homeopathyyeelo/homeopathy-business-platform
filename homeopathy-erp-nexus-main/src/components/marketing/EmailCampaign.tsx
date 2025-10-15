
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailCampaign = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [template, setTemplate] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Try to load the API key from app_configuration
    const fetchConfig = async () => {
      const { data: apiKeyData } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', 'email_api_key')
        .maybeSingle();
        
      const { data: fromEmailData } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', 'email_from_address')
        .maybeSingle();
        
      const { data: fromNameData } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', 'email_from_name')
        .maybeSingle();
        
      if (apiKeyData) setApiKey(apiKeyData.value);
      if (fromEmailData) setFromEmail(fromEmailData.value);
      if (fromNameData) setFromName(fromNameData.value);
    };
    
    fetchConfig();
  }, []);
  
  const handleSendTest = async () => {
    if (!apiKey || !fromEmail || !subject || !content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call an email API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Save the configuration for future use
      await supabase.from('app_configuration')
        .upsert([
          {
            key: 'email_api_key',
            value: apiKey,
            description: 'Email API Key'
          },
          {
            key: 'email_from_address',
            value: fromEmail,
            description: 'Default sender email address'
          },
          {
            key: 'email_from_name',
            value: fromName,
            description: 'Default sender name'
          }
        ], { onConflict: 'key' });
      
      toast({
        title: "Test Email Sent",
        description: `Email was sent successfully to ${testEmail || 'test recipient'}`
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
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
          <CardTitle>Email Campaign Integration</CardTitle>
          <CardDescription>Configure your email service provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Email API Key</Label>
            <Input 
              id="apiKey" 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your email service API key"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input 
                id="fromEmail" 
                type="email" 
                value={fromEmail} 
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input 
                id="fromName" 
                value={fromName} 
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Recipient Email</Label>
            <Input 
              id="testEmail" 
              type="email" 
              value={testEmail} 
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Template</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="custom">Custom HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea 
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your email content"
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML formatting and {"{name}"} to insert recipient's name
            </p>
          </div>
          
          <Button 
            onClick={handleSendTest}
            disabled={loading || !apiKey || !fromEmail || !subject || !content}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Test Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCampaign;
