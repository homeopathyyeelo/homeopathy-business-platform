import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { golangAPI } from '@/lib/api'

export interface GMBAccountInfo {
  businessName: string
  locationId: string
  connectedUser: string
  tokenExpiresAt: string
  status: 'connected' | 'disconnected' | 'expired'
}

export interface GMBScheduleConfig {
  daily: boolean
  weekly: boolean
  monthly: boolean
  diseaseBased: boolean
  seasonalPreset: 'winter' | 'summer' | 'monsoon' | 'festive' | 'none'
  cronExpression?: string
  nextRunAt?: string
}

export interface GMBHistoryItem {
  id: string
  title: string
  content?: string
  preset?: string
  postedAt: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  failureReason?: string
  engagement?: {
    views: number
    clicks: number
  }
}

export interface TrendEntry {
  disease: string
  region: string
  severity: 'low' | 'medium' | 'high'
  recommendedRemedy: string
  summary: string
}

export function useGMBAccount() {
  return useQuery({
    queryKey: ['gmb', 'account'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/social/gmb/account')
      return res.data as { success: boolean; data: GMBAccountInfo }
    },
    staleTime: 60_000,
  })
}

export function useGMBTrends() {
  return useQuery({
    queryKey: ['gmb', 'trends'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/social/gmb/trends')
      return res.data as { success: boolean; data: TrendEntry[] }
    },
    staleTime: 10 * 60_000,
  })
}

export function useGMBSchedules() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['gmb', 'schedules'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/social/gmb/schedules')
      return res.data as { success: boolean; data: GMBScheduleConfig }
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: GMBScheduleConfig) => {
      const res = await golangAPI.post('/api/social/gmb/schedules', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmb', 'schedules'] })
    },
  })

  return { ...query, update: mutation }
}

export function useGMBHistory() {
  return useQuery({
    queryKey: ['gmb', 'history'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/social/gmb/history')
      return res.data as { success: boolean; data: GMBHistoryItem[] }
    },
    refetchInterval: 60_000,
  })
}

export async function generateGMBContent(payload: {
  topic?: string
  preset?: string
  tone?: string
}) {
  const res = await golangAPI.post('/api/social/gmb/generate', payload)
  return res.data as {
    success: boolean
    data?: { title: string; content: string; hashtags?: string[] }
    suggestions?: string[]
    error?: string
  }
}

export async function validateGMBContent(payload: {
  title: string
  content: string
}) {
  const res = await golangAPI.post('/api/social/gmb/validate', payload)
  return res.data as {
    success: boolean
    valid: boolean
    checks: { label: string; passed: boolean; message?: string }[]
  }
}

export async function postGMBContent(payload: {
  title: string
  content: string
  autoApprove: boolean
  schedule?: 'now' | 'daily' | 'weekly' | 'monthly'
  preset?: string
}) {
  const res = await golangAPI.post('/api/social/gmb/post', payload)
  return res.data as { success: boolean; postId?: string; error?: string }
}

export async function initiateGmbOAuth() {
  const res = await golangAPI.post('/api/social/gmb/oauth/initiate')
  return res.data as { success: boolean; authUrl?: string; error?: string }
}

export async function automateGMBPost(payload: { content: string }) {
  const res = await golangAPI.post('/api/social/gmb/automate', payload)
  return res.data as { success: boolean; message?: string; error?: string }
}
