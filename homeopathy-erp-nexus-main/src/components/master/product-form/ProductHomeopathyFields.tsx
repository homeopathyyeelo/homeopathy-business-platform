
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Product, parsePotency, generateFullMedicineName, getMedicineFormOptions, getCommonPotencies, MedicineForm, Potency } from '@/types/product';

interface ProductHomeopathyFieldsProps {
  formData: Partial<Product>;
  handleChange: (field: string, value: any) => void;
}

const ProductHomeopathyFields = ({ formData, handleChange }: ProductHomeopathyFieldsProps) => {
  const handlePotencyChange = (potencyString: string) => {
    const potency = parsePotency(potencyString);
    handleChange('potency', potency);
    
    // Auto-update full medicine name if we have name, potency, and form
    if (formData.name && formData.form) {
      const fullName = generateFullMedicineName(formData.name, potency, formData.form);
      handleChange('fullMedicineName', fullName);
    }
  };

  const handleFormChange = (form: MedicineForm) => {
    handleChange('form', form);
    
    // Auto-update full medicine name if we have name, potency, and form
    if (formData.name && formData.potency) {
      const fullName = generateFullMedicineName(formData.name, formData.potency, form);
      handleChange('fullMedicineName', fullName);
    }
  };

  const handleNameChange = (name: string) => {
    handleChange('name', name);
    
    // Auto-update full medicine name if we have potency and form
    if (formData.potency && formData.form) {
      const fullName = generateFullMedicineName(name, formData.potency, formData.form);
      handleChange('fullMedicineName', fullName);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Core Homeopathy Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medicineName">Medicine Name *</Label>
            <Input 
              id="medicineName"
              value={formData.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Arnica Montana"
              required
            />
            <p className="text-xs text-muted-foreground">
              Base medicine name (without potency)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="potency">Potency *</Label>
            <Select 
              value={formData.potency?.fullNotation || ''} 
              onValueChange={handlePotencyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select potency" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <div className="p-2">
                  <Label className="text-xs font-semibold text-gray-600">Decimal Scale</Label>
                  {getCommonPotencies().filter(p => p.includes('X')).map((potency) => (
                    <SelectItem key={potency} value={potency}>{potency}</SelectItem>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <Label className="text-xs font-semibold text-gray-600">Centesimal Scale</Label>
                  {getCommonPotencies().filter(p => p.includes('C') || p.includes('M')).map((potency) => (
                    <SelectItem key={potency} value={potency}>{potency}</SelectItem>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <Label className="text-xs font-semibold text-gray-600">LM & Mother Tincture</Label>
                  {getCommonPotencies().filter(p => p.includes('LM') || p === 'MT').map((potency) => (
                    <SelectItem key={potency} value={potency}>{potency}</SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Critical: Defines medicine strength
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="form">Form *</Label>
            <Select 
              value={formData.form || ''} 
              onValueChange={handleFormChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {getMedicineFormOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Physical form of medicine
            </p>
          </div>
        </div>
        
        {formData.fullMedicineName && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <Label className="text-sm font-medium text-green-800">Complete Medicine Identity:</Label>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              {formData.fullMedicineName}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductHomeopathyFields;
