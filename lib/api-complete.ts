// Complete API Client for All Microservices
// Integrates: Golang v1 (Fiber), Golang v2 (Gin), NestJS, Fastify, Python AI, GraphQL

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// Service base URLs
const GOLANG_V1_URL = process.env.NEXT_PUBLIC_GOLANG_V1_URL || 'http://localhost:3005'
const GOLANG_V2_URL = process.env.NEXT_PUBLIC_GOLANG_V2_URL || 'http://localhost:3005'
const NEST_URL = process.env.NEXT_PUBLIC_NEST_URL || 'http://localhost:3001'
const FASTIFY_URL = process.env.NEXT_PUBLIC_FASTIFY_URL || 'http://localhost:3002'
const PYTHON_URL = process.env.NEXT_PUBLIC_PYTHON_URL || 'http://localhost:8001'
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

// Create axios instances for each service
const createServiceClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({ baseURL })
  
  // Request interceptor - Add JWT token
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
  
  return client
}

const golangV1Client = createServiceClient(GOLANG_V1_URL)
const golangV2Client = createServiceClient(GOLANG_V2_URL)
const nestClient = createServiceClient(NEST_URL)
const fastifyClient = createServiceClient(FASTIFY_URL)
const pythonClient = createServiceClient(PYTHON_URL)

// ============================================================================
// COMPLETE API CLIENT - ALL SERVICES INTEGRATED
// ============================================================================

export const api = {
  // ==========================================================================
  // GOLANG API v1 (Fiber/Echo) - Port 3005
  // Workflows, Offline Mode, Hardware, System Management
  // ==========================================================================
  
  workflows: {
    getAll: (params?: any) => golangV1Client.get('/api/workflows', { params }),
    getById: (id: string) => golangV1Client.get(`/api/workflows/${id}`),
    create: (data: any) => golangV1Client.post('/api/workflows', data),
    update: (id: string, data: any) => golangV1Client.put(`/api/workflows/${id}`, data),
    delete: (id: string) => golangV1Client.delete(`/api/workflows/${id}`),
    execute: (id: string, data?: any) => golangV1Client.post(`/api/workflows/${id}/execute`, data),
    getActive: () => golangV1Client.get('/api/workflows/active'),
  },
  
  offline: {
    getStatus: () => golangV1Client.get('/api/offline/status'),
    setMode: (enabled: boolean) => golangV1Client.post('/api/offline/mode', { enabled }),
    getData: (entityType: string, entityId: string) => 
      golangV1Client.get(`/api/offline/storage/${entityType}/${entityId}`),
    storeData: (entityType: string, entityId: string, data: any) => 
      golangV1Client.post(`/api/offline/storage/${entityType}/${entityId}`, data),
    getQueue: () => golangV1Client.get('/api/offline/queue'),
    queueOperation: (operation: any) => golangV1Client.post('/api/offline/queue/operations', operation),
    processQueue: () => golangV1Client.post('/api/offline/queue/process'),
    sync: () => golangV1Client.post('/api/offline/sync'),
    getSyncStatus: () => golangV1Client.get('/api/offline/sync/status'),
    getConflicts: () => golangV1Client.get('/api/offline/sync/conflicts'),
    resolveConflict: (conflictId: string, resolution: any) => 
      golangV1Client.post(`/api/offline/sync/conflicts/${conflictId}/resolve`, resolution),
  },
  
  multiPC: {
    sessions: {
      create: (data: any) => golangV1Client.post('/api/multi-pc/sessions', data),
      getByUser: (userId: string) => golangV1Client.get(`/api/multi-pc/sessions/users/${userId}`),
      join: (sessionId: string) => golangV1Client.post(`/api/multi-pc/sessions/${sessionId}/join`),
      leave: (sessionId: string) => golangV1Client.post(`/api/multi-pc/sessions/${sessionId}/leave`),
    },
    carts: {
      create: (data: any) => golangV1Client.post('/api/multi-pc/carts', data),
      get: (cartId: string) => golangV1Client.get(`/api/multi-pc/carts/${cartId}`),
      update: (cartId: string, data: any) => golangV1Client.put(`/api/multi-pc/carts/${cartId}`, data),
    },
    billing: {
      hold: (data: any) => golangV1Client.post('/api/multi-pc/billing/hold', data),
      resume: (billId: string) => golangV1Client.post(`/api/multi-pc/billing/${billId}/resume`),
    },
    devices: {
      getConnected: (sessionId: string) => golangV1Client.get(`/api/multi-pc/devices/sessions/${sessionId}`),
      sendMessage: (deviceId: string, message: any) => 
        golangV1Client.post(`/api/multi-pc/devices/${deviceId}/message`, message),
    },
  },
  
  hardware: {
    print: (data: any) => golangV1Client.post('/api/hardware/print', data),
    scan: () => golangV1Client.get('/api/hardware/scan'),
    display: (message: string) => golangV1Client.post('/api/hardware/display', { message }),
  },
  
  company: {
    getProfile: () => golangV1Client.get('/api/company/profile'),
    updateProfile: (data: any) => golangV1Client.put('/api/company/profile', data),
    getBranches: () => golangV1Client.get('/api/company/branches'),
    createBranch: (data: any) => golangV1Client.post('/api/company/branches', data),
  },
  
  // ==========================================================================
  // GOLANG API v2 (Gin) - Port 3004
  // Core ERP: Products, Sales, Inventory, Customers, Dashboard
  // ==========================================================================
  
  products: {
    getAll: (params?: any) => golangV2Client.get('/api/erp/products', { params }),
    getById: (id: string) => golangV2Client.get(`/api/erp/products/${id}`),
    create: (data: any) => golangV2Client.post('/api/erp/products', data),
    update: (id: string, data: any) => golangV2Client.put(`/api/erp/products/${id}`, data),
    delete: (id: string) => golangV2Client.delete(`/api/erp/products/${id}`),
    getStock: (id: string) => golangV2Client.get(`/api/erp/products/${id}/stock`),
    updateStock: (id: string, data: any) => golangV2Client.post(`/api/erp/products/${id}/stock`, data),
    getLowStock: () => golangV2Client.get('/api/erp/products/low-stock'),
    getExpiring: (days?: number) => golangV2Client.get('/api/erp/products/expiring', { params: { days } }),
  },
  
  sales: {
    getAll: (params?: any) => golangV2Client.get('/api/erp/sales', { params }),
    getById: (id: string) => golangV2Client.get(`/api/erp/sales/${id}`),
    create: (data: any) => golangV2Client.post('/api/erp/sales', data),
    updateStatus: (id: string, status: string) => golangV2Client.put(`/api/erp/sales/${id}/status`, { status }),
    cancel: (id: string) => golangV2Client.delete(`/api/erp/sales/${id}`),
    getReport: (params?: any) => golangV2Client.get('/api/erp/sales/reports', { params }),
    getCustomerHistory: (customerId: string, params?: any) => 
      golangV2Client.get(`/api/erp/customers/${customerId}/sales`, { params }),
  },
  
  inventory: {
    getAll: (params?: any) => golangV2Client.get('/api/erp/inventory', { params }),
    getHistory: (params?: any) => golangV2Client.get('/api/erp/inventory/history', { params }),
    adjust: (data: any) => golangV2Client.post('/api/erp/inventory/adjust', data),
    transfer: (data: any) => golangV2Client.post('/api/erp/inventory/transfer', data),
    getAlerts: () => golangV2Client.get('/api/erp/inventory/alerts'),
    getValuation: (warehouseId?: string) => 
      golangV2Client.get('/api/erp/inventory/valuation', { params: { warehouseId } }),
  },
  
  customers: {
    getAll: (params?: any) => golangV2Client.get('/api/erp/customers', { params }),
    getById: (id: string) => golangV2Client.get(`/api/erp/customers/${id}`),
    create: (data: any) => golangV2Client.post('/api/erp/customers', data),
    update: (id: string, data: any) => golangV2Client.put(`/api/erp/customers/${id}`, data),
    delete: (id: string) => golangV2Client.delete(`/api/erp/customers/${id}`),
    addLoyaltyPoints: (id: string, points: number) => 
      golangV2Client.post(`/api/erp/customers/${id}/loyalty/points`, { points }),
  },
  
  dashboard: {
    getData: () => golangV2Client.get('/api/erp/dashboard'),
    getSalesMetrics: (period?: string) => golangV2Client.get('/api/erp/dashboard/sales', { params: { period } }),
    getInventoryMetrics: () => golangV2Client.get('/api/erp/dashboard/inventory'),
  },
  
  reports: {
    sales: (params?: any) => golangV2Client.get('/api/erp/reports/sales', { params }),
    inventory: (params?: any) => golangV2Client.get('/api/erp/reports/inventory', { params }),
    customers: (params?: any) => golangV2Client.get('/api/erp/reports/customers', { params }),
  },
  
  // ==========================================================================
  // NESTJS API - Port 3001
  // Enterprise: Purchases, Finance, HR, Vendors
  // ==========================================================================
  
  purchases: {
    vendors: {
      getAll: (params?: any) => nestClient.get('/purchase/vendors', { params }),
      getById: (id: string) => nestClient.get(`/purchase/vendors/${id}`),
      create: (data: any) => nestClient.post('/purchase/vendors', data),
      update: (id: string, data: any) => nestClient.put(`/purchase/vendors/${id}`, data),
      delete: (id: string) => nestClient.delete(`/purchase/vendors/${id}`),
    },
    orders: {
      getAll: (params?: any) => nestClient.get('/purchase/orders', { params }),
      getById: (id: string) => nestClient.get(`/purchase/orders/${id}`),
      create: (data: any) => nestClient.post('/purchase/orders', data),
      updateStatus: (id: string, status: string) => nestClient.put(`/purchase/orders/${id}/status`, { status }),
      approve: (id: string) => nestClient.post(`/purchase/orders/${id}/approve`),
    },
    grn: {
      create: (data: any) => nestClient.post('/purchase/grn', data),
      getAll: (params?: any) => nestClient.get('/purchase/grn', { params }),
    },
    analytics: {
      get: (params?: any) => nestClient.get('/purchase/analytics', { params }),
    },
  },
  
  finance: {
    invoices: {
      getAll: (params?: any) => nestClient.get('/finance/invoices', { params }),
      getById: (id: string) => nestClient.get(`/finance/invoices/${id}`),
      create: (data: any) => nestClient.post('/finance/invoices', data),
      update: (id: string, data: any) => nestClient.put(`/finance/invoices/${id}`, data),
      delete: (id: string) => nestClient.delete(`/finance/invoices/${id}`),
    },
    payments: {
      record: (data: any) => nestClient.post('/finance/payments', data),
      getAll: (params?: any) => nestClient.get('/finance/payments', { params }),
    },
    reports: {
      profitLoss: (params?: any) => nestClient.get('/finance/reports/profit-loss', { params }),
      cashFlow: (params?: any) => nestClient.get('/finance/reports/cash-flow', { params }),
      gst: (params?: any) => nestClient.get('/finance/reports/gst', { params }),
    },
    currency: {
      getRates: () => nestClient.get('/finance/currency/rates'),
      convert: (from: string, to: string, amount: number) => 
        nestClient.post('/finance/currency/convert', { from, to, amount }),
    },
  },
  
  hr: {
    employees: {
      getAll: (params?: any) => nestClient.get('/hr/employees', { params }),
      getById: (id: string) => nestClient.get(`/hr/employees/${id}`),
      create: (data: any) => nestClient.post('/hr/employees', data),
      update: (id: string, data: any) => nestClient.put(`/hr/employees/${id}`, data),
    },
    attendance: {
      mark: (data: any) => nestClient.post('/hr/attendance', data),
      getAll: (params?: any) => nestClient.get('/hr/attendance', { params }),
    },
    leaves: {
      apply: (data: any) => nestClient.post('/hr/leaves', data),
      approve: (id: string) => nestClient.post(`/hr/leaves/${id}/approve`),
      getAll: (params?: any) => nestClient.get('/hr/leaves', { params }),
    },
    payroll: {
      process: (month: string, year: number) => nestClient.post('/hr/payroll/process', { month, year }),
      get: (params?: any) => nestClient.get('/hr/payroll', { params }),
    },
  },
  
  // ==========================================================================
  // FASTIFY API - Port 3002
  // Marketing: Campaigns, Social Media, CRM, Templates
  // ==========================================================================
  
  marketing: {
    campaigns: {
      getAll: (params?: any) => fastifyClient.get('/api/campaigns', { params }),
      getById: (id: string) => fastifyClient.get(`/api/campaigns/${id}`),
      create: (data: any) => fastifyClient.post('/api/campaigns', data),
      update: (id: string, data: any) => fastifyClient.put(`/api/campaigns/${id}`, data),
      delete: (id: string) => fastifyClient.delete(`/api/campaigns/${id}`),
      launch: (id: string) => fastifyClient.post(`/api/campaigns/${id}/launch`),
      getStats: (id: string) => fastifyClient.get(`/api/campaigns/${id}/stats`),
    },
    templates: {
      getAll: (params?: any) => fastifyClient.get('/api/templates', { params }),
      getById: (id: string) => fastifyClient.get(`/api/templates/${id}`),
      create: (data: any) => fastifyClient.post('/api/templates', data),
      update: (id: string, data: any) => fastifyClient.put(`/api/templates/${id}`, data),
      delete: (id: string) => fastifyClient.delete(`/api/templates/${id}`),
    },
    coupons: {
      getAll: (params?: any) => fastifyClient.get('/api/coupons', { params }),
      create: (data: any) => fastifyClient.post('/api/coupons', data),
      validate: (code: string) => fastifyClient.post('/api/coupons/validate', { code }),
    },
    social: {
      schedule: (data: any) => fastifyClient.post('/api/social/schedule', data),
      getPosts: (params?: any) => fastifyClient.get('/api/social/posts', { params }),
      publish: (id: string) => fastifyClient.post(`/api/social/posts/${id}/publish`),
    },
  },
  
  crm: {
    tickets: {
      getAll: (params?: any) => fastifyClient.get('/api/crm/tickets', { params }),
      getById: (id: string) => fastifyClient.get(`/api/crm/tickets/${id}`),
      create: (data: any) => fastifyClient.post('/api/crm/tickets', data),
      update: (id: string, data: any) => fastifyClient.put(`/api/crm/tickets/${id}`, data),
      close: (id: string) => fastifyClient.post(`/api/crm/tickets/${id}/close`),
    },
    followUps: {
      create: (data: any) => fastifyClient.post('/api/crm/follow-ups', data),
      getAll: (params?: any) => fastifyClient.get('/api/crm/follow-ups', { params }),
    },
  },
  
  // ==========================================================================
  // PYTHON AI SERVICE - Port 8001
  // AI/ML: Chat, Recommendations, Forecasting, Analytics, Insights
  // ==========================================================================
  
  ai: {
    chat: (message: string, context?: any) => pythonClient.post('/api/ai/chat', { message, context }),
    recommendations: (customerId: string, limit?: number) => 
      pythonClient.post('/api/ai/recommendations', { customerId, limit }),
    forecast: {
      demand: (productId: string, days: number) => 
        pythonClient.post('/api/ai/demand-forecast', { productId, days }),
      sales: (params?: any) => pythonClient.post('/api/ai/sales-forecast', params),
    },
    pricing: {
      optimize: (productId: string) => pythonClient.post('/api/ai/pricing', { productId }),
      suggest: (productId: string, competitorPrices: number[]) => 
        pythonClient.post('/api/ai/pricing/suggest', { productId, competitorPrices }),
    },
    content: {
      generate: (prompt: string, type?: string) => pythonClient.post('/api/ai/content', { prompt, type }),
      rewrite: (text: string, tone?: string) => pythonClient.post('/api/ai/content/rewrite', { text, tone }),
    },
    segmentation: {
      customers: (criteria?: any) => pythonClient.post('/api/ai/segmentation', criteria),
    },
  },
  
  analytics: {
    dashboard: () => pythonClient.get('/api/analytics/dashboard'),
    kpi: (metric: string, params?: any) => pythonClient.get(`/api/analytics/kpi/${metric}`, { params }),
    trends: (params?: any) => pythonClient.get('/api/analytics/trends', { params }),
  },
  
  insights: {
    daily: () => pythonClient.get('/api/insights/daily'),
    weekly: () => pythonClient.get('/api/insights/weekly'),
    suggestions: () => pythonClient.get('/api/insights/suggestions'),
    alerts: () => pythonClient.get('/api/insights/alerts'),
  },
  
  // ==========================================================================
  // GRAPHQL GATEWAY - Port 4000
  // Unified data access across all services
  // ==========================================================================
  
  graphql: {
    query: async (query: string, variables?: any) => {
      const response = await axios.post(GRAPHQL_URL, { query, variables })
      return response.data
    },
    
    // Predefined queries
    getDashboard: () => api.graphql.query(`
      query GetDashboard {
        dashboard {
          sales { total today week month }
          inventory { lowStock expiring total }
          customers { total new active }
          alerts { count items { type message } }
        }
      }
    `),
    
    getProductWithDetails: (id: string) => api.graphql.query(`
      query GetProduct($id: ID!) {
        product(id: $id) {
          id name sku price
          category { id name }
          brand { id name }
          inventory { stock warehouse location }
          sales { total lastMonth }
        }
      }
    `, { id }),
    
    getCustomerProfile: (id: string) => api.graphql.query(`
      query GetCustomer($id: ID!) {
        customer(id: $id) {
          id name email phone
          group { id name }
          loyalty { points tier }
          orders { id total date status }
          interactions { type date notes }
        }
      }
    `, { id }),
  },
}

export default api
