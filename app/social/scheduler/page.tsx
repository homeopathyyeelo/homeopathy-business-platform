"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SocialSchedulerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Calendar className="h-8 w-8" />Post Scheduler
      </h1>
      <Card><CardContent className="p-6">Social media post scheduling interface</CardContent></Card>
    </div>
  );
}
