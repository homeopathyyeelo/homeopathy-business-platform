"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Factory } from "lucide-react";

export default function ManufacturingOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Factory className="h-8 w-8" />Manufacturing Orders
      </h1>
      <Card><CardContent className="p-6">Manufacturing order management</CardContent></Card>
    </div>
  );
}
