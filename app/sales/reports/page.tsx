"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function SalesReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <BarChart3 className="h-8 w-8" />Sales Reports
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Today's Sales</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹45,000</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">This Month</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹12,50,000</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Invoices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">1,245</div></CardContent></Card>
      </div>
    </div>
  );
}
