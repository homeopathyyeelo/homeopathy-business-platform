
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { EditIcon } from 'lucide-react';
import { Product, Category } from '@/types';

interface ProductDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  getStockLevel: (productId: string) => number;
  onEdit: (product: Product) => void;
}

const ProductDetailsSheet = ({ 
  isOpen, 
  onOpenChange, 
  product, 
  categories,
  getStockLevel,
  onEdit
}: ProductDetailsSheetProps) => {
  
  // Find category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (!product) return null;

  // Safely get packSize value for display
  const getPackSizeDisplay = () => {
    if (!product.packSize) return '';
    if (typeof product.packSize === 'string') return product.packSize;
    return product.packSize.name || '';
  };

  // Safely get potency display value
  const getPotencyDisplay = () => {
    if (!product.potency) return '';
    if (typeof product.potency === 'string') return product.potency;
    return product.potency.fullNotation || '';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product.fullMedicineName || product.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">SKU:</div>
            <div>{product.sku}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Category:</div>
            <div>{getCategoryName(product.categoryId)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Brand:</div>
            <div>{product.brand?.name || 'N/A'}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Potency:</div>
            <div>{getPotencyDisplay()}</div>
          </div>
          {product.form && (
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Form:</div>
              <div>{product.form.charAt(0).toUpperCase() + product.form.slice(1)}</div>
            </div>
          )}
          {product.packSize && (
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Pack Size:</div>
              <div>{getPackSizeDisplay()}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">HSN Code:</div>
            <div>{product.hsnCode}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">GST %:</div>
            <div>{product.gstPercentage}%</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Reorder Level:</div>
            <div>{product.reorderLevel}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Current Stock:</div>
            <div>{getStockLevel(product.id)}</div>
          </div>
          {product.description && (
            <div className="pt-2">
              <div className="text-sm font-medium mb-1">Description:</div>
              <div className="text-sm">{product.description}</div>
            </div>
          )}
          
          <div className="pt-4 flex justify-end">
            <Button
              onClick={() => onEdit(product)}
              size="sm"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit Medicine
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailsSheet;
