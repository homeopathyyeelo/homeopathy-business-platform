import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useInventory() {
  return useQuery({
    queryKey: ['inventory', 'list'],
    queryFn: async () => {
      const res = await api.inventory.getAll()
      // assume backend returns array or {data: []}
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 60_000,
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const res = await api.inventory.getLowStock()
      // assume backend returns array or {data: []}
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
      return data as any[]
    },
    staleTime: 60_000,
  })
}

export function useInventoryStats(inventory: any[] | undefined) {
  if (!inventory) return {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  }

  const totalProducts = inventory.length
  const totalStockValue = inventory.reduce((sum: number, item: any) =>
    sum + ((item.stock_qty ?? item.stock ?? 0) * (item.unit_price ?? item.price ?? 0)), 0)
  const lowStockCount = inventory.filter((item: any) =>
    (item.stock_qty ?? item.stock ?? 0) <= (item.reorder_point ?? 5)).length
  const outOfStockCount = inventory.filter((item: any) =>
    (item.stock_qty ?? item.stock ?? 0) === 0).length

  return { totalProducts, totalStockValue, lowStockCount, outOfStockCount }
}

export function useInventoryMutations() {
  const qc = useQueryClient()

  const adjust = useMutation({
    mutationFn: (payload: any) => api.inventory.adjust(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return { adjust }
}
