import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

// Types for Purchases Module
export interface PurchaseOrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  received_quantity?: number
  pending_quantity?: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  vendor_id: string
  vendor_name: string
  items: PurchaseOrderItem[]
  subtotal: number
  discount: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'pending' | 'approved' | 'partial_received' | 'received' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  created_by: string
  notes?: string
  terms?: string
}

export interface GoodsReceiptNote {
  id: string
  grn_number: string
  po_id: string
  po_number: string
  vendor_id: string
  vendor_name: string
  items: PurchaseOrderItem[]
  received_date: string
  received_by: string
  total_quantity: number
  total_amount: number
  status: 'draft' | 'confirmed' | 'cancelled'
  notes?: string
}

export interface VendorPayment {
  id: string
  payment_number: string
  vendor_id: string
  vendor_name: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'credit'
  payment_date: string
  reference_number?: string
  notes?: string
  status: 'pending' | 'completed' | 'failed'
}

export interface PurchaseStats {
  totalPOs: number
  totalPOValue: number
  pendingPOs: number
  receivedPOs: number
  totalPayments: number
  pendingPayments: number
  averageOrderValue: number
}

// Purchases Hooks
export function usePurchaseOrders(filters?: {
  status?: string
  vendor_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['purchases', 'orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/purchases/orders?${params}`)
      return res.data as PurchaseOrder[]
    },
    staleTime: 30_000,
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchases', 'order', id],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/purchases/orders/${id}`)
      return res.data as PurchaseOrder
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useGRNs(filters?: {
  status?: string
  po_id?: string
  vendor_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['purchases', 'grns', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.po_id) params.append('po_id', filters.po_id)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/purchases/grns?${params}`)
      return res.data as GoodsReceiptNote[]
    },
    staleTime: 30_000,
  })
}

export function useVendorPayments(filters?: {
  status?: string
  vendor_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['purchases', 'payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/purchases/payments?${params}`)
      return res.data as VendorPayment[]
    },
    staleTime: 30_000,
  })
}

export function usePurchaseStats(filters?: {
  start_date?: string
  end_date?: string
  vendor_id?: string
}) {
  return useQuery({
    queryKey: ['purchases', 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id)

      const res = await golangAPI.get(`/api/purchases/stats?${params}`)
      return res.data as PurchaseStats
    },
    staleTime: 60_000,
  })
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors', 'list'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/vendors')
      return res.data as Array<{
        id: string
        name: string
        contact_person: string
        phone: string
        email?: string
        address?: string
      }>
    },
    staleTime: 300_000,
  })
}

// Purchases Mutations
export function usePurchaseMutations() {
  const queryClient = useQueryClient()

  const createPurchaseOrder = useMutation({
    mutationFn: async (poData: Omit<PurchaseOrder, 'id' | 'po_number' | 'created_by'>) => {
      const res = await golangAPI.post('/api/purchases/orders', poData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, ...poData }: Partial<PurchaseOrder> & { id: string }) => {
      const res = await golangAPI.put(`/api/purchases/orders/${id}`, poData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string) => {
      await golangAPI.delete(`/api/purchases/orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  const createGRN = useMutation({
    mutationFn: async (grnData: Omit<GoodsReceiptNote, 'id' | 'grn_number' | 'received_by'>) => {
      const res = await golangAPI.post('/api/purchases/grns', grnData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const createVendorPayment = useMutation({
    mutationFn: async (paymentData: Omit<VendorPayment, 'id' | 'payment_number'>) => {
      const res = await golangAPI.post('/api/purchases/payments', paymentData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  return {
    createPO: createPurchaseOrder,
    updatePO: updatePurchaseOrder,
    deletePO: deletePurchaseOrder,
    createGRN,
    createPayment: createVendorPayment,
  }
}
