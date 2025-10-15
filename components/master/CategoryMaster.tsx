
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types";
import { Separator } from "@/components/ui/separator";
import { CategoryForm } from "./category/CategoryForm";
import { CategoryList } from "./category/CategoryList";
import { CategoryHeader } from "./category/CategoryHeader";

const CategoryMaster = () => {
  const { getAll, create, update, delete: deleteRecord } = useDatabase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAll('categories')
  });
  
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory(null);
    }
    setIsDialogOpen(true);
  };
  
  const handleSaveCategory = async (formData: Partial<Category>) => {
    if (!formData.name) {
      toast({
        title: 'Invalid form',
        description: 'Category name is required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (editingCategory) {
        await update('categories', editingCategory.id, {
          ...formData,
          updatedAt: new Date()
        });
        toast({
          title: 'Category updated',
          description: `${formData.name} has been updated successfully`
        });
      } else {
        await create('categories', {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast({
          title: 'Category created',
          description: `${formData.name} has been added successfully`
        });
      }
      
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive'
      });
    }
  };
  
  const handleDelete = async (id: string, name: string) => {
    // Check if category has subcategories
    const hasSubcategories = categories.some((c: Category) => c.parentId === id);
    
    if (hasSubcategories) {
      toast({
        title: 'Cannot delete',
        description: 'This category has subcategories. Please delete them first.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if category is used by products
    const productsResult = await getAll('products');
    const products = Array.isArray(productsResult) ? productsResult : [];
    const isUsed = products.some((p: any) => p.categoryId === id);
    
    if (isUsed) {
      toast({
        title: 'Cannot delete',
        description: 'This category is used by products and cannot be deleted.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await deleteRecord('categories', id);
      toast({
        title: 'Category deleted',
        description: `${name} has been deleted successfully`
      });
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <CategoryHeader onAddCategory={() => handleOpenDialog()} />
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by category name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <CategoryList 
        categories={categories} 
        isLoading={isLoading} 
        searchTerm={searchTerm}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />
      
      {/* Category Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <CategoryForm 
            categories={categories} 
            editingCategory={editingCategory}
            onSave={handleSaveCategory}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryMaster;
