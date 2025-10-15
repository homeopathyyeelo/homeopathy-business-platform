
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Category } from "@/types";

interface CategoryFormProps {
  categories: Category[];
  editingCategory: Category | null;
  onSave: (formData: Partial<Category>) => void;
  onCancel: () => void;
}

export const CategoryForm = ({ 
  categories, 
  editingCategory, 
  onSave, 
  onCancel 
}: CategoryFormProps) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    gstPercentage: 12,
    isSubcategory: false,
    parentId: '',
    level: 0
  });
  
  // Find parent categories (level 0 or undefined level)
  const parentCategories = categories.filter((category: Category) => 
    !category.level || category.level === 0
  );
  
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || '',
        gstPercentage: editingCategory.gstPercentage,
        isSubcategory: editingCategory.isSubcategory || false,
        parentId: editingCategory.parentId || '',
        level: editingCategory.level || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        gstPercentage: 12,
        isSubcategory: false,
        parentId: '',
        level: 0
      });
    }
  }, [editingCategory]);
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If changing isSubcategory
      if (field === 'isSubcategory') {
        updated.level = value ? 1 : 0;
        if (!value) {
          updated.parentId = '';
        }
      }
      
      // If selecting a parent, ensure isSubcategory is true
      if (field === 'parentId' && value) {
        updated.isSubcategory = true;
        updated.level = 1;
      }
      
      return updated;
    });
  };
  
  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter category name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gstPercentage">GST Percentage *</Label>
          <Input
            id="gstPercentage"
            type="number"
            min="0"
            max="28"
            value={formData.gstPercentage || 0}
            onChange={(e) => handleChange('gstPercentage', parseInt(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="isSubcategory">Category Type</Label>
          <Select 
            value={formData.isSubcategory ? "subcategory" : "main"} 
            onValueChange={(value) => handleChange('isSubcategory', value === "subcategory")}
          >
            <SelectTrigger id="categoryType">
              <SelectValue placeholder="Select category type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Category</SelectItem>
              <SelectItem value="subcategory">Subcategory</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.isSubcategory && (
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category *</Label>
            <Select 
              value={formData.parentId || ""} 
              onValueChange={(value) => handleChange('parentId', value)}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter category description"
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={() => onSave(formData)}>
          {editingCategory ? 'Update' : 'Create'} Category
        </Button>
      </DialogFooter>
    </>
  );
};
