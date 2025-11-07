"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send, Users, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from '@/lib/api/fetch-utils';

export default function WhatsAppPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: "Credit Reminder", sent: 45, status: "completed", date: "2024-10-23" },
    { id: 2, name: "New Stock Alert", sent: 120, status: "completed", date: "2024-10-22" },
  ]);

  const handleBulkSend = async () => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await authFetch(`${API_URL}/api/erp/whatsapp/bulk-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_ids: selectedCustomers,
        message: message,
      })
    });
    
    if (res.ok) {
      toast({ title: "Messages sent successfully" });
      setMessage("");
    }
  };

  const handleCreditReminder = async () => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await authFetch(`${API_URL}/api/erp/whatsapp/credit-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_due: 1000 })
    });
    
    if (res.ok) {
      toast({ title: "Credit reminders sent" });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-green-500" />
          WhatsApp Marketing
        </h1>
        <p className="text-muted-foreground">Bulk messaging and customer engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">165</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Bulk Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipients</label>
                <Input placeholder="Select customers..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBulkSend}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
                <Button variant="outline" onClick={handleCreditReminder}>
                  Send Credit Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{camp.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {camp.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{camp.sent} sent</div>
                      </div>
                      <Badge variant="default">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {camp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <div className="font-medium">Payment Reminder</div>
                  <div className="text-sm text-muted-foreground">Dear customer, your payment of ₹{"{amount}"} is due...</div>
                </div>
                <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <div className="font-medium">Stock Arrival</div>
                  <div className="text-sm text-muted-foreground">New stock of {"{product}"} has arrived...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
