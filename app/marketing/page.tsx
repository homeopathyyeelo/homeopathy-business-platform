"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Send, Users, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CampaignsList from "@/components/marketing/CampaignsList";
import ContactsList from "@/components/marketing/ContactsList";
import ImportContacts from "@/components/marketing/ImportContacts";
import EnhancedNewCampaign from "@/components/marketing/EnhancedNewCampaign";
import EnhancedImportContacts from "@/components/marketing/EnhancedImportContacts";
import { useRouter, useSearchParams } from "next/navigation";

export default function MarketingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("campaigns");
  const { toast } = useToast();
  
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['campaigns', 'contacts', 'new', 'import'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/marketing?tab=${value}`);
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
}
