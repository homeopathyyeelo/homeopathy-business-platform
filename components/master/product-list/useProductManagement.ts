
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { useToast } from '@/hooks/use-toast';
import { Product, Category } from '@/types';

const useProductManagement = () => {
  const { getAll, delete: deleteRecord } = useDatabase();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products with error handling
  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        console.log('Fetching products...');
        const result = await getAll('products');
        console.log('Products fetched successfully:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAll('categories')
  });

  // Fetch inventory for stock levels
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const getStockLevel = (productId: string): number => {
    const productInventory = inventory.filter((inv: any) => inv.product_id === productId);
    return productInventory.reduce((total: number, inv: any) => total + (inv.quantity_in_stock || 0), 0);
  };

  const handleViewProduct = (product: Product) => {
    console.log('Viewing product:', product);
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const confirmDeleteProduct = (product: Product) => {
    console.log('Confirming delete for product:', product);
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      console.log('=== PRODUCT DELETE OPERATION START ===');
      console.log('Deleting product:', productToDelete);

      // Check if product is used in inventory
      const productInventory = inventory.filter((inv: any) => inv.product_id === productToDelete.id);
      const hasStock = productInventory.some((inv: any) => (inv.quantity_in_stock || 0) > 0);
      
      if (hasStock) {
        toast({
          title: 'Cannot Delete Product',
          description: 'This product has stock and cannot be deleted. Please move or adjust stock first.',
          variant: 'destructive'
        });
        return;
      }

      const result = await deleteRecord('products', productToDelete.id);
      console.log('Delete result:', result);
      
      if (result) {
        toast({
          title: 'Product Deleted',
          description: `${productToDelete.name} has been deleted successfully`
        });
        
        console.log('=== PRODUCT DELETE OPERATION SUCCESS ===');
        
        // Refresh products list
        await refetchProducts();
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      }
      
    } catch (error) {
      console.error('=== PRODUCT DELETE OPERATION FAILED ===');
      console.error('Error deleting product:', error);
      
      toast({
        title: 'Error',
        description: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const handleSaveProduct = async () => {
    try {
      console.log('=== PRODUCT SAVE CALLBACK START ===');
      
      // Refresh products list after save
      await refetchProducts();
      
      // Close dialogs and reset state
      setIsAddProductOpen(false);
      setEditingProduct(null);
      
      console.log('=== PRODUCT SAVE CALLBACK SUCCESS ===');
      
    } catch (error) {
      console.error('=== PRODUCT SAVE CALLBACK FAILED ===');
      console.error('Error in save callback:', error);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    isAddProductOpen,
    setIsAddProductOpen,
    editingProduct,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    isProductDetailsOpen,
    setIsProductDetailsOpen,
    selectedProduct,
    products,
    categories,
    inventory,
    getStockLevel,
    handleViewProduct,
    handleEditProduct,
    confirmDeleteProduct,
    handleDeleteProduct,
    handleSaveProduct
  };
};

export default useProductManagement;
