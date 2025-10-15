
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Brand } from '@/types';
import BrandList from './brand/BrandList';
import BrandForm from './brand/BrandForm';
import DeleteBrandDialog from './brand/DeleteBrandDialog';
import { useBrandContext } from './brand/BrandContext';

const BrandMaster = () => {
  const {
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
    setIsDeleteDialogOpen
  } = useBrandContext();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Homeopathic Brands</CardTitle>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </CardHeader>
      <CardContent>
        <BrandList 
          brands={brands}
          isLoading={isLoading}
          onEdit={handleOpenForm}
          onDelete={confirmDeleteBrand}
        />
        
        {/* Add/Edit Brand Form - Made horizontally scrollable */}
        <BrandForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          currentBrand={currentBrand}
          onSave={handleSaveBrand}
        />
        
        {/* Delete Confirmation Dialog */}
        <DeleteBrandDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteBrand}
          brand={currentBrand}
        />
      </CardContent>
    </Card>
  );
};

export default BrandMaster;
