import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

// Types for Sales Module
export interface SaleItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  batch_id?: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_id: string
  customer_name: string
  items: SaleItem[]
  subtotal: number
  discount: number
  tax_amount: number
  total_amount: number
  payment_method: 'cash' | 'card' | 'upi' | 'credit'
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  sale_date: string
  created_by: string
  notes?: string
}

export interface SalesStats {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  salesCount: number
  pendingInvoices: number
  refundedAmount: number
}

// Sales Hooks
export function useSales(filters?: {
  status?: string
  customer_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['sales', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.customer_id) params.append('customer_id', filters.customer_id)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/sales?${params}`)
      return res.data as Sale[]
    },
    staleTime: 30_000,
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', 'detail', id],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/sales/${id}`)
      return res.data as Sale
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useSalesStats(filters?: {
  start_date?: string
  end_date?: string
  branch_id?: string
}) {
  return useQuery({
    queryKey: ['sales', 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.branch_id) params.append('branch_id', filters.branch_id)

      const res = await golangAPI.get(`/api/sales/stats?${params}`)
      return res.data as SalesStats
    },
    staleTime: 60_000,
  })
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers', 'list'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/customers')
      return res.data as Array<{
        id: string
        name: string
        phone: string
        email?: string
      }>
    },
    staleTime: 300_000,
  })
}

export function useProducts() {
  return useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/products')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as Array<{
        id: string
        name: string
        sku: string
        unit_price: number
        stock_quantity: number
      }>
    },
    staleTime: 60_000,
  })
}

// Sales Mutations
export function useSalesMutations() {
  const queryClient = useQueryClient()

  const createSale = useMutation({
    mutationFn: async (saleData: Omit<Sale, 'id' | 'sale_number' | 'created_by'>) => {
      const res = await golangAPI.post('/api/sales', saleData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const updateSale = useMutation({
    mutationFn: async ({ id, ...saleData }: Partial<Sale> & { id: string }) => {
      const res = await golangAPI.put(`/api/sales/${id}`, saleData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      await golangAPI.delete(`/api/sales/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const processRefund = useMutation({
    mutationFn: async ({ id, refundData }: { id: string; refundData: any }) => {
      const res = await golangAPI.post(`/api/sales/${id}/refund`, refundData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return {
    create: createSale,
    update: updateSale,
    remove: deleteSale,
    processRefund,
  }
}
