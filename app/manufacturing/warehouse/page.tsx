"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

export default function WarehouseManagementPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Warehouse className="h-8 w-8" />Warehouse Management
      </h1>
      <Card><CardContent className="p-6">Warehouse operations interface</CardContent></Card>
    </div>
  );
}
