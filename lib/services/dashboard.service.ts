// Dashboard API Service
import { api, PaginatedResponse } from '../api-client';

export interface DashboardKPIs {
  todaySales: number;
  todayPurchases: number;
  todayProfit: number;
  outstanding: number;
  lowStockCount: number;
  expiryAlertCount: number;
  pendingOrdersCount: number;
  activeCustomers: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  quantity: number;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiry' | 'payment_due' | 'reorder';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  actionUrl?: string;
}

export interface RecentActivity {
  id: string;
  type: 'sale' | 'purchase' | 'return' | 'payment';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  userId: string;
  userName: string;
}

export const dashboardService = {
  // Get dashboard KPIs
  getKPIs: async (branchId?: string): Promise<DashboardKPIs> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get<DashboardKPIs>(`/dashboard/kpis${params}`);
  },

  // Get sales trend
  getSalesTrend: async (period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30): Promise<SalesTrend[]> => {
    return api.get<SalesTrend[]>(`/dashboard/sales-trend?period=${period}&days=${days}`);
  },

  // Get top products
  getTopProducts: async (limit: number = 10, period: 'today' | 'week' | 'month' = 'today'): Promise<TopProduct[]> => {
    return api.get<TopProduct[]>(`/dashboard/top-products?limit=${limit}&period=${period}`);
  },

  // Get alerts
  getAlerts: async (type?: string): Promise<Alert[]> => {
    const params = type ? `?type=${type}` : '';
    return api.get<Alert[]>(`/dashboard/alerts${params}`);
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 20): Promise<RecentActivity[]> => {
    return api.get<RecentActivity[]>(`/dashboard/activities?limit=${limit}`);
  },

  // Get AI insights
  getAIInsights: async (): Promise<any> => {
    return api.get('/dashboard/ai-insights');
  },
};
