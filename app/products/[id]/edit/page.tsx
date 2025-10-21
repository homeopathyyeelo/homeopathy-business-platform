"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <Button><Save className="h-4 w-4 mr-2" />Save</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Product Name</Label><Input defaultValue="Arnica Montana 30C" /></div>
          <div><Label>Product Code</Label><Input defaultValue="PRD-2025-001" /></div>
          <div><Label>Purchase Price</Label><Input type="number" defaultValue="80" /></div>
          <div><Label>Selling Price</Label><Input type="number" defaultValue="100" /></div>
        </CardContent>
      </Card>
    </div>
  );
}
