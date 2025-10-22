
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Product, Brand } from '@/types';

interface ProductBrandFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
  brands: Brand[];
}

const ProductBrandFields = ({ formData, handleChange, brands }: ProductBrandFieldsProps) => {
  const selectedBrand = brands.find(brand => brand.id === formData.brandId);

  console.log('ProductBrandFields - Current brandId:', formData.brandId);
  console.log('ProductBrandFields - Available brands:', brands.map(b => ({ id: b.id, name: b.name })));
  console.log('ProductBrandFields - Selected brand:', selectedBrand);

  const handleBrandChange = (value: string) => {
    console.log('Brand selection changed to:', value);
    const selectedBrand = brands.find(b => b.id === value);
    console.log('Selected brand object:', selectedBrand);
    
    handleChange('brandId', value);
    
    // Auto-set manufacturer to same as brand name
    if (selectedBrand) {
      handleChange('manufacturer', selectedBrand.name);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">Brand/Manufacturer Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brandId">Brand/Manufacturer *</Label>
            <Select 
              value={formData.brandId || ''} 
              onValueChange={handleBrandChange}
            >
              <SelectTrigger id="brandId">
                <SelectValue placeholder="Select brand/manufacturer" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    <div className="flex items-center gap-2">
                      <span>{brand.name}</span>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        {(brand as any).countryOfOrigin || (brand as any).country_of_origin || 'India'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Critical: Brand = Manufacturer in Homeopathy
            </p>
            {formData.brandId && (
              <p className="text-xs text-green-600">
                 Brand selected: {selectedBrand?.name || 'Unknown'}
              </p>
            )}
          </div>
          
          {selectedBrand && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Brand/Manufacturer Details</Label>
              <div className="p-3 bg-white rounded border">
                <div className="text-sm font-medium">{selectedBrand.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedBrand.description}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Origin: {(selectedBrand as any).countryOfOrigin || (selectedBrand as any).country_of_origin || 'India'}
                </div>
                {(selectedBrand as any).specialties && (selectedBrand as any).specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(selectedBrand as any).specialties.map((specialty: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-gray-100"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> In homeopathy, Brand and Manufacturer are the same entity. 
            This ensures consistency across all medicine classifications.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBrandFields;
