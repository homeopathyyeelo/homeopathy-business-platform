import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useInventory() {
  return useQuery({
    queryKey: ['inventory', 'list'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/inventory')
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        return data as any[]
      } catch (error) {
        console.error('Failed to fetch inventory:', error)
        return []
      }
    },
    staleTime: 60_000,
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/inventory/low-stock')
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        return data as any[]
      } catch (error) {
        console.error('Failed to fetch low stock:', error)
        return []
      }
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
