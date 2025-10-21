"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function ProductionBatchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Package className="h-8 w-8" />Production Batches
      </h1>
      <Card><CardContent className="p-6">Production batch tracking</CardContent></Card>
    </div>
  );
}
