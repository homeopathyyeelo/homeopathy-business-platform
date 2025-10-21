"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AIRemedySuggestionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Sparkles className="h-8 w-8" />AI Remedy Suggestions
      </h1>
      <Card><CardContent className="p-6">AI-powered remedy recommendations</CardContent></Card>
    </div>
  );
}
