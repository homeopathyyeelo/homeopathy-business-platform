
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoyaltyDashboard from "@/components/loyalty/LoyaltyDashboard";
import LoyaltyProgramSettings from "@/components/loyalty/LoyaltyProgramSettings";
import LoyaltyTiers from "@/components/loyalty/LoyaltyTiers";
import CustomerLoyaltyCard from "@/components/loyalty/CustomerLoyaltyCard";

const LoyaltyProgram = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Loyalty Program</h2>
        <p className="text-muted-foreground">
          Manage customer loyalty points, tiers, and rewards program.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="customers">Customer Loyalty</TabsTrigger>
          <TabsTrigger value="tiers">Loyalty Tiers</TabsTrigger>
          <TabsTrigger value="settings">Program Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program Overview</CardTitle>
              <CardDescription>
                Monitor your loyalty program performance and customer engagement
              </CardDescription>
            </CardHeader>
          </Card>
          <LoyaltyDashboard />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Loyalty Management</CardTitle>
              <CardDescription>
                View and manage individual customer loyalty accounts
              </CardDescription>
            </CardHeader>
          </Card>
          <CustomerLoyaltyCard />
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <LoyaltyTiers />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <LoyaltyProgramSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyProgram;
