
import React, { useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Category } from "@/types";

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  searchTerm: string;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ 
  categories, 
  isLoading, 
  searchTerm, 
  onEdit, 
  onDelete 
}: CategoryListProps) => {
  
  // Memoize formatted and filtered categories for better performance
  const { formattedCategories, filteredCategories } = useMemo(() => {
    // Find parent categories (level 0 or undefined level)
    const parentCategories = categories.filter((category: Category) => 
      !category.level || category.level === 0
    );
    
    // Get formatted categories for display with hierarchy
    const formatted = categories
      .filter((category: Category) => 
        !category.isSubcategory && (!category.level || category.level === 0)
      )
      .sort((a: Category, b: Category) => 
        a.name.localeCompare(b.name)
      );
    
    // Filter categories based on search term
    const filtered = categories.filter((category: Category) => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { formattedCategories: formatted, filteredCategories: filtered };
  }, [categories, searchTerm]);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories
      .filter((category: Category) => category.parentId === parentId)
      .sort((a: Category, b: Category) => a.name.localeCompare(b.name));
  };
  
  // Get category name by ID
  const getCategoryName = (id: string) => {
    const category = categories.find((c: Category) => c.id === id);
    return category ? category.name : 'None';
  };
  
  const renderCategoryRow = (category: Category, isSubcategory = false) => {
    return (
      <TableRow key={category.id}>
        <TableCell className="font-medium">
          {isSubcategory && <span className="ml-6">↳ </span>}
          {category.name}
        </TableCell>
        <TableCell>{category.description || 'N/A'}</TableCell>
        <TableCell>{category.gstPercentage}%</TableCell>
        <TableCell>
          {category.parentId ? getCategoryName(category.parentId) : 'None'}
        </TableCell>
        <TableCell className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} aria-label={`Edit ${category.name}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(category.id, category.name)}
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>GST %</TableHead>
            <TableHead>Parent Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">Loading categories...</TableCell>
            </TableRow>
          ) : searchTerm ? (
            // When searching, show all matching categories without hierarchy
            filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No categories found</TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category: Category) => renderCategoryRow(category, !!category.parentId))
            )
          ) : (
            // When not searching, show categories with hierarchy
            formattedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No categories found</TableCell>
              </TableRow>
            ) : (
              <>
                {formattedCategories.map((category: Category) => (
                  <React.Fragment key={category.id}>
                    {renderCategoryRow(category)}
                    {getSubcategories(category.id).map((subcategory: Category) => 
                      renderCategoryRow(subcategory, true)
                    )}
                  </React.Fragment>
                ))}
              </>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};
