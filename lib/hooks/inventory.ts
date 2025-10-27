import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI } from '@/lib/api'

// Enhanced Inventory Types
export interface InventoryStock {
  id: number
  product_id: number
  batch_no: string
  warehouse_id?: number
  qty_in: number
  qty_out: number
  balance: number
  purchase_rate?: number
  mrp?: number
  mfg_date?: string
  exp_date?: string
  last_txn_type?: string
  last_txn_date?: string
  status: string
  created_at: string
  updated_at: string
  product?: {
    name: string
    sku: string
    category: string
    brand: string
  }
  warehouse?: {
    name: string
  }
}

export interface StockSummary {
  product_name: string
  sku: string
  category: string
  brand: string
  batch_no: string
  qty_in: number
  qty_out: number
  balance: number
  purchase_rate?: number
  mrp?: number
  mfg_date?: string
  exp_date?: string
  warehouse_name: string
  status: string
  last_txn_date?: string
  expiry_status: string
  margin_percent: number
}

export interface StockTransaction {
  id: number
  product_id: number
  batch_no?: string
  warehouse_id?: number
  type: string
  qty: number
  balance_before?: number
  balance_after?: number
  source: string
  ref_id?: number
  ref_type?: string
  reason?: string
  created_by?: number
  created_at: string
  product?: {
    name: string
    sku: string
  }
  warehouse?: {
    name: string
  }
  created_by_user?: {
    name: string
    email: string
  }
}

export interface ManualStockEntryRequest {
  product_id: number
  batch_no: string
  quantity: number
  purchase_rate?: number
  mrp?: number
  mfg_date?: string
  exp_date?: string
  warehouse_id?: number
  reason: string
  notes?: string
}

export interface StockAlert {
  id: number
  product_id: number
  batch_no?: string
  warehouse_id?: number
  current_balance: number
  threshold_qty: number
  alert_type: string
  is_resolved: boolean
  resolved_at?: string
  created_at: string
  updated_at: string
  product?: {
    name: string
    sku: string
  }
  warehouse?: {
    name: string
  }
}

export interface StockValuation {
  product_name: string
  category: string
  brand: string
  total_batches: number
  total_qty_in: number
  total_qty_out: number
  current_balance: number
  avg_purchase_rate: number
  avg_mrp: number
  total_cost_value: number
  total_selling_value: number
  overall_margin_percent: number
}

// Enhanced Inventory Hooks

// Get enhanced stock list with batch tracking
export function useEnhancedInventory(filters?: {
  product_id?: string
  category?: string
  batch_no?: string
  expiry_status?: string
}) {
  return useQuery({
    queryKey: ['inventory', 'stock', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.product_id) params.append('product_id', filters.product_id)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.batch_no) params.append('batch_no', filters.batch_no)
      if (filters?.expiry_status) params.append('expiry_status', filters.expiry_status)

      const res = await golangAPI.get(`/api/erp/inventory/stock?${params.toString()}`)
      return res.data as {
        success: boolean
        data: StockSummary[]
        total: number
      }
    },
    staleTime: 60_000,
  })
}

// Add manual stock entry
export function useAddManualStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ManualStockEntryRequest) => {
      const res = await golangAPI.post('/api/erp/inventory/stock', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] })
    },
  })
}

// Get stock transactions (audit trail)
export function useStockTransactions(filters?: {
  product_id?: string
  batch_no?: string
  source?: string
  type?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['inventory', 'transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.product_id) params.append('product_id', filters.product_id)
      if (filters?.batch_no) params.append('batch_no', filters.batch_no)
      if (filters?.source) params.append('source', filters.source)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const res = await golangAPI.get(`/api/erp/inventory/transactions?${params.toString()}`)
      return res.data as {
        success: boolean
        data: StockTransaction[]
        total: number
        limit: number
        offset: number
      }
    },
    staleTime: 30_000,
  })
}

// Get low stock alerts
export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'alerts', 'low-stock'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/inventory/alerts/low-stock')
      return res.data as {
        success: boolean
        data: StockAlert[]
        total: number
      }
    },
    staleTime: 60_000,
  })
}

// Get expiry alerts
export function useExpiryAlerts() {
  return useQuery({
    queryKey: ['inventory', 'alerts', 'expiry'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/inventory/alerts/expiry')
      return res.data as {
        success: boolean
        data: StockAlert[]
        total: number
      }
    },
    staleTime: 60_000,
  })
}

// Get stock valuation
export function useStockValuation() {
  return useQuery({
    queryKey: ['inventory', 'valuation'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/inventory/valuation')
      return res.data as {
        success: boolean
        data: StockValuation[]
        summary: {
          total_products: number
          total_cost_value: number
          total_selling_value: number
          overall_margin: number
        }
      }
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Resolve low stock alert
export function useResolveLowStockAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await golangAPI.put(`/api/erp/inventory/alerts/low-stock/${alertId}/resolve`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts', 'low-stock'] })
    },
  })
}

// Resolve expiry alert
export function useResolveExpiryAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await golangAPI.put(`/api/erp/inventory/alerts/expiry/${alertId}/resolve`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts', 'expiry'] })
    },
  })
}

// Get stock report
export function useStockReport() {
  return useQuery({
    queryKey: ['inventory', 'reports', 'stock'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/inventory/reports/stock')
      return res.data as {
        success: boolean
        data: {
          total_products: number
          total_batches: number
          total_stock_value: number
          total_selling_value: number
          low_stock_products: number
          expiring_soon: number
          expired_products: number
          top_products: StockValuation[]
          category_summary: Array<{
            category: string
            products_count: number
            batches_count: number
            total_quantity: number
            total_cost_value: number
            total_selling_value: number
          }>
        }
      }
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Legacy hooks (for backward compatibility)
export function useInventory() {
  return useEnhancedInventory()
}

export function useLowStock() {
  return useLowStockAlerts()
}

export function useInventoryStats(inventory: StockSummary[] | undefined) {
  if (!inventory) return {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  }

  const totalProducts = inventory.length
  const totalStockValue = inventory.reduce((sum: number, item: StockSummary) =>
    sum + (item.balance * (item.purchase_rate || 0)), 0)
  const lowStockCount = inventory.filter((item: StockSummary) =>
    item.balance <= 10).length // Default threshold
  const outOfStockCount = inventory.filter((item: StockSummary) =>
    item.balance === 0).length

  return { totalProducts, totalStockValue, lowStockCount, outOfStockCount }
}

export function useInventoryMutations() {
  const qc = useQueryClient()

  const addManualStock = useAddManualStock()

  return {
    addManualStock,
    adjust: addManualStock, // For backward compatibility
  }
}
