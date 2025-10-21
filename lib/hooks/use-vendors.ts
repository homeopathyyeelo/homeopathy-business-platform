// Vendors SWR Hooks
import useSWR from 'swr';
import { vendorsService } from '../services/vendors.service';

export function useVendors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/vendors`, params],
    () => vendorsService.getVendors(params)
  );

  return {
    vendors: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useVendor(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/vendors/${id}` : null,
    () => vendorsService.getVendor(id)
  );

  return {
    vendor: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useVendorLedger(vendorId: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading } = useSWR(
    vendorId ? [`/vendors/${vendorId}/ledger`, params] : null,
    () => vendorsService.getVendorLedger(vendorId, params)
  );

  return {
    ledger: data || [],
    isLoading,
    isError: error,
  };
}

export function useVendorContracts(vendorId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    vendorId ? `/vendors/${vendorId}/contracts` : null,
    () => vendorsService.getVendorContracts(vendorId)
  );

  return {
    contracts: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useVendorPerformance(vendorId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/vendors/performance`, vendorId],
    () => vendorsService.getVendorPerformance(vendorId)
  );

  return {
    performance: data || [],
    isLoading,
    isError: error,
  };
}

export function useVendorOutstanding(vendorId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/vendors/outstanding`, vendorId],
    () => vendorsService.getOutstanding(vendorId)
  );

  return {
    outstanding: data,
    isLoading,
    isError: error,
  };
}
