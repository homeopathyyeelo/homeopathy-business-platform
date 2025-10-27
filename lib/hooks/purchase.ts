import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI } from '@/lib/api'

// Enhanced Purchase Types
export interface PurchaseOrder {
  id: number
  supplier_id?: number
  invoice_no: string
  invoice_date: string
  total_amount: number
  status: string
  approved_by?: number
  approved_at?: string
  notes?: string
  created_by?: number
  created_at: string
  updated_at: string
  supplier?: {
    name: string
    email: string
    phone: string
  }
  created_by_user?: {
    name: string
    email: string
  }
  approved_by_user?: {
    name: string
    email: string
  }
  items?: PurchaseItem[]
  items_count?: number
}

export interface PurchaseItem {
  id: number
  purchase_id: number
  product_id: number
  batch_no: string
  qty: number
  rate: number
  mrp: number
  amount?: number
  mfg_date?: string
  exp_date?: string
  discount_percent: number
  tax_percent: number
  created_at: string
  updated_at: string
  product?: {
    name: string
    sku: string
    category: string
    brand: string
  }
  purchase?: PurchaseOrder
}

export interface PurchaseUploadRequest {
  supplier_id: number
  invoice_no: string
  invoice_date: string
  total_amount: number
  items: PurchaseItemRequest[]
  notes?: string
}

export interface PurchaseItemRequest {
  product_id: number
  batch_no: string
  qty: number
  rate: number
  mrp: number
  mfg_date?: string
  exp_date?: string
  discount_percent: number
  tax_percent: number
}

export interface PurchaseSummaryResponse {
  id: number
  invoice_no: string
  invoice_date: string
  supplier_name: string
  total_amount: number
  status: string
  items_count: number
  created_by: string
  created_at: string
  approved_at?: string
  items?: PurchaseItemResponse[]
}

export interface PurchaseItemResponse {
  id: number
  product_name: string
  sku: string
  category: string
  brand: string
  batch_no: string
  qty: number
  rate: number
  mrp: number
  amount: number
  mfg_date?: string
  exp_date?: string
  discount_percent: number
  tax_percent: number
}

// Enhanced Purchase Hooks

// Get enhanced purchase orders with filtering
export function useEnhancedPurchases(filters?: {
  supplier_id?: string
  status?: string
  invoice_no?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['purchases', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.invoice_no) params.append('invoice_no', filters.invoice_no)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const res = await golangAPI.get(`/api/erp/purchases?${params.toString()}`)
      return res.data as {
        success: boolean
        data: PurchaseSummaryResponse[]
        total: number
        limit: number
        offset: number
      }
    },
    staleTime: 60_000,
  })
}

// Get single purchase order with items
export function useEnhancedPurchase(purchaseId: string) {
  return useQuery({
    queryKey: ['purchases', purchaseId],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/purchases/${purchaseId}`)
      return res.data as {
        success: boolean
        data: PurchaseSummaryResponse
      }
    },
    enabled: !!purchaseId,
    staleTime: 60_000,
  })
}

// Create new purchase order
export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PurchaseUploadRequest) => {
      const res = await golangAPI.post('/api/erp/purchases', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
    },
  })
}

// Approve purchase order
export function useApprovePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (purchaseId: string) => {
      const res = await golangAPI.put(`/api/erp/purchases/${purchaseId}/approve`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchases', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transactions'] })
    },
  })
}

// Reject purchase order
export function useRejectPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ purchaseId, reason }: { purchaseId: string; reason?: string }) => {
      const params = new URLSearchParams()
      if (reason) params.append('reason', reason)

      const res = await golangAPI.put(`/api/erp/purchases/${purchaseId}/reject?${params.toString()}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchases', 'pending'] })
    },
  })
}

// Get pending purchases (for approval dashboard)
export function usePendingPurchases() {
  return useQuery({
    queryKey: ['purchases', 'pending'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/purchases/pending')
      return res.data as {
        success: boolean
        data: PurchaseSummaryResponse[]
        total: number
      }
    },
    staleTime: 30_000, // Refresh more frequently for pending items
  })
}

// Get purchase items for a specific purchase
export function usePurchaseItems(purchaseId: string) {
  return useQuery({
    queryKey: ['purchases', purchaseId, 'items'],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/purchases/${purchaseId}/items`)
      return res.data as {
        success: boolean
        data: PurchaseItemResponse[]
        total: number
      }
    },
    enabled: !!purchaseId,
    staleTime: 60_000,
  })
}

// Add item to purchase order
export function useAddPurchaseItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ purchaseId, item }: { purchaseId: string; item: PurchaseItemRequest }) => {
      const res = await golangAPI.post(`/api/erp/purchases/${purchaseId}/items`, item)
      return res.data
    },
    onSuccess: (_, { purchaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId] })
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId, 'items'] })
    },
  })
}

// Update purchase item
export function useUpdatePurchaseItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      purchaseId,
      itemId,
      item
    }: {
      purchaseId: string
      itemId: string
      item: PurchaseItemRequest
    }) => {
      const res = await golangAPI.put(`/api/erp/purchases/${purchaseId}/items/${itemId}`, item)
      return res.data
    },
    onSuccess: (_, { purchaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId] })
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId, 'items'] })
    },
  })
}

// Delete purchase item
export function useDeletePurchaseItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ purchaseId, itemId }: { purchaseId: string; itemId: string }) => {
      const res = await golangAPI.delete(`/api/erp/purchases/${purchaseId}/items/${itemId}`)
      return res.data
    },
    onSuccess: (_, { purchaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId] })
      queryClient.invalidateQueries({ queryKey: ['purchases', purchaseId, 'items'] })
    },
  })
}

// Get purchase statistics
export function usePurchaseStats(purchases: PurchaseSummaryResponse[] | undefined) {
  if (!purchases) return {
    totalPurchases: 0,
    totalValue: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    averageOrderValue: 0,
  }

  const totalPurchases = purchases.length
  const totalValue = purchases.reduce((sum, p) => sum + p.total_amount, 0)
  const approvedCount = purchases.filter(p => p.status === 'approved').length
  const pendingCount = purchases.filter(p => p.status === 'pending' || p.status === 'draft').length
  const rejectedCount = purchases.filter(p => p.status === 'rejected').length
  const averageOrderValue = totalPurchases > 0 ? totalValue / totalPurchases : 0

  return {
    totalPurchases,
    totalValue,
    approvedCount,
    pendingCount,
    rejectedCount,
    averageOrderValue,
  }
}

// Legacy hooks (for backward compatibility)
export function usePurchases() {
  return useEnhancedPurchases()
}

export function usePurchase(purchaseId: string) {
  return useEnhancedPurchase(purchaseId)
}
