
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/types';

interface ProductDescriptionFieldProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
}

const ProductDescriptionField = ({ formData, handleChange }: ProductDescriptionFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea 
        id="description"
        value={formData.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Product description (optional)"
        rows={3}
      />
    </div>
  );
};

export default ProductDescriptionField;
