
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const CONTACT_CATEGORIES = [
  { value: 'doctor', label: 'Doctors', description: 'Medical practitioners and healthcare professionals' },
  { value: 'patient', label: 'Patients', description: 'Existing and potential patients' },
  { value: 'pharmacy', label: 'Local Pharmacies', description: 'Retail pharmacy partners' },
  { value: 'wholesaler', label: 'Wholesalers', description: 'Bulk medicine distributors' },
  { value: 'clinic', label: 'Clinics', description: 'Healthcare facilities and clinics' },
  { value: 'hospital', label: 'Hospitals', description: 'Hospital administration and procurement' },
  { value: 'distributor', label: 'Distributors', description: 'Regional medicine distributors' },
  { value: 'retailer', label: 'Retailers', description: 'Medicine retail outlets' }
];

const CategorySelector = ({ selectedCategories, onCategoryChange }: CategorySelectorProps) => {
  const handleCategoryToggle = (category: string) => {
    const isSelected = selectedCategories.includes(category);
    const newCategories = isSelected 
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    onCategoryChange(newCategories);
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter(c => c !== category);
    onCategoryChange(newCategories);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contact Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTACT_CATEGORIES.map((category) => (
            <div key={category.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
              <Checkbox
                id={`category-${category.value}`}
                checked={selectedCategories.includes(category.value)}
                onCheckedChange={() => handleCategoryToggle(category.value)}
              />
              <div className="flex-1">
                <label 
                  htmlFor={`category-${category.value}`} 
                  className="text-sm font-medium cursor-pointer"
                >
                  {category.label}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Categories Display */}
        {selectedCategories.length > 0 && (
          <div>
            <Label>Selected Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map((categoryValue) => {
                const category = CONTACT_CATEGORIES.find(c => c.value === categoryValue);
                return (
                  <Badge key={categoryValue} variant="secondary" className="flex items-center gap-1">
                    {category?.label || categoryValue}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeCategory(categoryValue)}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Summary */}
        <div className="text-sm text-muted-foreground">
          {selectedCategories.length === 0 
            ? "Select contact categories to target specific audience segments"
            : `Targeting ${selectedCategories.length} contact ${selectedCategories.length === 1 ? 'category' : 'categories'}`
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default CategorySelector;
