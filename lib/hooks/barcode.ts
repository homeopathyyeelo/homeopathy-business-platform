import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI } from '@/lib/api'

// Barcode Types
export interface ProductBarcode {
  id: number
  product_id: number
  batch_id?: number
  batch_no: string
  barcode: string
  barcode_type: string
  mrp: number
  exp_date?: string
  quantity: number
  warehouse_id?: number
  status: string
  notes?: string
  generated_at: string
  created_by: number
  created_at: string
  updated_at: string
  product?: {
    name: string
    sku: string
    potency: string
    form: string
    brand: string
    category: string
  }
  warehouse?: {
    name: string
  }
  user?: {
    name: string
  }
}

export interface BarcodeResponse {
  success: boolean
  data: ProductBarcode[]
  total: number
  limit: number
  offset: number
}

export interface BarcodeGenerateRequest {
  product_id: number
  batch_id?: number
  batch_no?: string
  quantity?: number
  barcode_type?: string
}

export interface BarcodePrintRequest {
  barcode_ids: number[]
  label_size: string
  copies: number
}

export interface BarcodeStats {
  total_barcodes: number
  active_barcodes: number
  expired_barcodes: number
  expiring_soon: number
  total_batches: number
  total_products: number
  recent_generated: number
}

// Get all barcodes with filtering and pagination
export function useBarcodes(filters?: {
  search?: string
  status?: string
  expiry_status?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['barcodes', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.expiry_status) params.append('expiry_status', filters.expiry_status)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const res = await golangAPI.get(`/api/erp/products/barcode?${params.toString()}`)
      return res.data as BarcodeResponse
    },
    staleTime: 60_000,
  })
}

// Get barcode statistics
export function useBarcodeStats() {
  return useQuery({
    queryKey: ['barcodes', 'stats'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/products/barcode/stats')
      return res.data as {
        success: boolean
        data: BarcodeStats
      }
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Generate new barcode
export function useGenerateBarcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BarcodeGenerateRequest) => {
      const res = await golangAPI.post('/api/erp/products/barcode/generate', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] })
      queryClient.invalidateQueries({ queryKey: ['barcodes', 'stats'] })
    },
  })
}

// Print barcodes
export function usePrintBarcodes() {
  return useMutation({
    mutationFn: async (data: BarcodePrintRequest) => {
      const res = await golangAPI.post('/api/erp/products/barcode/print', data)
      return res.data
    },
  })
}

// Update barcode
export function useUpdateBarcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string
      data: {
        mrp?: number
        quantity?: number
        status?: string
        notes?: string
      }
    }) => {
      const res = await golangAPI.put(`/api/erp/products/barcode/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] })
      queryClient.invalidateQueries({ queryKey: ['barcodes', 'stats'] })
    },
  })
}

// Delete barcode
export function useDeleteBarcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await golangAPI.delete(`/api/erp/products/barcode/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] })
      queryClient.invalidateQueries({ queryKey: ['barcodes', 'stats'] })
    },
  })
}

// Get barcodes by product
export function useBarcodesByProduct(productId: string) {
  return useQuery({
    queryKey: ['barcodes', 'product', productId],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/products/barcode?product_id=${productId}`)
      return res.data as BarcodeResponse
    },
    enabled: !!productId,
    staleTime: 60_000,
  })
}

// Get barcodes by batch
export function useBarcodesByBatch(batchNo: string) {
  return useQuery({
    queryKey: ['barcodes', 'batch', batchNo],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/products/barcode?batch_no=${batchNo}`)
      return res.data as BarcodeResponse
    },
    enabled: !!batchNo,
    staleTime: 60_000,
  })
}

// Get expiring barcodes (for alerts)
export function useExpiringBarcodes(days: number = 30) {
  return useQuery({
    queryKey: ['barcodes', 'expiring', days],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/products/barcode?expiry_status=expiring_1m`)
      return res.data as BarcodeResponse
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Get expired barcodes
export function useExpiredBarcodes() {
  return useQuery({
    queryKey: ['barcodes', 'expired'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/products/barcode?expiry_status=expired')
      return res.data as BarcodeResponse
    },
    staleTime: 300_000, // 5 minutes
  })
}

// Utility functions
export function formatBarcode(barcode: string, type: string): string {
  switch (type) {
    case 'EAN13':
      return barcode // Already formatted as 13 digits
    case 'CODE128':
      return barcode // Already formatted
    case 'QR':
      return barcode // Already formatted
    default:
      return barcode
  }
}

export function getBarcodeTypeLabel(type: string): string {
  switch (type) {
    case 'EAN13':
      return 'EAN-13 (Retail Standard)'
    case 'CODE128':
      return 'Code 128 (Compact)'
    case 'QR':
      return 'QR Code (Advanced)'
    default:
      return type
  }
}

export function getStatusBadge(status: string): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' }
    case 'expired':
      return { label: 'Expired', variant: 'destructive' }
    case 'damaged':
      return { label: 'Damaged', variant: 'secondary' }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'outline' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export function getExpiryStatusBadge(expiryStatus: string): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
} {
  switch (expiryStatus) {
    case 'fresh':
      return {
        label: 'Fresh',
        variant: 'default',
        color: 'text-green-600'
      }
    case 'expiring_7d':
      return {
        label: 'Expiring (7D)',
        variant: 'destructive',
        color: 'text-red-600'
      }
    case 'expiring_1m':
      return {
        label: 'Expiring (30D)',
        variant: 'outline',
        color: 'text-yellow-600'
      }
    case 'expiring_3m':
      return {
        label: 'Expiring (90D)',
        variant: 'secondary',
        color: 'text-orange-600'
      }
    case 'expired':
      return {
        label: 'Expired',
        variant: 'destructive',
        color: 'text-red-600'
      }
    default:
      return {
        label: expiryStatus,
        variant: 'outline',
        color: 'text-gray-600'
      }
  }
}
