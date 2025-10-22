'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Building2, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProductBrands, useBrandMutations } from "@/lib/hooks/products";

interface Brand {
  id: string;
  name: string;
  description?: string;
  country?: string;
  website?: string;
  is_active: boolean;
  product_count?: number;
  total_value?: number;
}

export default function BrandsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country: "",
    website: "",
  });
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);

  // Use React Query hooks
  const { data: brands = [], isLoading } = useProductBrands();
  const { create, update, remove } = useBrandMutations();

  // Filter brands based on search term
  const filteredBrands = brands.filter((brand: Brand) =>
    brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      country: "",
      website: "",
    });
    setEditingBrandId(null);
  };

  const handleAddBrand = async () => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a brand name",
        variant: "destructive"
      });
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast({
        title: "Brand Added",
        description: "Brand has been created successfully"
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: "destructive"
      });
    }
  };

  const handleEditBrand = (brand: Brand) => {
    setFormData({
      name: brand.name,
      description: brand.description || "",
      country: brand.country || "",
      website: brand.website || "",
    });
    setEditingBrandId(brand.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateBrand = async () => {
    if (!editingBrandId || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a brand name",
        variant: "destructive"
      });
      return;
    }

    try {
      await update.mutateAsync({ id: editingBrandId, data: formData });
      toast({
        title: "Brand Updated",
        description: "Brand has been updated successfully"
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      try {
        await remove.mutateAsync(brandId);
        toast({
          title: "Brand Deleted",
          description: "Brand has been deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete brand",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate stats
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b: Brand) => b.is_active !== false).length;
  const totalProducts = brands.reduce((sum: number, b: Brand) => sum + (b.product_count || 0), 0);
  const totalValue = brands.reduce((sum: number, b: Brand) => sum + (b.total_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Product Brands</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Total Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBrands}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBrands}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Brand Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading brands...
                  </TableCell>
                </TableRow>
              ) : filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands.map((brand: Brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>{brand.description || 'No description'}</TableCell>
                    <TableCell>{brand.country || 'N/A'}</TableCell>
                    <TableCell>{brand.product_count || 0}</TableCell>
                    <TableCell>{brand.total_value?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge variant={brand.is_active !== false ? 'default' : 'secondary'}>
                        {brand.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditBrand(brand)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBrand(brand.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Brand Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input id="edit-country" name="country" value={formData.country} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input id="edit-website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateBrand}>Update Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
