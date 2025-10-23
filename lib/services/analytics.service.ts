// Analytics & BI Dashboard API Service
import { api } from '../api-client';

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  compareWith?: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesVsPurchaseAnalysis {
  period: string;
  sales: {
    total: number;
    count: number;
    average: number;
    trend: number;
  };
  purchases: {
    total: number;
    count: number;
    average: number;
    trend: number;
  };
  margin: {
    gross: number;
    net: number;
    percentage: number;
  };
  chartData: Array<{
    date: string;
    sales: number;
    purchases: number;
    profit: number;
  }>;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  quantitySold: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

export interface CustomerLTV {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalRevenue: number;
  averageOrderValue: number;
  frequency: number;
  lastPurchaseDate: string;
  lifetimeValue: number;
  segment: 'vip' | 'loyal' | 'regular' | 'at_risk' | 'lost';
  predictedValue: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  sales: number;
  purchases: number;
  profit: number;
  profitMargin: number;
  customers: number;
  orders: number;
  averageOrderValue: number;
  growth: number;
  rank: number;
}

export interface ExpenseVsProfit {
  period: string;
  revenue: number;
  expenses: {
    purchases: number;
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  chartData: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface CashFlowInsight {
  period: string;
  opening: number;
  inflows: {
    sales: number;
    receipts: number;
    other: number;
    total: number;
  };
  outflows: {
    purchases: number;
    payments: number;
    salaries: number;
    expenses: number;
    other: number;
    total: number;
  };
  closing: number;
  netCashFlow: number;
  chartData: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
}

export const analyticsService = {
  // Dashboard Overview
  getAnalyticsDashboard: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/dashboard', period);
  },

  // Sales vs Purchase Analysis
  getSalesVsPurchase: async (period: AnalyticsPeriod): Promise<SalesVsPurchaseAnalysis> => {
    return api.post<SalesVsPurchaseAnalysis>('/analytics/sales-vs-purchase', period);
  },

  getSalesTrend: async (period: AnalyticsPeriod, groupBy: 'day' | 'week' | 'month'): Promise<any> => {
    return api.post('/analytics/sales-trend', { ...period, groupBy });
  },

  getPurchaseTrend: async (period: AnalyticsPeriod, groupBy: 'day' | 'week' | 'month'): Promise<any> => {
    return api.post('/analytics/purchase-trend', { ...period, groupBy });
  },

  // Product Performance
  getProductPerformance: async (params: {
    period: AnalyticsPeriod;
    limit?: number;
    categoryId?: string;
    sortBy?: 'revenue' | 'profit' | 'quantity';
  }): Promise<ProductPerformance[]> => {
    return api.post<ProductPerformance[]>('/analytics/product-performance', params);
  },

  getTopProducts: async (period: AnalyticsPeriod, limit: number = 10): Promise<ProductPerformance[]> => {
    return api.post<ProductPerformance[]>('/analytics/top-products', { ...period, limit });
  },

  getSlowMovingProducts: async (period: AnalyticsPeriod): Promise<any[]> => {
    return api.post('/analytics/slow-moving-products', period);
  },

  getCategoryPerformance: async (period: AnalyticsPeriod): Promise<any[]> => {
    return api.post('/analytics/category-performance', period);
  },

  // Customer Analytics
  getCustomerLTV: async (params?: {
    limit?: number;
    segment?: string;
    minValue?: number;
  }): Promise<CustomerLTV[]> => {
    return api.post<CustomerLTV[]>('/analytics/customer-ltv', params);
  },

  getCustomerSegmentation: async (): Promise<any> => {
    return api.get('/analytics/customer-segmentation');
  },

  getCustomerRetention: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/customer-retention', period);
  },

  getCustomerAcquisition: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/customer-acquisition', period);
  },

  // Branch Performance
  getBranchPerformance: async (period: AnalyticsPeriod): Promise<BranchPerformance[]> => {
    return api.post<BranchPerformance[]>('/analytics/branch-performance', period);
  },

  compareBranches: async (period: AnalyticsPeriod, branchIds: string[]): Promise<any> => {
    return api.post('/analytics/branch-comparison', { ...period, branchIds });
  },

  getBranchTrends: async (branchId: string, period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/branch-trends', { branchId, ...period });
  },

  // Expense vs Profit
  getExpenseVsProfit: async (period: AnalyticsPeriod): Promise<ExpenseVsProfit> => {
    return api.post<ExpenseVsProfit>('/analytics/expense-vs-profit', period);
  },

  getExpenseBreakdown: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/expense-breakdown', period);
  },

  getProfitMarginTrend: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/profit-margin-trend', period);
  },

  // Cash Flow
  getCashFlowInsights: async (period: AnalyticsPeriod): Promise<CashFlowInsight> => {
    return api.post<CashFlowInsight>('/analytics/cash-flow', period);
  },

  getCashFlowForecast: async (months: number): Promise<any> => {
    return api.post('/analytics/cash-flow-forecast', { months });
  },

  getWorkingCapital: async (): Promise<any> => {
    return api.get('/analytics/working-capital');
  },

  // Advanced Analytics
  getABCAnalysis: async (type: 'products' | 'customers'): Promise<any> => {
    return api.get(`/analytics/abc-analysis?type=${type}`);
  },

  getSeasonalityAnalysis: async (productId?: string): Promise<any> => {
    const params = productId ? `?product_id=${productId}` : '';
    return api.get(`/analytics/seasonality${params}`);
  },

  getCorrelationAnalysis: async (): Promise<any> => {
    return api.get('/analytics/correlation');
  },

  // KPI Tracking
  getKPIs: async (period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/kpis', period);
  },

  getKPITrends: async (kpiName: string, period: AnalyticsPeriod): Promise<any> => {
    return api.post('/analytics/kpi-trends', { kpiName, ...period });
  },

  // Export
  exportAnalytics: async (reportType: string, period: AnalyticsPeriod, format: 'pdf' | 'excel'): Promise<void> => {
    return api.download(`/analytics/export/${reportType}?format=${format}`, `analytics-${reportType}.${format}`);
  },
};
