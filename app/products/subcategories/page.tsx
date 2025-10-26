'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, FolderTree, Layers } from "lucide-react";
import { useSubcategories } from "@/lib/hooks/masters";
import { useProductCategories } from "@/lib/hooks/products";

interface Subcategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

export default function SubcategoriesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category_id: "",
  });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);

  // Fetch subcategories from /api/masters/subcategories
  const { data: subcategories = [], isLoading } = useSubcategories();
  
  // Get main categories for parent dropdown
  const { data: categoriesData = [] } = useProductCategories();
  const mainCategories = categoriesData;

  // Get parent category name
  const getParentName = (categoryId: string) => {
    const parent = mainCategories.find((cat: Category) => cat.id === categoryId);
    return parent?.name || 'Unknown';
  };

  // Filter subcategories
  const filteredSubcategories = subcategories.filter((sub: Subcategory) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getParentName(sub.category_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: subcategories.length,
    active: subcategories.filter((s: Subcategory) => s.is_active).length,
    byParent: mainCategories.map((parent: Category) => ({
      name: parent.name,
      count: subcategories.filter((s: Subcategory) => s.category_id === parent.id).length,
    })).filter(p => p.count > 0),
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", category_id: "" });
    setEditingSubcategoryId(null);
  };

  const handleAddSubcategory = async () => {
    if (!formData.name || !formData.category_id) {
      toast({
        title: "Missing Information",
        description: "Please provide subcategory name and parent category",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implement subcategory create API
      toast({
        title: "Not Implemented",
        description: "Subcategory creation API not yet implemented",
        variant: "destructive"
      });
      // await create.mutateAsync(formData);
      // toast({
      //   title: "Subcategory Created",
      //   description: `${formData.name} has been created successfully`
      // });
      // setIsAddDialogOpen(false);
      // resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subcategory",
        variant: "destructive"
      });
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setFormData({
      name: subcategory.name,
      code: subcategory.code || "",
      description: subcategory.description || "",
      category_id: subcategory.category_id,
    });
    setEditingSubcategoryId(subcategory.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubcategory = async () => {
    if (!formData.name || !formData.category_id || !editingSubcategoryId) {
      toast({
        title: "Missing Information",
        description: "Please provide all required information",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implement subcategory update API
      toast({
        title: "Not Implemented",
        description: "Subcategory update API not yet implemented",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      // TODO: Implement subcategory delete API
      toast({
        title: "Not Implemented",
        description: "Subcategory delete API not yet implemented",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subcategory",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Subcategories</h1>
          <p className="text-muted-foreground">Manage product subcategories and hierarchy</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subcategory
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subcategories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FolderTree className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mainCategories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Group</CardTitle>
            <Layers className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-purple-600">
              {stats.byParent.length > 0 
                ? `${stats.byParent[0].name} (${stats.byParent[0].count})`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subcategories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subcategories ({filteredSubcategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredSubcategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No subcategories found matching your search" : "No subcategories yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubcategories.map((subcategory: Subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">{subcategory.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subcategory.code || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getParentName(subcategory.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {subcategory.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subcategory.is_active ? "default" : "secondary"}>
                        {subcategory.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubcategory(subcategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Subcategory Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Parent Category *</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) => handleSelectChange('category_id', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a parent</SelectItem>
                  {mainCategories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Subcategory Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Eye Drops"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., EYEDRP"
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
                placeholder="Subcategory description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSubcategory}>
              Create Subcategory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category_id">Parent Category *</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) => handleSelectChange('category_id', value === "none" ? "" : value)}
              >
                <SelectTrigger id="edit-category_id">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a parent</SelectItem>
                  {mainCategories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Subcategory Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Eye Drops"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., EYEDRP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Subcategory description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubcategory}>
              Update Subcategory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
