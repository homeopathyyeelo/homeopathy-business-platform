import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

interface ProductsQueryParams {
  page?: number
  perPage?: number
  search?: string
  category?: string
  brand?: string
  potency?: string
  form?: string
}

interface PaginatedProducts {
  items: any[]
  total: number
  page: number
  perPage: number
}

export function useProducts({ page = 1, perPage = 100, search, category, brand, potency, form }: ProductsQueryParams = {}): UseQueryResult<PaginatedProducts> {
  return useQuery<PaginatedProducts>({
    queryKey: ['products', 'list', page, perPage, search, category, brand, potency, form],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(perPage))
      params.set('page', String(page))  // Use page instead of offset
      if (search) {
        params.set('search', search)
      }
      if (category) {
        params.set('category', category)
      }
      if (brand) {
        params.set('brand', brand)
      }
      if (potency) {
        params.set('potency', potency)
      }
      if (form) {
        params.set('form', form)
      }

      const res = await golangAPI.get(`/api/erp/products?${params.toString()}`)

      // Primary backend response
      let products = res.data?.data ?? res.data?.products ?? (Array.isArray(res.data) ? res.data : [])
      const pagination = res.data?.pagination || {}

      // If API reports products in DB (total > 0) but sends null/empty data,
      // fall back to the barcode products endpoint and normalise fields.
      if ((!Array.isArray(products) || products.length === 0) && (pagination.total ?? 0) > 0) {
        const barcodeRes = await golangAPI.get(`/api/erp/products/barcode?${params.toString()}`)
        const barcodeProducts = barcodeRes.data?.data ?? barcodeRes.data?.products ?? (Array.isArray(barcodeRes.data) ? barcodeRes.data : [])
        const barcodePagination = barcodeRes.data?.pagination || pagination

        if (Array.isArray(barcodeProducts)) {
          products = barcodeProducts.map((p: any) => ({
            ...p,
            // Normalise fields expected by the table
            name: p.name ?? p.product_name ?? '',
            category: p.category ?? '',
            brand: p.brand ?? '',
            potency: p.potency ?? '',
            form: p.form ?? '',
            packSize: p.packSize ?? p.pack_size ?? '',
            barcode: p.barcode ?? '',
            hsnCode: p.hsnCode ?? p.hsn_code ?? '',
            currentStock: p.currentStock ?? p.quantity ?? 0,
            sellingPrice: p.sellingPrice ?? p.mrp ?? 0,
            taxPercent: p.taxPercent ?? p.gst_rate ?? 5,
            isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.status ? p.status !== 'inactive' : true),
          }))

          // Override pagination with barcode pagination if present
          if (barcodePagination) {
            (pagination as any).total = barcodePagination.total ?? pagination.total
            ;(pagination as any).page = barcodePagination.page ?? pagination.page
            ;(pagination as any).limit = barcodePagination.limit ?? pagination.limit
          }
        }
      }

      const items = Array.isArray(products) ? products : []
      const total = typeof pagination.total === 'number' ? pagination.total : items.length

      return {
        items,
        total,
        page: pagination.page ?? page,
        perPage: pagination.limit ?? perPage,
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
      const data = res.data?.data?.categories || res.data?.categories || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
    },
    staleTime: 300_000,
  })
}

export function useProductBrands() {
  return useQuery({
    queryKey: ['products', 'brands'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/brands')
      const data = res.data?.data?.brands || res.data?.brands || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
    },
    staleTime: 300_000,
  })
}

export function useProductBatches() {
  return useQuery({
    queryKey: ['products', 'batches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/products/batches')
      const data = res.data?.data?.batches || res.data?.batches || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
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
      const data = res.data?.data?.variants || res.data?.variants || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
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
      const data = res.data?.data?.images || res.data?.images || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
    },
    enabled: !!productId,
    staleTime: 300_000,
  })
}

// Get stats from API instead of calculating from client-side data
export function useProductStats() {
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/products/stats')
      const data = res.data?.data || {}
      return {
        total: data.total_products ?? 0,
        active: data.active_products ?? 0,
        lowStock: data.low_stock_count ?? 0,
        outOfStock: data.out_of_stock_count ?? 0,
        totalValue: data.total_inventory_value ?? 0,
        avgCost: data.avg_cost_price ?? 0,
        avgSelling: data.avg_selling_price ?? 0,
        categories: data.total_categories ?? 0,
        brands: data.total_brands ?? 0,
        highValue: data.high_value_products ?? 0,
      }
    },
    staleTime: 60_000,
  })
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
      const data = res.data?.data?.potencies || res.data?.potencies || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
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
      const data = res.data?.data?.forms || res.data?.forms || res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
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
