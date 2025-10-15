
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface InventorySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  categories?: any[];
  onCategoryFilter?: (categoryIds: string[]) => void;
  selectedCategories?: string[];
}

const InventorySearch = ({ 
  searchTerm, 
  onSearchChange, 
  filterType, 
  onFilterChange,
  categories = [],
  onCategoryFilter = () => {},
  selectedCategories = []
}: InventorySearchProps) => {
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(selectedCategories);
  
  const handleCategoryToggle = (categoryId: string) => {
    const updated = localSelectedCategories.includes(categoryId)
      ? localSelectedCategories.filter(id => id !== categoryId)
      : [...localSelectedCategories, categoryId];
      
    setLocalSelectedCategories(updated);
  };
  
  const applyAdvancedFilters = () => {
    onCategoryFilter(localSelectedCategories);
    setIsAdvancedFilterOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
      <div className="flex items-center flex-1">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input
          placeholder="Search by product name, batch number or HSN code..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="flex gap-2">
        <div className="w-full md:w-64">
          <Select value={filterType} onValueChange={onFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Popover open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Advanced Filters</h4>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Categories</h5>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category.id}`} 
                        checked={localSelectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label 
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button size="sm" onClick={applyAdvancedFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default InventorySearch;
