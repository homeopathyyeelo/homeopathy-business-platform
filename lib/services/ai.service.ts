// AI & Analytics API Service
// ⚠️ DEPRECATED: This module may conflict with new AI product parser.
// New AI features should use lib/ai/product-parser.ts for product attribute extraction.
import { api } from '../api-client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Forecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorder: number;
  confidence: number;
  period: string;
}

export interface SalesInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  data?: any;
}

export interface PriceOptimization {
  productId: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedImpact: {
    salesIncrease: number;
    revenueIncrease: number;
    profitIncrease: number;
  };
  confidence: number;
  reasoning: string;
}

export const aiService = {
  // AI Chat
  getChatSessions: async (): Promise<ChatSession[]> => {
    return api.get<ChatSession[]>('/ai/chat/sessions');
  },

  getChatSession: async (id: string): Promise<ChatSession> => {
    return api.get<ChatSession>(`/ai/chat/sessions/${id}`);
  },

  createChatSession: async (title?: string): Promise<ChatSession> => {
    return api.post<ChatSession>('/ai/chat/sessions', { title });
  },

  sendMessage: async (sessionId: string, message: string, context?: any): Promise<ChatMessage> => {
    return api.post<ChatMessage>(`/ai/chat/sessions/${sessionId}/messages`, { message, context });
  },

  deleteChatSession: async (id: string): Promise<void> => {
    return api.delete(`/ai/chat/sessions/${id}`);
  },

  // Quick AI Queries
  askQuestion: async (question: string, context?: any): Promise<string> => {
    const response = await api.post('/ai/chat/quick', { question, context });
    return response.answer;
  },

  // Demand Forecasting
  getDemandForecast: async (params?: {
    productId?: string;
    categoryId?: string;
    branchId?: string;
    period?: 'week' | 'month' | 'quarter';
  }): Promise<Forecast[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Forecast[]>(`/ai/forecast/demand?${queryParams}`);
  },

  getForecastAccuracy: async (): Promise<any> => {
    return api.get('/ai/forecast/accuracy');
  },

  // Sales Insights
  getSalesInsights: async (params?: {
    period?: string;
    branchId?: string;
  }): Promise<SalesInsight[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<SalesInsight[]>(`/ai/insights/sales?${queryParams}`);
  },

  getCustomerInsights: async (customerId?: string): Promise<any> => {
    const params = customerId ? `?customer_id=${customerId}` : '';
    return api.get(`/ai/insights/customers${params}`);
  },

  getInventoryInsights: async (branchId?: string): Promise<any> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get(`/ai/insights/inventory${params}`);
  },

  // Purchase Order Generation
  generatePurchaseOrder: async (params?: {
    branchId?: string;
    vendorId?: string;
    autoApprove?: boolean;
  }): Promise<any> => {
    return api.post('/ai/purchase-order/generate', params);
  },

  getReorderSuggestions: async (branchId?: string): Promise<any[]> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get(`/ai/purchase-order/suggestions${params}`);
  },

  // Price Optimization
  getPriceOptimization: async (params?: {
    productId?: string;
    categoryId?: string;
  }): Promise<PriceOptimization[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PriceOptimization[]>(`/ai/pricing/optimize?${queryParams}`);
  },

  applyPriceRecommendation: async (productId: string, newPrice: number): Promise<any> => {
    return api.post('/ai/pricing/apply', { productId, newPrice });
  },

  // Content Generation
  generateProductDescription: async (productName: string, category: string): Promise<string> => {
    const response = await api.post('/ai/content/product-description', { productName, category });
    return response.description;
  },

  generateMarketingCopy: async (data: {
    type: 'email' | 'sms' | 'social';
    purpose: string;
    tone?: string;
  }): Promise<string> => {
    const response = await api.post('/ai/content/marketing', data);
    return response.content;
  },

  // Remedy Suggestions (Homeopathy-specific)
  getRemedySuggestions: async (symptoms: string[]): Promise<any[]> => {
    return api.post('/ai/remedy/suggest', { symptoms });
  },

  getRemedyDetails: async (remedyName: string): Promise<any> => {
    return api.get(`/ai/remedy/details?name=${remedyName}`);
  },

  // Workflow Automation
  getAutomationRules: async (): Promise<any[]> => {
    return api.get('/ai/automation/rules');
  },

  createAutomationRule: async (rule: any): Promise<any> => {
    return api.post('/ai/automation/rules', rule);
  },

  toggleAutomationRule: async (id: string, enabled: boolean): Promise<any> => {
    return api.put(`/ai/automation/rules/${id}`, { enabled });
  },

  // Daily Summary
  getDailySummary: async (date?: string): Promise<any> => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/ai/summary/daily${params}`);
  },

  getWeeklySummary: async (weekStart?: string): Promise<any> => {
    const params = weekStart ? `?week_start=${weekStart}` : '';
    return api.get(`/ai/summary/weekly${params}`);
  },

  // AI Model Settings
  getAIModels: async (): Promise<any[]> => {
    return api.get('/ai/models');
  },

  selectAIModel: async (modelId: string): Promise<any> => {
    return api.post('/ai/models/select', { modelId });
  },

  // Sandbox/Demo
  runAIDemo: async (demoType: string, params?: any): Promise<any> => {
    return api.post('/ai/sandbox/demo', { demoType, params });
  },
};
