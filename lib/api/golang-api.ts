import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || '/api'

const golangAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
golangAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try multiple token sources
    let token = localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      getCookie('auth-token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Helper function to get cookie
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

// Products API
export const productsAPI = {
  getAll: () => golangAPI.get('/api/products'),
  getById: (id: string) => golangAPI.get(`/api/erp/products/${id}`),
  create: (data: any) => golangAPI.post('/api/products', data),
  update: (id: string, data: any) => golangAPI.put(`/api/erp/products/${id}`, data),
  delete: (id: string) => golangAPI.delete(`/api/erp/products/${id}`),
}

// Customers API
export const customersAPI = {
  getAll: () => golangAPI.get('/api/customers'),
  getById: (id: string) => golangAPI.get(`/api/customers/${id}`),
  create: (data: any) => golangAPI.post('/api/customers', data),
  update: (id: string, data: any) => golangAPI.put(`/api/customers/${id}`, data),
  delete: (id: string) => golangAPI.delete(`/api/customers/${id}`),
}

// Orders API
export const ordersAPI = {
  getAll: () => golangAPI.get('/api/orders'),
  getById: (id: string) => golangAPI.get(`/api/orders/${id}`),
  create: (data: any) => golangAPI.post('/api/orders', data),
  updateStatus: (id: string, status: string) =>
    golangAPI.put(`/api/orders/${id}/status`, { status }),
  delete: (id: string) => golangAPI.delete(`/api/orders/${id}`),
}

// Inventory API
export const inventoryAPI = {
  getAll: () => golangAPI.get('/api/erp/inventory'),
  getLowStock: () => golangAPI.get('/api/erp/inventory/alerts/low-stock'),
  adjust: (data: any) => golangAPI.post('/api/erp/inventory/adjust', data),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: () => golangAPI.get('/api/analytics/dashboard'),
  getRevenue: () => golangAPI.get('/api/analytics/revenue'),
  getTopProducts: () => golangAPI.get('/api/analytics/top-products'),
}

// Campaigns API
export const campaignsAPI = {
  getAll: () => golangAPI.get('/api/campaigns'),
  getById: (id: string) => golangAPI.get(`/api/campaigns/${id}`),
  create: (data: any) => golangAPI.post('/api/campaigns', data),
  update: (id: string, data: any) => golangAPI.put(`/api/campaigns/${id}`, data),
  delete: (id: string) => golangAPI.delete(`/api/campaigns/${id}`),
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    golangAPI.post('/api/auth/login', { email, password }),
  me: () => golangAPI.get('/api/auth/me'),
  logout: () => golangAPI.post('/api/auth/logout'),
}

export default golangAPI
