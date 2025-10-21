// Inventory SWR Hooks
import useSWR from 'swr';
import { inventoryService } from '../services/inventory.service';

export function useStock(params?: {
  branchId?: string;
  productId?: string;
  categoryId?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    params ? [`/inventory/stock`, params] : null,
    () => inventoryService.getStock(params)
  );

  return {
    stock: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useStockByProduct(productId: string, branchId?: string) {
  const { data, error, isLoading } = useSWR(
    productId ? [`/inventory/stock/${productId}`, branchId] : null,
    () => inventoryService.getStockByProduct(productId, branchId)
  );

  return {
    stock: data,
    isLoading,
    isError: error,
  };
}

export function useAdjustments(params?: {
  page?: number;
  limit?: number;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/inventory/adjustments`, params],
    () => inventoryService.getAdjustments(params)
  );

  return {
    adjustments: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTransfers(params?: {
  page?: number;
  limit?: number;
  fromBranchId?: string;
  toBranchId?: string;
  status?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/inventory/transfers`, params],
    () => inventoryService.getTransfers(params)
  );

  return {
    transfers: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExpiryAlerts(branchId?: string, days: number = 90) {
  const { data, error, isLoading } = useSWR(
    [`/inventory/expiry-alerts`, branchId, days],
    () => inventoryService.getExpiryAlerts(branchId, days)
  );

  return {
    alerts: data || [],
    isLoading,
    isError: error,
  };
}

export function useLowStock(branchId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/inventory/low-stock`, branchId],
    () => inventoryService.getLowStock(branchId)
  );

  return {
    lowStockItems: data || [],
    isLoading,
    isError: error,
  };
}

export function useDeadStock(branchId?: string, days: number = 180) {
  const { data, error, isLoading } = useSWR(
    [`/inventory/dead-stock`, branchId, days],
    () => inventoryService.getDeadStock(branchId, days)
  );

  return {
    deadStockItems: data || [],
    isLoading,
    isError: error,
  };
}

export function useStockValuation(branchId?: string, date?: string) {
  const { data, error, isLoading } = useSWR(
    [`/inventory/valuation`, branchId, date],
    () => inventoryService.getStockValuation(branchId, date)
  );

  return {
    valuation: data,
    isLoading,
    isError: error,
  };
}

export function useReorderSuggestions(branchId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/inventory/ai-reorder`, branchId],
    () => inventoryService.getAIReorderSuggestions(branchId)
  );

  return {
    suggestions: data || [],
    isLoading,
    isError: error,
  };
}
