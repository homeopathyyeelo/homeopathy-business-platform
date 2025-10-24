"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react";

export default function AIInsightsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Insights Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Restock Recommendations</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">Products need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Price Optimization</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8%</div>
            <p className="text-sm text-muted-foreground">Potential profit increase</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Demand Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">↑ 15%</div>
            <p className="text-sm text-muted-foreground">Next month trend</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
