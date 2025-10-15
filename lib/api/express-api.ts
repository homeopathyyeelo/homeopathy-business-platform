import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3003'

const expressAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
expressAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Campaigns API
export const campaignsAPI = {
  getAll: () => expressAPI.get('/api/campaigns'),
  getById: (id: string) => expressAPI.get(`/api/campaigns/${id}`),
  create: (data: any) => expressAPI.post('/api/campaigns', data),
  launch: (id: string) => expressAPI.post(`/api/campaigns/${id}/launch`),
}

// Marketing API
export const marketingAPI = {
  getCampaigns: () => expressAPI.get('/api/campaigns'),
  getAnalytics: () => expressAPI.get('/api/marketing/analytics'),
}

export default expressAPI
