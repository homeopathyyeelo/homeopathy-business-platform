// Sales SWR Hooks
import useSWR from 'swr';
import { salesService } from '../services/sales.service';

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/sales/invoices`, params],
    () => salesService.getInvoices(params)
  );

  return {
    invoices: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useInvoice(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/sales/invoices/${id}` : null,
    () => salesService.getInvoice(id)
  );

  return {
    invoice: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/sales/orders`, params],
    () => salesService.getOrders(params)
  );

  return {
    orders: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useReturns(params?: {
  page?: number;
  limit?: number;
  invoiceId?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/sales/returns`, params],
    () => salesService.getReturns(params)
  );

  return {
    returns: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePayments(params?: {
  page?: number;
  limit?: number;
  customerId?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/sales/payments`, params],
    () => salesService.getPayments(params)
  );

  return {
    payments: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useOutstanding(customerId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/sales/outstanding`, customerId],
    () => salesService.getOutstanding(customerId)
  );

  return {
    outstanding: data,
    isLoading,
    isError: error,
  };
}

export function useHoldBills() {
  const { data, error, isLoading, mutate } = useSWR(
    '/sales/hold-bills',
    () => salesService.getHoldBills()
  );

  return {
    holdBills: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
