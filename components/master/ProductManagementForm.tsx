
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { Product } from '@/types';

// Import the hook
import useProductForm from './product-form/useProductForm';

// Import form components
import ProductBasicInfoFields from './product-form/ProductBasicInfoFields';
import ProductHomeopathyFields from './product-form/ProductHomeopathyFields';
import ProductBrandFields from './product-form/ProductBrandFields';
import ProductCategoryFields from './product-form/ProductCategoryFields';
import ProductDetailsFields from './product-form/ProductDetailsFields';
import ProductPricingFields from './product-form/ProductPricingFields';
import ProductDescriptionField from './product-form/ProductDescriptionField';
import ProductFormActions from './product-form/ProductFormActions';
import { Separator } from '@/components/ui/separator';

interface ProductManagementFormProps {
  product?: Product;
  onSave: () => void;
}

const ProductManagementForm = ({ product, onSave }: ProductManagementFormProps) => {
  const { getAll } = useDatabase();
  
  // Use our custom hook for form logic
  const { 
    formData, 
    isSubmitting, 
    isNewProduct,
    brands,
    handleChange, 
    handleNumberChange, 
    handleSubmit 
  } = useProductForm({ product, onSave });

  // Get categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAll('categories')
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ProductHomeopathyFields 
        formData={formData} 
        handleChange={handleChange} 
      />
      
      <Separator className="my-4" />
      
      <ProductBrandFields 
        formData={formData} 
        handleChange={handleChange} 
        brands={brands}
      />
      
      <Separator className="my-4" />
      
      <ProductBasicInfoFields 
        formData={formData} 
        handleChange={handleChange} 
      />
      
      <Separator className="my-4" />
      
      <ProductCategoryFields 
        formData={formData} 
        handleChange={handleChange} 
        categories={categories}
      />
      
      <Separator className="my-4" />
      
      <ProductDetailsFields 
        formData={formData} 
        handleChange={handleChange} 
      />
      
      <Separator className="my-4" />
      
      <ProductPricingFields 
        formData={formData} 
        handleChange={handleChange} 
        handleNumberChange={handleNumberChange}
      />
      
      <Separator className="my-4" />
      
      <ProductDescriptionField 
        formData={formData} 
        handleChange={handleChange} 
      />
      
      <ProductFormActions 
        isSubmitting={isSubmitting} 
        isNewProduct={isNewProduct} 
      />
    </form>
  );
};

export default ProductManagementForm;
