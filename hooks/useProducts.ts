import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productServiceAPI, type Product } from '@/lib/api';
import { toast } from 'sonner';

export function useProducts(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: ['products', page, pageSize, search],
    queryFn: () => productServiceAPI.getProducts(page, pageSize, search),
    staleTime: 30000, // 30 seconds
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productServiceAPI.getProduct(id),
    enabled: !!id,
  });
}

export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['product', 'barcode', barcode],
    queryFn: () => productServiceAPI.getProductByBarcode(barcode),
    enabled: !!barcode,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productServiceAPI.searchProducts(query),
    enabled: query.length > 2,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Partial<Product>) => productServiceAPI.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productServiceAPI.updateProduct(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productServiceAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

// Categories
export function useCategories(page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: ['categories', page, pageSize],
    queryFn: () => productServiceAPI.getCategories(page, pageSize),
    staleTime: 60000, // 1 minute
  });
}

// Brands
export function useBrands(page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: ['brands', page, pageSize],
    queryFn: () => productServiceAPI.getBrands(page, pageSize),
    staleTime: 60000, // 1 minute
  });
}

// Inventory
export function useInventory(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['inventory', page, pageSize],
    queryFn: () => productServiceAPI.getInventory(page, pageSize),
  });
}

export function useInventoryByProduct(productId: string) {
  return useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: () => productServiceAPI.getInventoryByProduct(productId),
    enabled: !!productId,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => productServiceAPI.getLowStock(),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      product_id: string;
      quantity: number;
      type: 'in' | 'out' | 'adjustment';
      reason?: string;
    }) => productServiceAPI.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust stock: ${error.message}`);
    },
  });
}
