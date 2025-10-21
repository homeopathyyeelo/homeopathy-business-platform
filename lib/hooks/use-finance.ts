// Finance SWR Hooks
import useSWR from 'swr';
import { financeService } from '../services/finance.service';

export function useSalesLedger(params?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/finance/ledger/sales`, params],
    () => financeService.getSalesLedger(params)
  );

  return {
    ledger: data || [],
    isLoading,
    isError: error,
  };
}

export function usePurchaseLedger(params?: {
  startDate?: string;
  endDate?: string;
  vendorId?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/finance/ledger/purchase`, params],
    () => financeService.getPurchaseLedger(params)
  );

  return {
    ledger: data || [],
    isLoading,
    isError: error,
  };
}

export function useCashBook(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/finance/cash-book`, params],
    () => financeService.getCashBook(params)
  );

  return {
    cashBook: data || [],
    isLoading,
    isError: error,
  };
}

export function useBankBook(params?: {
  startDate?: string;
  endDate?: string;
  accountId?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/finance/bank-book`, params],
    () => financeService.getBankBook(params)
  );

  return {
    bankBook: data || [],
    isLoading,
    isError: error,
  };
}

export function useVouchers(params?: {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/finance/vouchers`, params],
    () => financeService.getVouchers(params)
  );

  return {
    vouchers: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExpenses(params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/finance/expenses`, params],
    () => financeService.getExpenses(params)
  );

  return {
    expenses: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useGSTReport(period: string) {
  const { data, error, isLoading } = useSWR(
    period ? `/finance/gst-report?period=${period}` : null,
    () => financeService.getGSTReport(period)
  );

  return {
    gstReport: data,
    isLoading,
    isError: error,
  };
}

export function useTrialBalance(date: string) {
  const { data, error, isLoading } = useSWR(
    date ? `/finance/trial-balance?date=${date}` : null,
    () => financeService.getTrialBalance(date)
  );

  return {
    trialBalance: data || [],
    isLoading,
    isError: error,
  };
}

export function useProfitLoss(startDate: string, endDate: string) {
  const { data, error, isLoading } = useSWR(
    startDate && endDate ? `/finance/profit-loss?start=${startDate}&end=${endDate}` : null,
    () => financeService.getProfitLoss(startDate, endDate)
  );

  return {
    profitLoss: data,
    isLoading,
    isError: error,
  };
}

export function useBalanceSheet(date: string) {
  const { data, error, isLoading } = useSWR(
    date ? `/finance/balance-sheet?date=${date}` : null,
    () => financeService.getBalanceSheet(date)
  );

  return {
    balanceSheet: data,
    isLoading,
    isError: error,
  };
}
