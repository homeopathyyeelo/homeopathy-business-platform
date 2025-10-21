"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Stethoscope className="h-8 w-8" />Doctor Dashboard
      </h1>
      <Card><CardContent className="p-6">Doctor performance and analytics</CardContent></Card>
    </div>
  );
}
