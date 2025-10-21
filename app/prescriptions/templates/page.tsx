"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PrescriptionTemplatesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <FileText className="h-8 w-8" />Prescription Templates
      </h1>
      <Card><CardContent className="p-6">Template library</CardContent></Card>
    </div>
  );
}
