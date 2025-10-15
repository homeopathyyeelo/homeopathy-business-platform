
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/lib/db-client';
import { Product, Brand, generateFullMedicineName, generateProductSKU } from '@/types';

interface UseProductSubmissionProps {
  isNewProduct: boolean;
  product?: Product;
  brands: Brand[];
  onSave: () => void;
  resetForm: () => void;
}

export const useProductSubmission = ({ 
  isNewProduct, 
  product, 
  brands, 
  onSave, 
  resetForm 
}: UseProductSubmissionProps) => {
  const { toast } = useToast();
  const { create, update } = useDatabase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: Partial<Product>) => {
    setIsSubmitting(true);
    
    try {
      console.log('=== PRODUCT SAVE OPERATION START ===');
      console.log('Is new product:', isNewProduct);
      console.log('Existing product:', product);
      console.log('Form data:', formData);
      
      const selectedBrand = brands.find(b => b.id === formData.brandId);
      
      if (!selectedBrand) {
        throw new Error('Selected brand not found');
      }

      console.log('Selected brand:', selectedBrand);

      // Prepare product payload with proper field mapping for database
      const productPayload = {
        // Basic info
        name: formData.name?.trim(),
        product_code: formData.productCode || `PROD-${Date.now()}`,
        description: formData.description?.trim() || '',
        
        // Homeopathy specific
        potency: formData.potency?.fullNotation || '',
        form: formData.form || '',
        full_medicine_name: formData.fullMedicineName || generateFullMedicineName(
          formData.name!, 
          formData.potency!, 
          formData.form!,
          selectedBrand.name
        ),
        
        // Relations - ensure these are properly set
        brand_id: formData.brandId,
        category_id: formData.categoryId,
        
        // Product details
        sku: formData.sku || generateProductSKU(
          formData.name!,
          formData.potency!,
          formData.form!,
          selectedBrand.name
        ),
        barcode: formData.barcode?.trim() || null,
        
        // Tax and pricing
        hsn_code: formData.hsnCode?.trim() || '',
        gst_percentage: formData.gstPercentage || 12,
        purchase_price: formData.purchasePrice || null,
        retail_price: formData.defaultSellingPriceRetail || null,
        wholesale_price: formData.defaultSellingPriceWholesale || null,
        
        // Inventory
        reorder_level: formData.reorderLevel || 0,
        min_stock_level: formData.minStockLevel || 0,
        max_stock_level: formData.maxStockLevel || null,
        
        // Settings
        batch_tracking: formData.batchTracking ?? true,
        is_batch_tracked: formData.batchTracking ?? true,
        is_active: true
      };

      console.log('Product payload for database:', productPayload);

      let result;
      if (isNewProduct) {
        // CREATE operation
        const createPayload = {
          ...productPayload,
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        };
        
        console.log('Creating new product with payload:', createPayload);
        result = await create('products', createPayload);
        console.log('Product creation result:', result);
        
        toast({
          title: 'Medicine Created',
          description: `${productPayload.full_medicine_name} has been added successfully`
        });
        
        // Reset form for new product
        resetForm();
      } else {
        // UPDATE operation
        if (!product?.id) {
          throw new Error('Product ID is missing for update operation');
        }
        
        console.log(`Updating product with ID: ${product.id}`);
        console.log('Update payload:', productPayload);
        
        result = await update('products', product.id, productPayload);
        console.log('Product update result:', result);
        
        toast({
          title: 'Medicine Updated', 
          description: `${productPayload.full_medicine_name} has been updated successfully`
        });
      }
      
      console.log('=== PRODUCT SAVE OPERATION SUCCESS ===');
      
      // Trigger parent component refresh
      onSave();
      
    } catch (error) {
      console.error('=== PRODUCT SAVE OPERATION FAILED ===');
      console.error('Error saving product:', error);
      
      toast({
        title: 'Error',
        description: `Failed to save medicine: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
