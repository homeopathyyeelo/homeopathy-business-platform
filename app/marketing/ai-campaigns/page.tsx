"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function AIMarketingCampaignsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Sparkles className="h-8 w-8" />AI Campaign Generator
      </h1>
      <Card><CardContent className="p-6">AI campaign generation interface</CardContent></Card>
    </div>
  );
}
