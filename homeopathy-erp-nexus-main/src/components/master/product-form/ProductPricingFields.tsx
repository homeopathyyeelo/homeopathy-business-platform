
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';

interface ProductPricingFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
  handleNumberChange: (field: string, value: string) => void;
}

const ProductPricingFields = ({ formData, handleChange, handleNumberChange }: ProductPricingFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="gstPercentage">GST (%)</Label>
        <Input 
          id="gstPercentage"
          type="number"
          min="0"
          max="28"
          value={formData.gstPercentage || 0}
          onChange={(e) => handleNumberChange('gstPercentage', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reorderLevel">Reorder Level</Label>
        <Input 
          id="reorderLevel"
          type="number"
          min="0"
          value={formData.reorderLevel || 0}
          onChange={(e) => handleNumberChange('reorderLevel', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Minimum quantity to trigger low stock alert
        </p>
      </div>
    </div>
  );
};

export default ProductPricingFields;
