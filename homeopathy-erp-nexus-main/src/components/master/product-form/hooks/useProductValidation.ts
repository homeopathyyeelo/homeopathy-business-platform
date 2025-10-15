
import { useToast } from '@/hooks/use-toast';
import { Product, Brand, validateProductClassification } from '@/types';

export const useProductValidation = () => {
  const { toast } = useToast();

  const validateForm = (formData: Partial<Product>, brands: Brand[]): boolean => {
    console.log('Validating form data:', formData);
    
    // Use the centralized validation function
    const errors = validateProductClassification(formData);
    
    // Additional validation for batch tracking and other fields
    if (formData.batchTracking && !formData.defaultRackLocation?.trim()) {
      // Rack location is recommended but not required
    }
    
    // Validate pricing if provided
    if (formData.defaultSellingPriceRetail && formData.defaultSellingPriceRetail <= 0) {
      errors.push('Selling price must be greater than 0');
    }
    
    // Validate reorder level
    if (formData.reorderLevel && formData.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }
    
    // Validate brand exists
    if (formData.brandId) {
      const brandExists = brands.some(brand => brand.id === formData.brandId);
      if (!brandExists) {
        errors.push('Selected brand is invalid');
      }
    }

    if (errors.length > 0) {
      console.error('Form validation errors:', errors);
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const validateMandatoryFields = (formData: Partial<Product>): boolean => {
    const mandatoryFields = [
      'name',
      'potency',
      'form', 
      'brandId',
      'categoryId',
      'hsnCode',
      'gstPercentage'
    ];

    const missingFields = mandatoryFields.filter(field => {
      const value = formData[field as keyof Product];
      return !value || (typeof value === 'string' && !value.trim());
    });

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  return {
    validateForm,
    validateMandatoryFields
  };
};
