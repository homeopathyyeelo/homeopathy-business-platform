"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Users className="h-8 w-8" />Patient Management
      </h1>
      <Card><CardContent className="p-6">Patient records and history</CardContent></Card>
    </div>
  );
}
