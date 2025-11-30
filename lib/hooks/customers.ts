import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { authFetch } from '@/lib/api/fetch-utils';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers', 'list'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/customers')
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        const json = await res.json()
        console.log('Customers API response:', json) // Debug log
        const data = Array.isArray(json.data) ? json.data : []
        return data as any[]
      } catch (error) {
        console.error('Failed to fetch customers:', error)
        return []
      }
    },
    staleTime: 60_000,
  })
}

export function useCustomerStats(customers: any[] | undefined) {
  if (!customers) return { total: 0, active: 0, newThisMonth: 0, totalOutstanding: 0 }
  const total = customers.length
  const active = customers.filter((c: any) => c.isActive ?? c.is_active ?? true).length
  const newThisMonth = customers.filter((c: any) => {
    const createdAt = new Date(c.createdAt ?? c.created_at)
    const now = new Date()
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
  }).length
  const totalOutstanding = customers.reduce((sum: number, c: any) => sum + (c.outstanding ?? 0), 0)
  return { total, active, newThisMonth, totalOutstanding }
}

export function useCustomerMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: any) => api.customers.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.customers.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.customers.getAll(), // We'll need to implement delete endpoint
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  return { create, update, remove }
}
