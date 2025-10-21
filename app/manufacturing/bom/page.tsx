"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ListTree } from "lucide-react";

export default function BOMPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <ListTree className="h-8 w-8" />Bill of Materials
      </h1>
      <Card><CardContent className="p-6">BOM management interface</CardContent></Card>
    </div>
  );
}
