// Dashboard SWR Hooks
import useSWR from 'swr';
import { dashboardService } from '../services/dashboard.service';

export function useDashboardKPIs(branchId?: string) {
  return useSWR(
    branchId ? ['dashboard-kpis', branchId] : 'dashboard-kpis',
    () => dashboardService.getKPIs(branchId),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );
}

export function useSalesTrend(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
  return useSWR(
    ['sales-trend', period, days],
    () => dashboardService.getSalesTrend(period, days),
    {
      refreshInterval: 60000, // Refresh every minute
    }
  );
}

export function useTopProducts(limit: number = 10, period: 'today' | 'week' | 'month' = 'today') {
  return useSWR(
    ['top-products', limit, period],
    () => dashboardService.getTopProducts(limit, period),
    {
      refreshInterval: 60000,
    }
  );
}

export function useAlerts(type?: string) {
  return useSWR(
    type ? ['alerts', type] : 'alerts',
    () => dashboardService.getAlerts(type),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );
}

export function useRecentActivities(limit: number = 20) {
  return useSWR(
    ['recent-activities', limit],
    () => dashboardService.getRecentActivities(limit),
    {
      refreshInterval: 15000, // Refresh every 15 seconds
    }
  );
}

export function useAIInsights() {
  return useSWR(
    'ai-insights',
    () => dashboardService.getAIInsights(),
    {
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );
}
