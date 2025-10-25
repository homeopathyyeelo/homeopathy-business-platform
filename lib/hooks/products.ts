import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

export function useProducts() {
  return useQuery({
    queryKey: ['products', 'list'],
    queryFn: async () => {
      // Call Golang API directly with high limit to get all products
      const res = await golangAPI.get('/api/erp/products?limit=10000&page=1')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 60_000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/products/${id}`)
      return res.data?.data ?? res.data
    },
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/categories')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 300_000, // 5 minutes
  })
}

export function useProductBrands() {
  return useQuery({
    queryKey: ['products', 'brands'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/brands')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 300_000,
  })
}

export function useProductBatches() {
  return useQuery({
    queryKey: ['products', 'batches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/products/batches')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 60_000,
  })
}

export function useProductVariants(productId?: string) {
  return useQuery({
    queryKey: ['products', 'variants', productId],
    queryFn: async () => {
      if (!productId) return []
      const res = await golangAPI.get(`/api/products/${productId}/variants`)
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    enabled: !!productId,
    staleTime: 60_000,
  })
}

export function useProductImages(productId?: string) {
  return useQuery({
    queryKey: ['products', 'images', productId],
    queryFn: async () => {
      if (!productId) return []
      const res = await golangAPI.get(`/api/products/${productId}/images`)
      return res.data || []
    },
    enabled: !!productId,
    staleTime: 300_000,
  })
}

export function useProductStats(products: any[] | undefined) {
  if (!products) return {
    total: 0,
    active: 0,
    lowStock: 0,
    totalValue: 0,
    categories: 0,
    brands: 0
  }

  const total = products.length
  const active = products.filter((p: any) => p.isActive ?? p.is_active ?? true).length
  const lowStock = products.filter((p: any) => (p.stock ?? p.stock_qty ?? 0) < 10).length
  const totalValue = products.reduce((sum: number, p: any) =>
    sum + ((p.stock ?? p.stock_qty ?? 0) * (p.unit_price ?? p.price ?? 0)), 0)
  const categories = new Set(products.map(p => p.category)).size
  const brands = new Set(products.map(p => p.brand)).size

  return { total, active, lowStock, totalValue, categories, brands }
}

export function useProductMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/products', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const importProducts = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return golangAPI.post('/api/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  return { create, update, remove, importProducts }
}

export function useCategoryMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/categories', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'categories'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/categories/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'categories'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'categories'] }),
  })

  return { create, update, remove }
}

export function useBrandMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/brands', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'brands'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/brands/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'brands'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/brands/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'brands'] }),
  })

  return { create, update, remove }
}

// Potency mutations
export function usePotencyMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/potencies', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'potencies'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/potencies/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'potencies'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/potencies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'potencies'] }),
  })

  return { create, update, remove }
}

// Form mutations
export function useFormMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/forms', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'forms'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/forms/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'forms'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/forms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'forms'] }),
  })

  return { create, update, remove }
}

// Potencies hook
export function useProductPotencies() {
  return useQuery({
    queryKey: ['products', 'potencies'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/potencies')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 300_000,
  })
}

// Forms hook
export function useProductForms() {
  return useQuery({
    queryKey: ['products', 'forms'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/forms')
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 300_000,
  })
}

export function useBatchMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/products/batches', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'batches'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/products/batches/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'batches'] }),
  })

  return { create, update }
}
