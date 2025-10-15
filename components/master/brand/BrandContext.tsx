
import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { useToast } from '@/hooks/use-toast';
import { Brand } from '@/types';

interface BrandContextType {
  brands: Brand[];
  isLoading: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  currentBrand: Brand | null;
  handleOpenForm: (brand?: Brand) => void;
  handleSaveBrand: (brandData: Partial<Brand>) => Promise<void>;
  confirmDeleteBrand: (brand: Brand) => void;
  handleDeleteBrand: () => Promise<void>;
  setIsFormOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  refetch: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrandContext = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrandContext must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAll, create, update, delete: deleteRecord } = useDatabase();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);

  const { data: brands = [], isLoading, refetch } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAll('brands')
  });

  const handleOpenForm = (brand?: Brand) => {
    setCurrentBrand(brand || null);
    setIsFormOpen(true);
  };

  const handleSaveBrand = async (brandData: Partial<Brand>) => {
    if (!brandData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Brand name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('=== BRAND SAVE OPERATION START ===');
      console.log('Current brand:', currentBrand);
      console.log('Brand data to save:', brandData);

      // Prepare the brand payload - only use fields that exist in the database
      const brandPayload = {
        name: brandData.name.trim(),
        description: brandData.description?.trim() || '',
        is_active: brandData.isActive ?? brandData.active ?? true
      };

      console.log('Final brand payload:', brandPayload);

      let result;
      if (currentBrand?.id) {
        // UPDATE operation
        console.log(`Updating brand with ID: ${currentBrand.id}`);
        result = await update('brands', currentBrand.id, brandPayload);
        console.log('Update result:', result);
        
        toast({
          title: 'Brand Updated',
          description: `${brandData.name} has been updated successfully`
        });
      } else {
        // CREATE operation
        console.log('Creating new brand');
        const createPayload = {
          ...brandPayload,
          id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        };
        console.log('Create payload:', createPayload);
        
        result = await create('brands', createPayload);
        console.log('Create result:', result);
        
        toast({
          title: 'Brand Created',
          description: `${brandData.name} has been added successfully`
        });
      }

      console.log('=== BRAND SAVE OPERATION SUCCESS ===');
      
      // Refetch data to ensure UI reflects changes
      await refetch();
      setIsFormOpen(false);
      setCurrentBrand(null);
      
    } catch (error) {
      console.error('=== BRAND SAVE OPERATION FAILED ===');
      console.error('Error saving brand:', error);
      
      toast({
        title: 'Error',
        description: `Failed to save brand: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const confirmDeleteBrand = (brand: Brand) => {
    setCurrentBrand(brand);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBrand = async () => {
    if (!currentBrand) return;

    try {
      console.log('=== BRAND DELETE OPERATION START ===');
      console.log('Deleting brand:', currentBrand);

      // Check if brand is used by products
      const products = await getAll('products');
      const isUsed = products.some((p: any) => p.brand_id === currentBrand.id);
      
      if (isUsed) {
        toast({
          title: 'Cannot Delete Brand',
          description: 'This brand is used by products and cannot be deleted.',
          variant: 'destructive'
        });
        return;
      }

      const result = await deleteRecord('brands', currentBrand.id);
      console.log('Delete result:', result);
      
      toast({
        title: 'Brand Deleted',
        description: `${currentBrand.name} has been deleted successfully`
      });
      
      console.log('=== BRAND DELETE OPERATION SUCCESS ===');
      
      await refetch();
      setIsDeleteDialogOpen(false);
      setCurrentBrand(null);
      
    } catch (error) {
      console.error('=== BRAND DELETE OPERATION FAILED ===');
      console.error('Error deleting brand:', error);
      
      toast({
        title: 'Error',
        description: `Failed to delete brand: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <BrandContext.Provider value={{
      brands,
      isLoading,
      isFormOpen,
      isDeleteDialogOpen,
      currentBrand,
      handleOpenForm,
      handleSaveBrand,
      confirmDeleteBrand,
      handleDeleteBrand,
      setIsFormOpen,
      setIsDeleteDialogOpen,
      refetch
    }}>
      {children}
    </BrandContext.Provider>
  );
};
