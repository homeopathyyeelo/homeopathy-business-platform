"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, ShoppingCart, Package, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export default function ActivityLogPage() {
  const activities = [
    { id: 1, type: 'sale', icon: ShoppingCart, title: 'New Sale', description: 'Invoice #INV-2025-001 created', amount: '₹2,500', time: '2 mins ago', color: 'text-green-600' },
    { id: 2, type: 'purchase', icon: Package, title: 'Purchase Order', description: 'PO #PO-2025-045 approved', amount: '₹15,000', time: '15 mins ago', color: 'text-blue-600' },
    { id: 3, type: 'customer', icon: Users, title: 'New Customer', description: 'Rajesh Kumar added', time: '1 hour ago', color: 'text-purple-600' },
    { id: 4, type: 'payment', icon: DollarSign, title: 'Payment Received', description: 'Payment for INV-2025-998', amount: '₹8,500', time: '2 hours ago', color: 'text-green-600' },
    { id: 5, type: 'stock', icon: TrendingUp, title: 'Stock Updated', description: 'Batch #B2025-123 added', time: '3 hours ago', color: 'text-orange-600' },
    { id: 6, type: 'alert', icon: AlertCircle, title: 'Low Stock Alert', description: 'Arnica 30C running low', time: '4 hours ago', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Activity Timeline
        </h1>
        <p className="text-muted-foreground">Real-time business activities and events</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">45</div>
            <p className="text-xs text-muted-foreground">Invoices created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchase Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-xs text-muted-foreground">Orders processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">8</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className={`p-2 rounded-full bg-accent ${activity.color}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{activity.title}</h4>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.amount && (
                      <Badge variant="outline" className="mt-1">{activity.amount}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
