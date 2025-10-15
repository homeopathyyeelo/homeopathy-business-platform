import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

export function useVendors() {
  return useQuery({
    queryKey: ['vendors', 'list'],
    queryFn: async () => {
      // Try NestJS API first, fallback to Go API if needed
      try {
        const res = await nestjsAPI.get('/api/vendors')
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        return data as any[]
      } catch (error) {
        // Fallback to Go API
        const res = await golangAPI.get('/api/vendors')
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
        return data as any[]
      }
    },
    staleTime: 60_000,
  })
}

export function useVendorTypes() {
  return useQuery({
    queryKey: ['vendors', 'types'],
    queryFn: async () => {
      try {
        const res = await nestjsAPI.get('/api/vendor-types')
        return res.data || []
      } catch (error) {
        return [
          { id: 'manufacturer', name: 'Manufacturer', description: 'Product manufacturers' },
          { id: 'distributor', name: 'Distributor', description: 'Product distributors' },
          { id: 'wholesaler', name: 'Wholesaler', description: 'Bulk suppliers' },
          { id: 'retailer', name: 'Retailer', description: 'Retail suppliers' }
        ]
      }
    },
    staleTime: 300_000, // 5 minutes
  })
}

export function useVendorStats(vendors: any[] | undefined) {
  if (!vendors) return {
    total: 0,
    active: 0,
    manufacturers: 0,
    distributors: 0,
    totalOutstanding: 0,
    avgRating: 0
  }

  const total = vendors.length
  const active = vendors.filter((v: any) => v.isActive ?? v.is_active ?? true).length
  const manufacturers = vendors.filter((v: any) => (v.type ?? v.vendor_type) === 'manufacturer').length
  const distributors = vendors.filter((v: any) => (v.type ?? v.vendor_type) === 'distributor').length
  const totalOutstanding = vendors.reduce((sum: number, v: any) => sum + (v.outstanding ?? 0), 0)
  const avgRating = vendors.length > 0 ?
    vendors.reduce((sum: number, v: any) => sum + (v.rating ?? 0), 0) / vendors.length : 0

  return { total, active, manufacturers, distributors, totalOutstanding, avgRating }
}

export function useVendorMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => nestjsAPI.post('/api/vendors', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nestjsAPI.put(`/api/vendors/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => nestjsAPI.delete(`/api/vendors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  })

  return { create, update, remove }
}
