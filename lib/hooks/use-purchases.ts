// Purchases SWR Hooks
import useSWR from 'swr';
import { purchasesService } from '../services/purchases.service';

export function usePurchaseOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/purchases/orders`, params],
    () => purchasesService.getPurchaseOrders(params)
  );

  return {
    purchaseOrders: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePurchaseOrder(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/purchases/orders/${id}` : null,
    () => purchasesService.getPurchaseOrder(id)
  );

  return {
    purchaseOrder: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useGoodsReceipts(params?: {
  page?: number;
  limit?: number;
  poId?: string;
  status?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/purchases/grn`, params],
    () => purchasesService.getGoodsReceipts(params)
  );

  return {
    goodsReceipts: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePurchaseBills(params?: {
  page?: number;
  limit?: number;
  vendorId?: string;
  paymentStatus?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/purchases/bills`, params],
    () => purchasesService.getPurchaseBills(params)
  );

  return {
    purchaseBills: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useVendorPayments(params?: {
  page?: number;
  limit?: number;
  vendorId?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/purchases/payments`, params],
    () => purchasesService.getVendorPayments(params)
  );

  return {
    vendorPayments: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePriceComparison(productId: string) {
  const { data, error, isLoading } = useSWR(
    productId ? `/purchases/price-comparison/${productId}` : null,
    () => purchasesService.getVendorPriceComparison(productId)
  );

  return {
    priceComparison: data || [],
    isLoading,
    isError: error,
  };
}

export function useAIReorder(branchId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/purchases/ai-reorder`, branchId],
    () => purchasesService.getAIReorderSuggestions(branchId)
  );

  return {
    reorderSuggestions: data || [],
    isLoading,
    isError: error,
  };
}
