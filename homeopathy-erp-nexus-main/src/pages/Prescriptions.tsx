
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Bell, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PrescriptionForm from "@/components/prescriptions/PrescriptionForm";
import PrescriptionsList from "@/components/prescriptions/PrescriptionsList";
import RefillReminders from "@/components/prescriptions/RefillReminders";
import ReminderSettings from "@/components/prescriptions/ReminderSettings";

const Prescriptions = () => {
  const [activeTab, setActiveTab] = useState("prescriptions");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const handleSaveComplete = () => {
    // Switch to the prescriptions list after saving
    setActiveTab("prescriptions");
    toast({
      title: "Success",
      description: "Prescription saved successfully.",
    });
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions & Refills</h1>
          <p className="text-muted-foreground">Manage patient prescriptions and set up refill reminders</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setActiveTab("new")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Prescription</span>
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="prescriptions" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Refill Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Prescription</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>Reminder Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="prescriptions">
          <PrescriptionsList />
        </TabsContent>
        
        <TabsContent value="reminders">
          <RefillReminders />
        </TabsContent>
        
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>New Prescription</CardTitle>
              <CardDescription>Add a new patient prescription</CardDescription>
            </CardHeader>
            <CardContent>
              <PrescriptionForm onSave={handleSaveComplete} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <ReminderSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Prescriptions;
