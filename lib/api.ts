import axios, { AxiosInstance } from 'axios'

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

const createAPIClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const golangAPI = createAPIClient(process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3004')
export const expressAPI = createAPIClient(process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3003')
export const nestjsAPI = createAPIClient(process.env.NEXT_PUBLIC_NESTJS_API_URL || 'http://localhost:3001')
export const fastifyAPI = createAPIClient(process.env.NEXT_PUBLIC_FASTIFY_API_URL || 'http://localhost:3002')
export const pythonAI = createAPIClient(process.env.NEXT_PUBLIC_PYTHON_AI_URL || 'http://localhost:8001')
export const graphqlAPI = createAPIClient(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000')
export const apiGateway = createAPIClient(process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:5000')

export const api = {
  auth: {
    login: (email: string, password: string) => 
      apiGateway.post('/api/auth/login', { email, password }),
    me: () => apiGateway.get('/api/auth/me'),
    logout: () => apiGateway.post('/api/auth/logout'),
  },
  products: {
    getAll: () => golangAPI.get('/api/products'),
    getById: (id: string) => golangAPI.get(`/api/products/${id}`),
    create: (data: any) => golangAPI.post('/api/products', data),
    update: (id: string, data: any) => golangAPI.put(`/api/products/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/products/${id}`),
  },
  customers: {
    getAll: () => golangAPI.get('/api/customers'),
    getById: (id: string) => golangAPI.get(`/api/customers/${id}`),
    create: (data: any) => golangAPI.post('/api/customers', data),
    update: (id: string, data: any) => golangAPI.put(`/api/customers/${id}`, data),
  },
  orders: {
    getAll: () => golangAPI.get('/api/orders'),
    getById: (id: string) => golangAPI.get(`/api/orders/${id}`),
    create: (data: any) => golangAPI.post('/api/orders', data),
  },
  inventory: {
    getAll: () => golangAPI.get('/api/inventory'),
    getLowStock: () => golangAPI.get('/api/inventory/low-stock'),
    adjust: (data: any) => golangAPI.post('/api/inventory/adjust', data),
  },
  analytics: {
    getDashboard: () => golangAPI.get('/api/analytics/dashboard'),
    getRevenue: () => golangAPI.get('/api/analytics/revenue'),
  },
  campaigns: {
    getAll: () => expressAPI.get('/api/campaigns'),
    create: (data: any) => expressAPI.post('/api/campaigns', data),
    launch: (id: string) => expressAPI.post(`/api/campaigns/${id}/launch`),
  },
  ai: {
    chat: (message: string) => pythonAI.post('/api/ai/chat', { message }),
    insights: () => pythonAI.get('/api/ai/insights'),
    forecast: () => pythonAI.get('/api/ai/forecast'),
  },
}

export default api
