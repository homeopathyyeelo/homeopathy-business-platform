// Reports SWR Hooks
import useSWR from 'swr';
import { reportsService, ReportParams } from '../services/reports.service';

export function useSalesReport(params: ReportParams) {
  const { data, error, isLoading } = useSWR(
    params.startDate && params.endDate ? [`/reports/sales`, params] : null,
    () => reportsService.getSalesReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function usePurchaseReport(params: ReportParams) {
  const { data, error, isLoading } = useSWR(
    params.startDate && params.endDate ? [`/reports/purchases`, params] : null,
    () => reportsService.getPurchaseReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useStockReport(params?: { branchId?: string; categoryId?: string }) {
  const { data, error, isLoading } = useSWR(
    [`/reports/inventory/stock`, params],
    () => reportsService.getStockReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useExpiryReport(params?: { branchId?: string; days?: number }) {
  const { data, error, isLoading } = useSWR(
    [`/reports/inventory/expiry`, params],
    () => reportsService.getExpiryReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useProfitLossReport(params: ReportParams) {
  const { data, error, isLoading } = useSWR(
    params.startDate && params.endDate ? [`/reports/profit-loss`, params] : null,
    () => reportsService.getProfitLossReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useGSTReportData(params: { period: string; type?: 'gstr1' | 'gstr3b' }) {
  const { data, error, isLoading } = useSWR(
    params.period ? [`/reports/gst`, params] : null,
    () => reportsService.getGSTReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useCustomerReport(params?: { type?: string; minPurchase?: number }) {
  const { data, error, isLoading } = useSWR(
    [`/reports/customers`, params],
    () => reportsService.getCustomerReport(params)
  );

  return {
    report: data,
    isLoading,
    isError: error,
  };
}

export function useSavedReports() {
  const { data, error, isLoading, mutate } = useSWR(
    '/reports/custom/saved',
    () => reportsService.getSavedReports()
  );

  return {
    savedReports: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
