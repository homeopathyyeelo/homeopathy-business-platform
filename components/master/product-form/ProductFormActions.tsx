
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface ProductFormActionsProps {
  isSubmitting: boolean;
  isNewProduct: boolean;
}

const ProductFormActions = ({ isSubmitting, isNewProduct }: ProductFormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        <Save className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Saving...' : isNewProduct ? 'Create Product' : 'Update Product'}
      </Button>
    </div>
  );
};

export default ProductFormActions;
