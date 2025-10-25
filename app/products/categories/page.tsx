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
import { Plus, Search, Edit, Trash2, FolderOpen, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductCategories, useCategoryMutations } from "@/lib/hooks/products";

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  product_count?: number;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Use React Query hooks
  const { data: categories = [], isLoading } = useProductCategories();
  const { create, update, remove } = useCategoryMutations();

  // Filter categories based on search term
  const filteredCategories = categories.filter((category: Category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parent_id: "",
    });
    setEditingCategoryId(null);
  };

  const handleAddCategory = async () => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a category name",
        variant: "destructive"
      });
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast({
        title: "Category Added",
        description: "Category has been created successfully"
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id || "",
    });
    setEditingCategoryId(category.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a category name",
        variant: "destructive"
      });
      return;
    }

    try {
      await update.mutateAsync({ id: editingCategoryId, data: formData });
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully"
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await remove.mutateAsync(categoryId);
        toast({
          title: "Category Deleted",
          description: "Category has been deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: Category) => c.is_active !== false).length;
  const subcategories = categories.filter((c: Category) => c.parent_id).length;
  const mainCategories = categories.filter((c: Category) => !c.parent_id).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Product Categories</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FolderOpen className="w-4 h-4 mr-2" />
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Main Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mainCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Subcategories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subcategories}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
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
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || 'No description'}</TableCell>
                    <TableCell>
                      {category.parent_id ? (
                        <Badge variant="outline">Subcategory</Badge>
                      ) : (
                        <Badge variant="default">Main Category</Badge>
                      )}
                    </TableCell>
                    <TableCell>{category.product_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active !== false ? 'default' : 'secondary'}>
                        {category.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
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
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category (Optional)</Label>
              <Select value={formData.parent_id || "none"} onValueChange={(value) => handleSelectChange('parent_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {categories.filter((c: Category) => !c.parent_id).map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parent_id">Parent Category (Optional)</Label>
              <Select value={formData.parent_id || "none"} onValueChange={(value) => handleSelectChange('parent_id', value === "none" ? "" : value)}>
                <SelectTrigger id="edit-parent_id">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {categories.filter((c: Category) => !c.parent_id).map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategory}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
