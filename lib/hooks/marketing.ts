import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI, fastifyAPI } from '@/lib/api'

// Types
export interface Campaign {
  id: string
  campaign_name: string
  description: string
  campaign_type: 'whatsapp' | 'sms' | 'email' | 'social'
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
  target_count: number
  sent_count: number
  delivered_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
  scheduled_at?: string
  created_at: string
}

export interface Coupon {
  id: string
  coupon_code: string
  coupon_name: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  valid_from: string
  valid_to: string
  usage_limit: number
  used_count: number
  is_active: boolean
}

export interface MessageTemplate {
  id: string
  template_name: string
  template_type: 'whatsapp' | 'sms' | 'email'
  content: string
  variables: string[]
  is_active: boolean
}

// Campaigns
export function useCampaigns(filters?: {
  status?: string
  campaign_type?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['marketing', 'campaigns', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.campaign_type) params.append('campaign_type', filters.campaign_type)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await fastifyAPI.get(`/api/campaigns?${params}`)
      return (res.data?.data || res.data || []) as Campaign[]
    },
    staleTime: 30_000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['marketing', 'campaign', id],
    queryFn: async () => {
      const res = await fastifyAPI.get(`/api/campaigns/${id}`)
      return res.data as Campaign
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// Coupons
export function useCoupons(filters?: {
  is_active?: boolean
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['marketing', 'coupons', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await fastifyAPI.get(`/api/coupons?${params}`)
      return (res.data?.data || res.data || []) as Coupon[]
    },
    staleTime: 60_000,
  })
}

// Templates
export function useMessageTemplates(filters?: {
  template_type?: string
}) {
  return useQuery({
    queryKey: ['marketing', 'templates', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.template_type) params.append('template_type', filters.template_type)

      const res = await fastifyAPI.get(`/api/templates?${params}`)
      return (res.data?.data || res.data || []) as MessageTemplate[]
    },
    staleTime: 300_000,
  })
}

// Campaign Stats
export function useCampaignStats(campaignId?: string) {
  return useQuery({
    queryKey: ['marketing', 'campaign-stats', campaignId],
    queryFn: async () => {
      if (!campaignId) return null
      const res = await fastifyAPI.get(`/api/campaigns/${campaignId}/stats`)
      return res.data
    },
    enabled: !!campaignId,
    staleTime: 60_000,
  })
}

// Mutations
export function useCampaignMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const res = await fastifyAPI.post('/api/campaigns', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'campaigns'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const res = await fastifyAPI.put(`/api/campaigns/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  })

  const launch = useMutation({
    mutationFn: async (id: string) => {
      const res = await fastifyAPI.post(`/api/campaigns/${id}/launch`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  })

  const pause = useMutation({
    mutationFn: async (id: string) => {
      const res = await fastifyAPI.post(`/api/campaigns/${id}/pause`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fastifyAPI.delete(`/api/campaigns/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  })

  return { create, update, launch, pause, remove }
}

export function useCouponMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: async (data: Partial<Coupon>) => {
      const res = await fastifyAPI.post('/api/coupons', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'coupons'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Coupon> }) => {
      const res = await fastifyAPI.put(`/api/coupons/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'coupons'] }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fastifyAPI.delete(`/api/coupons/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'coupons'] }),
  })

  const validate = useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      const res = await fastifyAPI.post('/api/coupons/validate', { code, amount })
      return res.data
    },
  })

  return { create, update, remove, validate }
}

export function useTemplateMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: async (data: Partial<MessageTemplate>) => {
      const res = await fastifyAPI.post('/api/templates', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MessageTemplate> }) => {
      const res = await fastifyAPI.put(`/api/templates/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fastifyAPI.delete(`/api/templates/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })

  return { create, update, remove }
}
