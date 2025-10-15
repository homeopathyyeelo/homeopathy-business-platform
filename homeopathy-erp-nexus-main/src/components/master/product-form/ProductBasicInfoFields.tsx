
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';

interface ProductBasicInfoFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
}

const ProductBasicInfoFields = ({ formData, handleChange }: ProductBasicInfoFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input 
          id="name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter product name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sku">SKU *</Label>
        <Input 
          id="sku"
          value={formData.sku || ''}
          onChange={(e) => handleChange('sku', e.target.value)}
          placeholder="Product SKU"
          required
        />
        <p className="text-xs text-muted-foreground">
          {!formData.id && "Leave empty to auto-generate"}
        </p>
      </div>
    </div>
  );
};

export default ProductBasicInfoFields;
