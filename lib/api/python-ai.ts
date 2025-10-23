import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_PYTHON_AI_URL || '/api'

const pythonAI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
pythonAI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// AI Chat API
export const aiChatAPI = {
  sendMessage: (message: string, context?: any) => 
    pythonAI.post('/api/ai/chat', { message, context }),
  getHistory: () => pythonAI.get('/api/ai/chat/history'),
}

// AI Content Generation
export const aiContentAPI = {
  generate: (prompt: string, type: string) => 
    pythonAI.post('/api/ai/generate', { prompt, type }),
  generateCampaign: (data: any) => 
    pythonAI.post('/api/ai/campaigns/generate', data),
}

// AI Insights
export const aiInsightsAPI = {
  getDemandForecast: () => pythonAI.get('/api/ai/forecast'),
  getCustomerSegments: () => pythonAI.get('/api/ai/segment'),
  getInsights: () => pythonAI.get('/api/ai/insights'),
}

export default pythonAI
