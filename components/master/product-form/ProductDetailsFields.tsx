
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Product, PackSize } from '@/types';

interface ProductDetailsFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
}

const ProductDetailsFields = ({ formData, handleChange }: ProductDetailsFieldsProps) => {
  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
        <div className="space-y-2">
          <Label htmlFor="potencyDisplay">Potency</Label>
          <Input 
            id="potencyDisplay"
            value={formData.potency?.fullNotation || ''}
            readOnly
            placeholder="Potency will be set in homeopathy fields"
            className="bg-gray-50"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="packSize">Pack Size</Label>
          <Input 
            id="packSize"
            value={typeof formData.packSize === 'object' && formData.packSize ? formData.packSize.name || '' : 
                  (formData.packSize as unknown as string) || ''}
            onChange={(e) => {
              // Create a PackSize object to match the type requirements
              const packSizeObject: PackSize = {
                id: '',
                name: e.target.value,
                description: '',
                active: true
              };
              handleChange('packSize', packSizeObject);
            }}
            placeholder="e.g. 30ML, 100ML"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hsnCode">HSN Code *</Label>
          <Input 
            id="hsnCode"
            value={formData.hsnCode || ''}
            onChange={(e) => handleChange('hsnCode', e.target.value)}
            placeholder="HSN Code"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[500px]">
        <div className="space-y-2">
          <Label htmlFor="defaultRackLocation">Default Rack Location</Label>
          <Input 
            id="defaultRackLocation"
            value={formData.defaultRackLocation || ''}
            onChange={(e) => handleChange('defaultRackLocation', e.target.value)}
            placeholder="e.g. Rack A-12, Shelf 3"
          />
          <p className="text-xs text-muted-foreground">
            Default storage location for this product
          </p>
        </div>
        
        <div className="flex items-center space-x-4 pt-2">
          <Switch
            id="batchTracking"
            checked={formData.batchTracking || false}
            onCheckedChange={(checked) => handleChange('batchTracking', checked)}
          />
          <Label htmlFor="batchTracking" className="cursor-pointer">
            Enable Batch Tracking
          </Label>
          <p className="text-xs text-muted-foreground ml-2">
            Track expiry dates and stock for individual batches
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsFields;
