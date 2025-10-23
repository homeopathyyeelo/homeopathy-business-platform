// Marketing & Campaigns API Service
import { api, PaginatedResponse } from '../api-client';

export interface Campaign {
  id: string;
  name: string;
  type: 'whatsapp' | 'sms' | 'email' | 'multi-channel';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  targetAudience: string;
  customerSegment?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  createdBy: string;
  createdAt: string;
}

export interface CampaignMessage {
  id: string;
  campaignId: string;
  channel: 'whatsapp' | 'sms' | 'email';
  subject?: string;
  message: string;
  templateId?: string;
  mediaUrl?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
}

export interface Offer {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface Template {
  id: string;
  name: string;
  type: 'whatsapp' | 'sms' | 'email';
  category: 'promotional' | 'transactional' | 'reminder';
  subject?: string;
  content: string;
  variables: string[];
  isApproved: boolean;
  createdAt: string;
}

export const marketingService = {
  // Campaigns
  getCampaigns: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Campaign>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Campaign>>(`/marketing/campaigns?${queryParams}`);
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    return api.get<Campaign>(`/marketing/campaigns/${id}`);
  },

  createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
    return api.post<Campaign>('/marketing/campaigns', data);
  },

  updateCampaign: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
    return api.put<Campaign>(`/marketing/campaigns/${id}`, data);
  },

  launchCampaign: async (id: string): Promise<Campaign> => {
    return api.post<Campaign>(`/marketing/campaigns/${id}/launch`);
  },

  pauseCampaign: async (id: string): Promise<Campaign> => {
    return api.post<Campaign>(`/marketing/campaigns/${id}/pause`);
  },

  getCampaignAnalytics: async (id: string): Promise<any> => {
    return api.get(`/marketing/campaigns/${id}/analytics`);
  },

  // Campaign Messages
  getCampaignMessages: async (campaignId: string): Promise<CampaignMessage[]> => {
    return api.get<CampaignMessage[]>(`/marketing/campaigns/${campaignId}/messages`);
  },

  createCampaignMessage: async (campaignId: string, data: Partial<CampaignMessage>): Promise<CampaignMessage> => {
    return api.post<CampaignMessage>(`/marketing/campaigns/${campaignId}/messages`, data);
  },

  // WhatsApp Campaigns
  sendWhatsAppBulk: async (data: {
    recipients: string[];
    templateId: string;
    variables?: Record<string, string>;
  }): Promise<any> => {
    return api.post('/marketing/whatsapp/bulk', data);
  },

  // SMS Campaigns
  sendSMSBulk: async (data: {
    recipients: string[];
    message: string;
  }): Promise<any> => {
    return api.post('/marketing/sms/bulk', data);
  },

  // Email Campaigns
  sendEmailBulk: async (data: {
    recipients: string[];
    subject: string;
    body: string;
    attachments?: string[];
  }): Promise<any> => {
    return api.post('/marketing/email/bulk', data);
  },

  // Offers
  getOffers: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Offer>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Offer>>(`/marketing/offers?${queryParams}`);
  },

  createOffer: async (data: Partial<Offer>): Promise<Offer> => {
    return api.post<Offer>('/marketing/offers', data);
  },

  updateOffer: async (id: string, data: Partial<Offer>): Promise<Offer> => {
    return api.put<Offer>(`/marketing/offers/${id}`, data);
  },

  // Coupons
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Coupon>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Coupon>>(`/marketing/coupons?${queryParams}`);
  },

  createCoupon: async (data: Partial<Coupon>): Promise<Coupon> => {
    return api.post<Coupon>('/marketing/coupons', data);
  },

  validateCoupon: async (code: string, amount: number): Promise<any> => {
    return api.post('/marketing/coupons/validate', { code, amount });
  },

  // Templates
  getTemplates: async (params?: {
    type?: string;
    category?: string;
  }): Promise<Template[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Template[]>(`/marketing/templates?${queryParams}`);
  },

  createTemplate: async (data: Partial<Template>): Promise<Template> => {
    return api.post<Template>('/marketing/templates', data);
  },

  // AI Campaign Generator
  generateCampaignContent: async (data: {
    type: 'whatsapp' | 'sms' | 'email';
    objective: string;
    targetAudience: string;
    tone?: string;
  }): Promise<any> => {
    return api.post('/marketing/ai/generate-content', data);
  },

  generateCampaignIdeas: async (data: {
    businessType: string;
    season?: string;
    objective?: string;
  }): Promise<any> => {
    return api.post('/marketing/ai/generate-ideas', data);
  },

  // Gift Cards & Loyalty
  getGiftCards: async (): Promise<any[]> => {
    return api.get('/marketing/gift-cards');
  },

  createGiftCard: async (data: any): Promise<any> => {
    return api.post('/marketing/gift-cards', data);
  },

  getLoyaltyProgram: async (): Promise<any> => {
    return api.get('/marketing/loyalty-program');
  },

  updateLoyaltyProgram: async (data: any): Promise<any> => {
    return api.put('/marketing/loyalty-program', data);
  },
};
