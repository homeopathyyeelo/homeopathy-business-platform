
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Product, Category } from '@/types';

interface ProductCategoryFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
  categories: Category[];
}

const ProductCategoryFields = ({ formData, handleChange, categories }: ProductCategoryFieldsProps) => {
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  console.log('ProductCategoryFields - Current categoryId:', formData.categoryId);
  console.log('ProductCategoryFields - Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
  console.log('ProductCategoryFields - Selected category:', selectedCategory);

  const handleCategoryChange = (categoryId: string) => {
    console.log('Category selection changed to:', categoryId);
    const category = categories.find(cat => cat.id === categoryId);
    console.log('Selected category object:', category);
    
    // Update category
    handleChange('categoryId', categoryId);
    
    // Auto-fill HSN Code and GST from category
    if (category) {
      if (category.hsnCode) {
        console.log('Auto-filling HSN code:', category.hsnCode);
        handleChange('hsnCode', category.hsnCode);
      }
      if (category.gstPercentage) {
        console.log('Auto-filling GST percentage:', category.gstPercentage);
        handleChange('gstPercentage', category.gstPercentage);
      }
    }
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-3">Category & Tax Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <Select 
              value={formData.categoryId || ''} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.hsnCode && (
                        <span className="text-xs text-muted-foreground">
                          HSN: {category.hsnCode} | GST: {category.gstPercentage}%
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Critical: Determines HSN code and GST rate
            </p>
            {formData.categoryId && (
              <p className="text-xs text-green-600">
                ✓ Category selected: {selectedCategory?.name || 'Unknown'}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hsnCode">HSN Code *</Label>
            <Input 
              id="hsnCode"
              value={formData.hsnCode || ''}
              onChange={(e) => handleChange('hsnCode', e.target.value)}
              placeholder="Auto-filled from category"
              className={selectedCategory?.hsnCode ? "bg-green-50 border-green-200" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {selectedCategory?.hsnCode ? 'Auto-filled from category' : 'Select category to auto-fill'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gstPercentage">GST Rate (%) *</Label>
            <Input 
              id="gstPercentage"
              type="number"
              step="0.01"
              value={formData.gstPercentage || ''}
              onChange={(e) => handleChange('gstPercentage', parseFloat(e.target.value) || 0)}
              placeholder="Auto-filled from category"
              className={selectedCategory?.gstPercentage ? "bg-green-50 border-green-200" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {selectedCategory?.gstPercentage ? 'Auto-filled from category' : 'Select category to auto-fill'}
            </p>
          </div>
        </div>
        
        {selectedCategory && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="text-sm">
              <span className="font-medium text-green-800">Selected Category: </span>
              <span className="text-green-700">{selectedCategory.name}</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              HSN: {selectedCategory.hsnCode} | GST: {selectedCategory.gstPercentage}% | {selectedCategory.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategoryFields;
