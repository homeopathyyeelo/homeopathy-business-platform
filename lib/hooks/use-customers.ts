// Customers SWR Hooks
import useSWR from 'swr';
import { customersService } from '../services/customers.service';

export function useCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  groupId?: string;
  isActive?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/customers`, params],
    () => customersService.getCustomers(params)
  );

  return {
    customers: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCustomer(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/customers/${id}` : null,
    () => customersService.getCustomer(id)
  );

  return {
    customer: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCustomerGroups() {
  const { data, error, isLoading, mutate } = useSWR(
    '/customers/groups',
    () => customersService.getCustomerGroups()
  );

  return {
    customerGroups: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLoyaltyTransactions(customerId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    customerId ? `/customers/${customerId}/loyalty` : null,
    () => customersService.getLoyaltyTransactions(customerId)
  );

  return {
    loyaltyTransactions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCustomerLedger(customerId: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading } = useSWR(
    customerId ? [`/customers/${customerId}/ledger`, params] : null,
    () => customersService.getCustomerLedger(customerId, params)
  );

  return {
    ledger: data || [],
    isLoading,
    isError: error,
  };
}

export function useCommunicationLogs(customerId: string) {
  const { data, error, isLoading } = useSWR(
    customerId ? `/customers/${customerId}/communications` : null,
    () => customersService.getCommunicationLogs(customerId)
  );

  return {
    communications: data || [],
    isLoading,
    isError: error,
  };
}

export function useCustomerOutstanding(customerId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/customers/outstanding`, customerId],
    () => customersService.getOutstanding(customerId)
  );

  return {
    outstanding: data,
    isLoading,
    isError: error,
  };
}
