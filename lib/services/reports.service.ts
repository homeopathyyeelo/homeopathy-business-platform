// Reports & Analytics API Service
import { api } from '../api-client';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  groupBy?: 'day' | 'week' | 'month';
  format?: 'json' | 'pdf' | 'excel' | 'csv';
}

export const reportsService = {
  // Sales Reports
  getSalesReport: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/sales?${queryParams}`);
  },

  getSalesByProduct: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/sales/by-product?${queryParams}`);
  },

  getSalesByCustomer: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/sales/by-customer?${queryParams}`);
  },

  getSalesByBranch: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/sales/by-branch?${queryParams}`);
  },

  // Purchase Reports
  getPurchaseReport: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/purchases?${queryParams}`);
  },

  getPurchaseByVendor: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/purchases/by-vendor?${queryParams}`);
  },

  getPurchaseByProduct: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/purchases/by-product?${queryParams}`);
  },

  // Inventory Reports
  getStockReport: async (params?: { branchId?: string; categoryId?: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/inventory/stock?${queryParams}`);
  },

  getLowStockReport: async (params?: { branchId?: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/inventory/low-stock?${queryParams}`);
  },

  getExpiryReport: async (params?: { branchId?: string; days?: number }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/inventory/expiry?${queryParams}`);
  },

  getStockValuation: async (params?: { branchId?: string; date?: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/inventory/valuation?${queryParams}`);
  },

  getStockMovement: async (params: ReportParams & { productId?: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/inventory/movement?${queryParams}`);
  },

  // Profit & Loss Reports
  getProfitLossReport: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/profit-loss?${queryParams}`);
  },

  getProductProfitability: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/profit-loss/by-product?${queryParams}`);
  },

  getBranchProfitability: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/profit-loss/by-branch?${queryParams}`);
  },

  // GST/Tax Reports
  getGSTReport: async (params: { period: string; type?: 'gstr1' | 'gstr3b' }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/gst?${queryParams}`);
  },

  getTaxSummary: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/tax-summary?${queryParams}`);
  },

  // Customer Reports
  getCustomerReport: async (params?: { type?: string; minPurchase?: number }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/customers?${queryParams}`);
  },

  getCustomerOutstanding: async (): Promise<any> => {
    return api.get('/reports/customers/outstanding');
  },

  getCustomerLTV: async (params?: { limit?: number }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/customers/ltv?${queryParams}`);
  },

  // Vendor Reports
  getVendorReport: async (): Promise<any> => {
    return api.get('/reports/vendors');
  },

  getVendorOutstanding: async (): Promise<any> => {
    return api.get('/reports/vendors/outstanding');
  },

  getVendorPerformance: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/vendors/performance?${queryParams}`);
  },

  // Employee Reports
  getEmployeeReport: async (): Promise<any> => {
    return api.get('/reports/employees');
  },

  getAttendanceReport: async (params: ReportParams & { employeeId?: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/attendance?${queryParams}`);
  },

  getSalaryReport: async (params: { month: string }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/salary?${queryParams}`);
  },

  // Financial Reports
  getTrialBalance: async (params: { date: string }): Promise<any> => {
    return api.get(`/reports/trial-balance?date=${params.date}`);
  },

  getBalanceSheet: async (params: { date: string }): Promise<any> => {
    return api.get(`/reports/balance-sheet?date=${params.date}`);
  },

  getCashFlow: async (params: ReportParams): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/reports/cash-flow?${queryParams}`);
  },

  // Custom Report Builder
  getCustomReport: async (config: any): Promise<any> => {
    return api.post('/reports/custom', config);
  },

  saveCustomReport: async (name: string, config: any): Promise<any> => {
    return api.post('/reports/custom/save', { name, config });
  },

  getSavedReports: async (): Promise<any[]> => {
    return api.get('/reports/custom/saved');
  },

  // Export Reports
  exportReport: async (reportType: string, params: any, format: 'pdf' | 'excel' | 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    return api.download(`/reports/${reportType}/export?${queryParams}`, `${reportType}-report.${format}`);
  },

  // Scheduled Reports
  scheduleReport: async (config: {
    reportType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel';
  }): Promise<any> => {
    return api.post('/reports/schedule', config);
  },

  getScheduledReports: async (): Promise<any[]> => {
    return api.get('/reports/schedule');
  },
};
