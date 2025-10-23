// Products SWR Hooks
import useSWR from 'swr';
import { productsService } from '../services/products.service';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}) {
  return useSWR(
    ['products', params],
    () => productsService.getProducts(params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

export function useProduct(id: string | null) {
  return useSWR(
    id ? ['product', id] : null,
    () => id ? productsService.getProduct(id) : null,
    {
      revalidateOnFocus: false,
    }
  );
}

export function useCategories() {
  return useSWR(
    'categories',
    () => productsService.getCategories(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
}

export function useBrands() {
  return useSWR(
    'brands',
    () => productsService.getBrands(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

export function usePotencies() {
  return useSWR(
    'potencies',
    () => productsService.getPotencies(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

export function useForms() {
  return useSWR(
    'forms',
    () => productsService.getForms(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}

export function useBatches(productId: string | null) {
  return useSWR(
    productId ? ['batches', productId] : null,
    () => productId ? productsService.getBatches(productId) : null,
    {
      revalidateOnFocus: true,
    }
  );
}
