// Social Media Automation API Service
import { api, PaginatedResponse } from '../api-client';

export interface SocialPost {
  id: string;
  title: string;
  content: string;
  platforms: ('gmb' | 'instagram' | 'facebook' | 'youtube' | 'blog')[];
  mediaUrls: string[];
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  accountIds: string[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdBy: string;
  createdAt: string;
}

export interface SocialAccount {
  id: string;
  platform: 'gmb' | 'instagram' | 'facebook' | 'youtube' | 'blog';
  accountName: string;
  accountId: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  profileUrl?: string;
  followers?: number;
  createdAt: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  platforms: string[];
  hashtags: string[];
  bestTimeToPost?: string;
  aiGenerated: boolean;
}

export const socialService = {
  // Social Posts
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
  }): Promise<PaginatedResponse<SocialPost>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<SocialPost>>(`/social/posts?${queryParams}`);
  },

  getPost: async (id: string): Promise<SocialPost> => {
    return api.get<SocialPost>(`/social/posts/${id}`);
  },

  createPost: async (data: Partial<SocialPost>): Promise<SocialPost> => {
    return api.post<SocialPost>('/social/posts', data);
  },

  updatePost: async (id: string, data: Partial<SocialPost>): Promise<SocialPost> => {
    return api.put<SocialPost>(`/social/posts/${id}`, data);
  },

  deletePost: async (id: string): Promise<void> => {
    return api.delete(`/social/posts/${id}`);
  },

  schedulePost: async (id: string, scheduledAt: string): Promise<SocialPost> => {
    return api.post<SocialPost>(`/social/posts/${id}/schedule`, { scheduledAt });
  },

  publishPost: async (id: string): Promise<SocialPost> => {
    return api.post<SocialPost>(`/social/posts/${id}/publish`);
  },

  // Social Accounts
  getAccounts: async (platform?: string): Promise<SocialAccount[]> => {
    const params = platform ? `?platform=${platform}` : '';
    return api.get<SocialAccount[]>(`/social/accounts${params}`);
  },

  connectAccount: async (platform: string, credentials: any): Promise<SocialAccount> => {
    return api.post<SocialAccount>('/social/accounts/connect', { platform, ...credentials });
  },

  disconnectAccount: async (id: string): Promise<void> => {
    return api.post(`/social/accounts/${id}/disconnect`);
  },

  refreshAccountToken: async (id: string): Promise<SocialAccount> => {
    return api.post<SocialAccount>(`/social/accounts/${id}/refresh`);
  },

  // AI Content Generation
  generateContent: async (data: {
    topic: string;
    platform: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
  }): Promise<any> => {
    return api.post('/social/ai/generate-content', data);
  },

  generateHashtags: async (content: string, platform: string): Promise<string[]> => {
    return api.post('/social/ai/generate-hashtags', { content, platform });
  },

  generateImage: async (prompt: string): Promise<string> => {
    return api.post('/social/ai/generate-image', { prompt });
  },

  getContentIdeas: async (category?: string): Promise<ContentIdea[]> => {
    const params = category ? `?category=${category}` : '';
    return api.get<ContentIdea[]>(`/social/ai/content-ideas${params}`);
  },

  // Analytics
  getPostAnalytics: async (postId: string): Promise<any> => {
    return api.get(`/social/posts/${postId}/analytics`);
  },

  getAccountAnalytics: async (accountId: string, period: string): Promise<any> => {
    return api.get(`/social/accounts/${accountId}/analytics?period=${period}`);
  },

  // Media Upload
  uploadMedia: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload('/social/media/upload', formData);
    return response.url;
  },

  // Scheduler
  getScheduledPosts: async (startDate: string, endDate: string): Promise<SocialPost[]> => {
    return api.get(`/social/scheduler?start_date=${startDate}&end_date=${endDate}`);
  },

  getBestTimeToPost: async (platform: string): Promise<any> => {
    return api.get(`/social/analytics/best-time?platform=${platform}`);
  },
};
