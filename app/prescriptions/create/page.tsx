"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FilePlus } from "lucide-react";

export default function CreatePrescriptionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <FilePlus className="h-8 w-8" />Create Prescription
      </h1>
      <Card><CardContent className="p-6">Prescription creation form</CardContent></Card>
    </div>
  );
}
