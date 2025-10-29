import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

interface ProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
}

interface PaginatedProducts {
  items: any[]
  total: number
  page: number
  perPage: number
}

export function useProducts({ page = 1, perPage = 100, search }: ProductsQueryParams = {}): UseQueryResult<PaginatedProducts> {
  return useQuery<PaginatedProducts>({
    queryKey: ['products', 'list', page, perPage, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(perPage))
      params.set('offset', String((page - 1) * perPage))
      if (search) {
        params.set('search', search)
      }

      const res = await golangAPI.get(`/api/erp/products?${params.toString()}`)

      const products = Array.isArray(res.data)
        ? res.data
        : res.data?.products ?? res.data?.data ?? []

      const pagination = res.data?.pagination || {}

      return {
        items: products,
        total: typeof pagination.total === 'number' ? pagination.total : products.length,
        page,
        perPage,
      }
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

export function useProductStats(products: any) {
  // Normalize to array from various shapes: array | {items}|{data}
  const list: any[] = Array.isArray(products)
    ? products
    : (Array.isArray(products?.items) ? products.items
      : (Array.isArray(products?.data) ? products.data : []))

  if (!Array.isArray(list) || list.length === 0) {
    return { total: 0, active: 0, lowStock: 0, totalValue: 0, categories: 0, brands: 0 }
  }

  const total = list.length
  const active = list.filter((p: any) => (p?.isActive ?? p?.is_active ?? true) === true).length
  const lowStock = list.filter((p: any) => Number(p?.stock ?? p?.stock_qty ?? 0) < 10).length
  const totalValue = list.reduce((sum: number, p: any) => {
    const qty = Number(p?.stock ?? p?.stock_qty ?? 0)
    const price = Number(p?.unit_price ?? p?.price ?? 0)
    return sum + (qty * price)
  }, 0)
  const categories = new Set(list.map((p: any) => p?.category).filter(Boolean)).size
  const brands = new Set(list.map((p: any) => p?.brand).filter(Boolean)).size

  return { total, active, lowStock, totalValue, categories, brands }
}

export function useProductMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/products', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/products/${id}`),
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
