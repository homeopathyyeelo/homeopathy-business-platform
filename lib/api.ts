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

// Comprehensive API client for all microservices
export const api = {
  // ===== GOLANG API v2 (Gin) - Core ERP Operations =====
  // High-performance endpoints for core business logic
  auth: {
    login: (email: string, password: string) => golangAPI.post('/api/auth/login', { email, password }),
    register: (data: any) => golangAPI.post('/api/auth/register', data),
    me: () => golangAPI.get('/api/auth/me'),
    logout: () => golangAPI.post('/api/auth/logout'),
    refreshToken: () => golangAPI.post('/api/auth/refresh'),
    forgotPassword: (email: string) => golangAPI.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => golangAPI.post('/api/auth/reset-password', { token, password }),
  },

  products: {
    getAll: (params?: any) => golangAPI.get('/api/erp/products', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/products/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/products', data),
    update: (id: string, data: any) => golangAPI.put(`/api/erp/products/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/erp/products/${id}`),
    getStock: (id: string) => golangAPI.get(`/api/erp/products/${id}/stock`),
    updateStock: (id: string, data: any) => golangAPI.post(`/api/erp/products/${id}/stock`, data),
    getLowStock: () => golangAPI.get('/api/erp/products/low-stock'),
    getExpiring: (days?: number) => golangAPI.get('/api/erp/products/expiring', { params: { days } }),
  },

  sales: {
    getAll: (params?: any) => golangAPI.get('/api/erp/sales', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/sales/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/sales', data),
    updateStatus: (id: string, status: string) => golangAPI.put(`/api/erp/sales/${id}/status`, { status }),
    cancel: (id: string) => golangAPI.delete(`/api/erp/sales/${id}`),
    getReport: (params?: any) => golangAPI.get('/api/erp/sales/reports', { params }),
    getCustomerHistory: (customerId: string, params?: any) => 
      golangAPI.get(`/api/erp/customers/${customerId}/sales`, { params }),
  },

  purchases: {
    getAll: (params?: any) => golangAPI.get('/api/erp/purchases', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/purchases/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/purchases', data),
    updateStatus: (id: string, status: string) => golangAPI.put(`/api/erp/purchases/${id}/status`, { status }),
    receive: (id: string, data: any) => golangAPI.post(`/api/erp/purchases/${id}/receive`, data),
  },

  inventory: {
    getAll: (params?: any) => golangAPI.get('/api/erp/inventory', { params }),
    getHistory: (params?: any) => golangAPI.get('/api/erp/inventory/history', { params }),
    adjust: (data: any) => golangAPI.post('/api/erp/inventory/adjust', data),
    transfer: (data: any) => golangAPI.post('/api/erp/inventory/transfer', data),
    getAlerts: () => golangAPI.get('/api/erp/inventory/alerts'),
    getValuation: (warehouseId?: string) => golangAPI.get('/api/erp/inventory/valuation', { params: { warehouse_id: warehouseId } }),
  },

  customers: {
    getAll: (params?: any) => golangAPI.get('/api/erp/customers', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/customers/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/customers', data),
    update: (id: string, data: any) => golangAPI.put(`/api/erp/customers/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/erp/customers/${id}`),
  },

  vendors: {
    getAll: (params?: any) => golangAPI.get('/api/erp/vendors', { params }),
    create: (data: any) => golangAPI.post('/api/erp/vendors', data),
  },

  employees: {
    getAll: (params?: any) => golangAPI.get('/api/erp/employees', { params }),
    create: (data: any) => golangAPI.post('/api/erp/employees', data),
  },

  branches: {
    getAll: (params?: any) => golangAPI.get('/api/erp/branches', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/branches/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/branches', data),
    update: (id: string, data: any) => golangAPI.put(`/api/erp/branches/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/erp/branches/${id}`),
  },

  categories: {
    getAll: (params?: any) => golangAPI.get('/api/erp/categories', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/categories/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/categories', data),
    update: (id: string, data: any) => golangAPI.put(`/api/erp/categories/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/erp/categories/${id}`),
  },

  brands: {
    getAll: (params?: any) => golangAPI.get('/api/erp/brands', { params }),
    getById: (id: string) => golangAPI.get(`/api/erp/brands/${id}`),
    create: (data: any) => golangAPI.post('/api/erp/brands', data),
    update: (id: string, data: any) => golangAPI.put(`/api/erp/brands/${id}`, data),
    delete: (id: string) => golangAPI.delete(`/api/erp/brands/${id}`),
  },

  finance: {
    getLedgerBalance: (ledgerId: string) => golangAPI.get(`/api/erp/finance/ledger/${ledgerId}/balance`),
    createExpense: (data: any) => golangAPI.post('/api/erp/finance/expenses', data),
  },

  reports: {
    sales: (params?: any) => golangAPI.get('/api/erp/reports/sales', { params }),
    inventory: (params?: any) => golangAPI.get('/api/erp/reports/inventory', { params }),
    financial: (params?: any) => golangAPI.get('/api/erp/reports/financial', { params }),
  },

  dashboard: {
    get: () => golangAPI.get('/api/erp/dashboard'),
  },

  // ===== NESTJS API - Enterprise Features & Complex Business Logic =====
  // Advanced features, RBAC, complex workflows
  nest: {
    purchase: {
      vendors: {
        getAll: (params?: any) => nestjsAPI.get('/purchase/vendors', { params }),
        getById: (id: string) => nestjsAPI.get(`/purchase/vendors/${id}`),
        create: (data: any) => nestjsAPI.post('/purchase/vendors', data),
        update: (id: string, data: any) => nestjsAPI.put(`/purchase/vendors/${id}`, data),
      },
      orders: {
        getAll: (params?: any) => nestjsAPI.get('/purchase/orders', { params }),
        getById: (id: string) => nestjsAPI.get(`/purchase/orders/${id}`),
        create: (data: any) => nestjsAPI.post('/purchase/orders', data),
        updateStatus: (id: string, status: string) => nestjsAPI.put(`/purchase/orders/${id}/status`, { status }),
      },
      grn: {
        create: (data: any) => nestjsAPI.post('/purchase/grn', data),
      },
      analytics: (params?: any) => nestjsAPI.get('/purchase/analytics', { params }),
    },
    finance: {
      invoices: {
        getAll: (params?: any) => nestjsAPI.get('/finance/invoices', { params }),
        getById: (id: string) => nestjsAPI.get(`/finance/invoices/${id}`),
        create: (data: any) => nestjsAPI.post('/finance/invoices', data),
        updateStatus: (id: string, status: string) => nestjsAPI.put(`/finance/invoices/${id}/status`, { status }),
      },
      payments: {
        record: (data: any) => nestjsAPI.post('/finance/payments', data),
      },
      reports: {
        profitLoss: (params?: any) => nestjsAPI.get('/finance/reports/profit-loss', { params }),
        cashFlow: (params?: any) => nestjsAPI.get('/finance/reports/cash-flow', { params }),
        gst: (params?: any) => nestjsAPI.get('/finance/reports/gst', { params }),
      },
      currency: {
        getRates: () => nestjsAPI.get('/finance/currency/rates'),
        convert: (amount: number, from: string, to: string) => 
          nestjsAPI.get('/finance/currency/convert', { params: { amount, from, to } }),
      },
    },
  },

  // ===== FASTIFY API - Marketing, Campaigns, High-Speed Operations =====
  // Marketing automation, campaigns, coupons, templates
  marketing: {
    campaigns: {
      getAll: (params?: any) => fastifyAPI.get('/api/campaigns', { params }),
      getById: (id: string) => fastifyAPI.get(`/api/campaigns/${id}`),
      create: (data: any) => fastifyAPI.post('/api/campaigns', data),
      update: (id: string, data: any) => fastifyAPI.put(`/api/campaigns/${id}`, data),
      delete: (id: string) => fastifyAPI.delete(`/api/campaigns/${id}`),
      launch: (id: string) => fastifyAPI.post(`/api/campaigns/${id}/launch`),
    },
    templates: {
      getAll: () => fastifyAPI.get('/api/templates'),
      getById: (id: string) => fastifyAPI.get(`/api/templates/${id}`),
      create: (data: any) => fastifyAPI.post('/api/templates', data),
      update: (id: string, data: any) => fastifyAPI.put(`/api/templates/${id}`, data),
      delete: (id: string) => fastifyAPI.delete(`/api/templates/${id}`),
    },
    coupons: {
      getAll: () => fastifyAPI.get('/api/coupons'),
      getById: (id: string) => fastifyAPI.get(`/api/coupons/${id}`),
      create: (data: any) => fastifyAPI.post('/api/coupons', data),
      update: (id: string, data: any) => fastifyAPI.put(`/api/coupons/${id}`, data),
      delete: (id: string) => fastifyAPI.delete(`/api/coupons/${id}`),
      validate: (code: string) => fastifyAPI.post('/api/coupons/validate', { code }),
    },
    products: {
      getAll: (params?: any) => fastifyAPI.get('/api/products', { params }),
      getById: (id: string) => fastifyAPI.get(`/api/products/${id}`),
      create: (data: any) => fastifyAPI.post('/api/products', data),
      update: (id: string, data: any) => fastifyAPI.put(`/api/products/${id}`, data),
      delete: (id: string) => fastifyAPI.delete(`/api/products/${id}`),
    },
  },

  // ===== EXPRESS API - Legacy Support & Simple Endpoints =====
  // Simple CRUD operations, backward compatibility
  express: {
    products: {
      getAll: () => expressAPI.get('/api/products'),
    },
    orders: {
      getAll: () => expressAPI.get('/api/orders'),
    },
    customers: {
      getAll: () => expressAPI.get('/api/customers'),
    },
  },

  // ===== PYTHON AI SERVICE - ML, AI, Analytics =====
  // AI-powered features, recommendations, forecasting
  ai: {
    chat: (message: string) => pythonAI.post('/api/ai/chat', { message }),
    insights: () => pythonAI.get('/api/ai/insights'),
    forecast: (params?: any) => pythonAI.get('/api/ai/forecast', { params }),
    recommendations: (customerId?: string) => pythonAI.post('/api/ai/recommendations', { customerId }),
    contentGeneration: (prompt: string) => pythonAI.post('/api/ai/content', { prompt }),
    priceOptimization: (productId: string) => pythonAI.post('/api/ai/pricing', { productId }),
    demandForecasting: (productId: string, days: number) => 
      pythonAI.post('/api/ai/demand-forecast', { productId, days }),
    customerSegmentation: () => pythonAI.get('/api/ai/segmentation'),
  },

  // ===== GRAPHQL GATEWAY - Unified Query Layer =====
  // Complex queries, data aggregation
  graphql: {
    query: (query: string, variables?: any) => graphqlAPI.post('/graphql', { query, variables }),
  },
}

export default api
