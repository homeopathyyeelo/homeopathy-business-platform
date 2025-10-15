import { useQuery } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

// Types for Reports Module
export interface SalesReport {
  id: string
  period: string
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  total_sales: number
  total_quantity: number
  total_customers: number
  average_order_value: number
  top_products: Array<{
    product_id: string
    product_name: string
    total_quantity: number
    total_revenue: number
  }>
  sales_by_category: Array<{
    category: string
    total_quantity: number
    total_revenue: number
  }>
  sales_by_payment_method: Array<{
    method: string
    total_amount: number
    transaction_count: number
  }>
  generated_at: string
}

export interface PurchaseReport {
  id: string
  period: string
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  total_purchases: number
  total_quantity: number
  total_vendors: number
  average_order_value: number
  top_products: Array<{
    product_id: string
    product_name: string
    total_quantity: number
    total_cost: number
  }>
  purchases_by_vendor: Array<{
    vendor_id: string
    vendor_name: string
    total_amount: number
    total_quantity: number
  }>
  generated_at: string
}

export interface InventoryReport {
  id: string
  as_of_date: string
  total_products: number
  total_stock_value: number
  low_stock_products: Array<{
    product_id: string
    product_name: string
    current_stock: number
    reorder_level: number
    stock_value: number
  }>
  out_of_stock_products: Array<{
    product_id: string
    product_name: string
    last_stock_date?: string
  }>
  fast_moving_products: Array<{
    product_id: string
    product_name: string
    total_sold: number
    average_daily_sale: number
  }>
  slow_moving_products: Array<{
    product_id: string
    product_name: string
    total_sold: number
    days_since_last_sale: number
  }>
  category_wise_stock: Array<{
    category: string
    total_products: number
    total_value: number
  }>
  generated_at: string
}

export interface GSTReport {
  id: string
  period: string
  period_type: 'monthly' | 'quarterly' | 'yearly'
  total_gst_collected: number
  total_gst_paid: number
  net_gst: number
  gst_by_rate: Array<{
    rate: number
    collected: number
    paid: number
    net: number
  }>
  gst_summary: {
    igst: number
    cgst: number
    sgst: number
    total: number
  }
  generated_at: string
}

export interface FinancialReport {
  id: string
  period: string
  period_type: 'monthly' | 'quarterly' | 'yearly'
  total_income: number
  total_expenses: number
  gross_profit: number
  net_profit: number
  profit_margin: number
  expense_breakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  income_breakdown: Array<{
    source: string
    amount: number
    percentage: number
  }>
  generated_at: string
}

// Reports Hooks
export function useSalesReports(filters?: {
  period?: string
  period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  branch_id?: string
}) {
  return useQuery({
    queryKey: ['reports', 'sales', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)
      if (filters?.branch_id) params.append('branch_id', filters.branch_id)

      const res = await golangAPI.get(`/api/reports/sales?${params}`)
      return res.data as SalesReport[]
    },
    staleTime: 60_000,
  })
}

export function usePurchaseReports(filters?: {
  period?: string
  period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  vendor_id?: string
}) {
  return useQuery({
    queryKey: ['reports', 'purchases', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)

      const res = await golangAPI.get(`/api/reports/purchases?${params}`)
      return res.data as PurchaseReport[]
    },
    staleTime: 60_000,
  })
}

export function useInventoryReports(filters?: {
  as_of_date?: string
  category_id?: string
  branch_id?: string
}) {
  return useQuery({
    queryKey: ['reports', 'inventory', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.as_of_date) params.append('as_of_date', filters.as_of_date)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.branch_id) params.append('branch_id', filters.branch_id)

      const res = await golangAPI.get(`/api/reports/inventory?${params}`)
      return res.data as InventoryReport[]
    },
    staleTime: 60_000,
  })
}

export function useGSTReports(filters?: {
  period?: string
  period_type?: 'monthly' | 'quarterly' | 'yearly'
  gst_type?: 'collected' | 'paid' | 'both'
}) {
  return useQuery({
    queryKey: ['reports', 'gst', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)
      if (filters?.gst_type) params.append('gst_type', filters.gst_type)

      const res = await golangAPI.get(`/api/reports/gst?${params}`)
      return res.data as GSTReport[]
    },
    staleTime: 60_000,
  })
}

export function useFinancialReports(filters?: {
  period?: string
  period_type?: 'monthly' | 'quarterly' | 'yearly'
}) {
  return useQuery({
    queryKey: ['reports', 'financial', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)

      const res = await golangAPI.get(`/api/reports/financial?${params}`)
      return res.data as FinancialReport[]
    },
    staleTime: 60_000,
  })
}

export function useCustomerReports(filters?: {
  period?: string
  period_type?: 'monthly' | 'quarterly' | 'yearly'
  customer_segment?: string
}) {
  return useQuery({
    queryKey: ['reports', 'customers', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)
      if (filters?.customer_segment) params.append('customer_segment', filters.customer_segment)

      const res = await golangAPI.get(`/api/reports/customers?${params}`)
      return res.data as Array<{
        period: string
        total_customers: number
        new_customers: number
        active_customers: number
        customer_retention_rate: number
        average_customer_value: number
        top_customers: Array<{
          customer_id: string
          customer_name: string
          total_purchases: number
          total_spent: number
        }>
      }>
    },
    staleTime: 60_000,
  })
}

export function useVendorReports(filters?: {
  period?: string
  period_type?: 'monthly' | 'quarterly' | 'yearly'
  vendor_id?: string
}) {
  return useQuery({
    queryKey: ['reports', 'vendors', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)

      const res = await golangAPI.get(`/api/reports/vendors?${params}`)
      return res.data as Array<{
        period: string
        total_vendors: number
        active_vendors: number
        total_purchase_value: number
        average_order_value: number
        top_vendors: Array<{
          vendor_id: string
          vendor_name: string
          total_purchases: number
          total_amount: number
        }>
      }>
    },
    staleTime: 60_000,
  })
}

// Export functions for report generation
export function exportSalesReport(filters: any) {
  return golangAPI.post('/api/reports/sales/export', filters, {
    responseType: 'blob'
  })
}

export function exportPurchaseReport(filters: any) {
  return golangAPI.post('/api/reports/purchases/export', filters, {
    responseType: 'blob'
  })
}

export function exportInventoryReport(filters: any) {
  return golangAPI.post('/api/reports/inventory/export', filters, {
    responseType: 'blob'
  })
}

export function exportGSTReport(filters: any) {
  return golangAPI.post('/api/reports/gst/export', filters, {
    responseType: 'blob'
  })
}

export function exportFinancialReport(filters: any) {
  return golangAPI.post('/api/reports/financial/export', filters, {
    responseType: 'blob'
  })
}
