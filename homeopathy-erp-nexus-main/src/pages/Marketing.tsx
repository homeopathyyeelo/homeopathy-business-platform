import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send, Users, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import CampaignsList from "@/components/marketing/CampaignsList";
import ContactsList from "@/components/marketing/ContactsList";
import ImportContacts from "@/components/marketing/ImportContacts";
import NewCampaign from "@/components/marketing/NewCampaign";
import EnhancedNewCampaign from "@/components/marketing/EnhancedNewCampaign";
import EnhancedImportContacts from "@/components/marketing/EnhancedImportContacts";

const Marketing = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Check if there is a tab parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['campaigns', 'contacts', 'new', 'import'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  const updateUrl = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateUrl(value);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Create and manage promotional campaigns for your customers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handleTabChange('import')}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Import Contacts</span>
          </Button>
          <Button 
            onClick={() => handleTabChange('new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="campaigns" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            <span>Import Contacts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns">
          <CampaignsList />
        </TabsContent>
        
        <TabsContent value="contacts">
          <ContactsList />
        </TabsContent>
        
        <TabsContent value="new">
          <EnhancedNewCampaign />
        </TabsContent>
        
        <TabsContent value="import">
          <EnhancedImportContacts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketing;
