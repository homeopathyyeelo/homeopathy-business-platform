"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Package, History, BarChart3 } from "lucide-react";
import { useParams } from "next/navigation";

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Details</h1>
          <p className="text-muted-foreground">Product ID: {productId}</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="text-lg font-semibold">Arnica Montana 30C</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                <p className="text-lg font-mono">PRD-2025-001</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-lg">Dilutions</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p className="text-lg">SBL</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Potency</label>
                <Badge>30C</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Form</label>
                <Badge variant="outline">Dilution</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
              <p className="text-2xl font-bold text-green-600">245 units</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reorder Level</label>
              <p className="text-lg">50 units</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stock Value</label>
              <p className="text-lg font-semibold">24,500</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle>Pricing Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                  <p className="text-xl font-semibold">80</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">MRP</label>
                  <p className="text-xl font-semibold">120</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                  <p className="text-xl font-semibold text-green-600">100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Batch Information</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Batch details will be displayed here</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Transaction History</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Transaction history will be displayed here</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Sales Analytics</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Analytics charts will be displayed here</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
