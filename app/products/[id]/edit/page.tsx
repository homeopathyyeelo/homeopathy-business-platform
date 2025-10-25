'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useProduct, useProductCategories, useProductBrands, useProductPotencies, useProductForms, useProductMutations } from "@/lib/hooks/products";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  // Fetch product data
  const { data: product, isLoading, error } = useProduct(productId);
  const { data: categories = [] } = useProductCategories();
  const { data: brands = [] } = useProductBrands();
  const { data: potencies = [] } = useProductPotencies();
  const { data: forms = [] } = useProductForms();
  const { update } = useProductMutations();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    brand_id: "",
    potency_id: "",
    form_id: "",
    description: "",
    purchase_price: "",
    selling_price: "",
    mrp: "",
    hsn_code: "",
    gst_rate: "",
    min_stock: "",
    max_stock: "",
    reorder_level: "",
  });

  // Populate form when product data loads
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        category_id: product.category_id || "",
        brand_id: product.brand_id || "",
        potency_id: product.potency_id || "",
        form_id: product.form_id || "",
        description: product.description || "",
        purchase_price: product.purchase_price?.toString() || "",
        selling_price: product.selling_price?.toString() || "",
        mrp: product.mrp?.toString() || "",
        hsn_code: product.hsn_code || "",
        gst_rate: product.gst_rate?.toString() || "",
        min_stock: product.min_stock?.toString() || "",
        max_stock: product.max_stock?.toString() || "",
        reorder_level: product.reorder_level?.toString() || "",
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a product name",
        variant: "destructive"
      });
      return;
    }

    try {
      await update.mutateAsync({
        id: productId,
        data: {
          ...formData,
          purchase_price: parseFloat(formData.purchase_price) || 0,
          selling_price: parseFloat(formData.selling_price) || 0,
          mrp: parseFloat(formData.mrp) || 0,
          gst_rate: parseFloat(formData.gst_rate) || 0,
          min_stock: parseInt(formData.min_stock) || 0,
          max_stock: parseInt(formData.max_stock) || 0,
          reorder_level: parseInt(formData.reorder_level) || 0,
        }
      });

      toast({
        title: "Product Updated",
        description: "Product has been updated successfully"
      });

      router.push('/products');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-600 mb-4">Failed to load product</p>
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <Button onClick={handleSubmit} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Arnica Montana 30C"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Product Code</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="e.g., PRD-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Product description..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select value={formData.category_id || "none"} onValueChange={(value) => handleSelectChange('category_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_id">Brand</Label>
              <Select value={formData.brand_id || "none"} onValueChange={(value) => handleSelectChange('brand_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {brands.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="potency_id">Potency</Label>
              <Select value={formData.potency_id || "none"} onValueChange={(value) => handleSelectChange('potency_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select potency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {potencies.map((potency: any) => (
                    <SelectItem key={potency.id} value={potency.id}>{potency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form_id">Form</Label>
              <Select value={formData.form_id || "none"} onValueChange={(value) => handleSelectChange('form_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {forms.map((form: any) => (
                    <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrp">MRP</Label>
              <Input
                id="mrp"
                name="mrp"
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input
                id="hsn_code"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleInputChange}
                placeholder="e.g., 3004"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_rate">GST Rate (%)</Label>
              <Input
                id="gst_rate"
                name="gst_rate"
                type="number"
                step="0.01"
                value={formData.gst_rate}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="min_stock">Min Stock</Label>
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder</Label>
                <Input
                  id="reorder_level"
                  name="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stock">Max Stock</Label>
                <Input
                  id="max_stock"
                  name="max_stock"
                  type="number"
                  value={formData.max_stock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
