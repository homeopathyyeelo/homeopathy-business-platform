
import { useState, useEffect } from 'react';
import { Product, Brand, parsePotency, generateFullMedicineName, generateProductSKU, MedicineForm } from '@/types';

interface UseProductFormDataProps {
  product?: Product;
  brands: Brand[];
  isNewProduct: boolean;
}

export const useProductFormData = ({ product, brands, isNewProduct }: UseProductFormDataProps) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    brandId: '',
    potency: parsePotency('30C'),
    form: 'globules' as MedicineForm,
    fullMedicineName: '',
    manufacturer: '',
    packSize: undefined,
    hsnCode: '',
    gstPercentage: 12,
    reorderLevel: 5,
    defaultSellingPriceRetail: 0,
    defaultRackLocation: '',
    batchTracking: true
  });

  // Load product data if editing
  useEffect(() => {
    if (product) {
      console.log('Loading product data for edit:', product);
      
      // Normalize database fields to camelCase for form
      const normalizedProduct = {
        ...product,
        // Handle brand ID - prioritize camelCase, fallback to snake_case
        brandId: product.brandId || (product as any).brand_id || '',
        // Handle category ID - prioritize camelCase, fallback to snake_case  
        categoryId: product.categoryId || (product as any).category_id || '',
        // Handle HSN code
        hsnCode: product.hsnCode || (product as any).hsn_code || '',
        // Handle GST percentage
        gstPercentage: product.gstPercentage || (product as any).gst_percentage || 12,
        // Handle batch tracking
        batchTracking: product.batchTracking !== undefined ? product.batchTracking : (product as any).batch_tracking !== undefined ? (product as any).batch_tracking : true
      };
      
      console.log('Normalized product data:', {
        brandId: normalizedProduct.brandId,
        categoryId: normalizedProduct.categoryId,
        name: normalizedProduct.name
      });
      console.log('Available brands:', brands.map(b => ({ id: b.id, name: b.name })));
      
      setFormData({
        ...normalizedProduct,
        potency: typeof normalizedProduct.potency === 'string' 
          ? parsePotency(normalizedProduct.potency) 
          : normalizedProduct.potency || parsePotency('30C')
      });
      
      console.log('Form data after loading product:', {
        brandId: normalizedProduct.brandId,
        categoryId: normalizedProduct.categoryId,
        name: normalizedProduct.name
      });
    } else if (isNewProduct && brands.length > 0) {
      // For new products, default to Dr. Reckeweg if available
      const drReckeweg = brands.find(b => b.name.includes('Dr. Reckeweg'));
      if (drReckeweg) {
        console.log('Setting default brand for new product:', drReckeweg.name);
        setFormData(prev => ({
          ...prev,
          brandId: drReckeweg.id,
          manufacturer: drReckeweg.name
        }));
      }
    }
  }, [product, brands, isNewProduct]);

  const handleChange = (field: string, value: any) => {
    console.log(`Updating field ${field} with value:`, value);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-generate fullMedicineName when core fields change
      if (['name', 'potency', 'form', 'brandId'].includes(field) && 
          updated.name && updated.potency && updated.form && updated.brandId) {
        const selectedBrand = brands.find(b => b.id === updated.brandId);
        updated.fullMedicineName = generateFullMedicineName(
          updated.name, 
          updated.potency, 
          updated.form,
          selectedBrand?.name
        );
        
        // Auto-generate SKU for new products
        if (isNewProduct) {
          updated.sku = generateProductSKU(
            updated.name,
            updated.potency,
            updated.form,
            selectedBrand?.name
          );
        }
        
        // Set manufacturer same as brand name for homeopathy
        if (selectedBrand) {
          updated.manufacturer = selectedBrand.name;
        }
      }
      
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    handleChange(field, numValue);
  };

  const resetForm = () => {
    const defaultBrand = brands.find(b => b.name.includes('Dr. Reckeweg'));
    
    setFormData({
      name: '',
      description: '',
      sku: '',
      categoryId: '',
      brandId: defaultBrand?.id || '',
      potency: parsePotency('30C'),
      form: 'globules' as MedicineForm,
      fullMedicineName: '',
      manufacturer: defaultBrand?.name || '',
      packSize: undefined,
      hsnCode: '',
      gstPercentage: 12,
      reorderLevel: 5,
      defaultSellingPriceRetail: 0,
      defaultRackLocation: '',
      batchTracking: true
    });
  };

  return {
    formData,
    handleChange,
    handleNumberChange,
    resetForm
  };
};
