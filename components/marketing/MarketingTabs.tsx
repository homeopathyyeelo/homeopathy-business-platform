
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WhatsAppCampaign from "./WhatsAppCampaign";
import SMSCampaign from "./SMSCampaign";
import EmailCampaign from "./EmailCampaign";
import FacebookCampaign from "./FacebookCampaign";
import InstagramCampaign from "./InstagramCampaign";

interface MarketingTabsProps {
  activeTab: string;
  onChangeTab: (value: string) => void;
}

const MarketingTabs = ({ activeTab, onChangeTab }: MarketingTabsProps) => {
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onChangeTab}>
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="sms">SMS</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="facebook">Facebook</TabsTrigger>
        <TabsTrigger value="instagram">Instagram</TabsTrigger>
      </TabsList>
      
      <TabsContent value="whatsapp">
        <WhatsAppCampaign />
      </TabsContent>
      
      <TabsContent value="sms">
        <SMSCampaign />
      </TabsContent>
      
      <TabsContent value="email">
        <EmailCampaign />
      </TabsContent>
      
      <TabsContent value="facebook">
        <FacebookCampaign />
      </TabsContent>
      
      <TabsContent value="instagram">
        <InstagramCampaign />
      </TabsContent>
    </Tabs>
  );
};

export default MarketingTabs;
