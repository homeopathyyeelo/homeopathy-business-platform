/**
 * CENTRALIZED API CLIENT
 * All API calls go through this client automatically with authentication
 * No need to handle auth in every page!
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Get cookie helper
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
  timeout: 30000,
  withCredentials: true,
};

// Create centralized API client
class CentralAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // REQUEST INTERCEPTOR - Add auth token automatically
    this.client.interceptors.request.use(
      (config) => {
        // Get token from cookie (primary) or localStorage (fallback)
        const token = getCookie('auth-token') || 
                     (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // RESPONSE INTERCEPTOR - Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear auth and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            
            // Don't redirect if already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  // Generic POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  // Generic PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  // Generic PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // Generic DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Get the raw axios instance if needed
  getRawClient(): AxiosInstance {
    return this.client;
  }
}

// Export single instance - used across the entire app
export const api = new CentralAPIClient();

// Export as default for convenience
export default api;

// Helper for SWR fetcher
export const swrFetcher = (url: string) => api.get(url);
