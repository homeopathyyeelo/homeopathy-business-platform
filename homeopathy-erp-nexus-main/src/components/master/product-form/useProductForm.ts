
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Product } from '@/types';

import { useProductValidation } from './hooks/useProductValidation';
import { useProductFormData } from './hooks/useProductFormData';
import { useProductSubmission } from './hooks/useProductSubmission';

interface UseProductFormProps {
  product?: Product;
  onSave: () => void;
}

const useProductForm = ({ product, onSave }: UseProductFormProps) => {
  const { getAll } = useDatabase();
  const isNewProduct = !product;

  // Fetch brands for the form
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAll('brands')
  });

  const { validateForm } = useProductValidation();
  
  const {
    formData,
    handleChange,
    handleNumberChange,
    resetForm
  } = useProductFormData({ product, brands, isNewProduct });

  const { isSubmitting, handleSubmit } = useProductSubmission({
    isNewProduct,
    product,
    brands,
    onSave,
    resetForm
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData, brands)) return;
    
    await handleSubmit(formData);
  };

  return {
    formData,
    isSubmitting,
    isNewProduct,
    brands,
    handleChange,
    handleNumberChange,
    handleSubmit: handleFormSubmit
  };
};

export default useProductForm;
