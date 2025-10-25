"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Package, History, BarChart3, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { golangAPI } from "@/lib/api";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Fetch product data from API
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/products/${productId}`);
      return res.data?.data || res.data;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-lg text-muted-foreground">Product not found</p>
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const stockValue = (product.currentStock || 0) * (product.sellingPrice || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/products')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <Button onClick={() => router.push(`/products/${productId}/edit`)}>
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
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="text-lg font-mono">{product.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-lg">{product.category || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p className="text-lg">{product.brand || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Potency</label>
                <Badge>{product.potency || 'N/A'}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Form</label>
                <Badge variant="outline">{product.form || 'N/A'}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pack Size</label>
                <p className="text-lg">{product.packSize || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            {product.description && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
              <p className={`text-2xl font-bold ${
                (product.currentStock || 0) < (product.reorderLevel || 10) 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {product.currentStock || 0} units
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reorder Level</label>
              <p className="text-lg">{product.reorderLevel || 0} units</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Min Stock</label>
              <p className="text-lg">{product.minStock || 0} units</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Max Stock</label>
              <p className="text-lg">{product.maxStock || 0} units</p>
            </div>
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">Stock Value</label>
              <p className="text-lg font-semibold">₹{stockValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="details">Additional Details</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle>Pricing Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost Price</label>
                  <p className="text-xl font-semibold">₹{product.costPrice || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                  <p className="text-xl font-semibold text-green-600">₹{product.sellingPrice || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">MRP</label>
                  <p className="text-xl font-semibold">₹{product.mrp || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax %</label>
                  <p className="text-xl font-semibold">{product.taxPercent || 0}%</p>
                </div>
              </div>
              {product.hsnCode && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">HSN Code</label>
                  <p className="text-lg font-mono">{product.hsnCode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {product.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-lg">{product.manufacturer}</p>
                  </div>
                )}
                {product.barcode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                    <p className="text-lg font-mono">{product.barcode}</p>
                  </div>
                )}
                {product.uom && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
                    <p className="text-lg">{product.uom}</p>
                  </div>
                )}
                {product.tags && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <p className="text-lg">{product.tags}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{new Date(product.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm">{new Date(product.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Batch Information</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Batch management coming soon...</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Transaction History</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Transaction history coming soon...</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
