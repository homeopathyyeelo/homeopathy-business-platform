/**
 * Unified API Client for Homeopathy ERP Platform
 * Connects to Go backend API at localhost:3005
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          error: errorData.error || 'Request failed',
          message: errorData.message,
          statusCode: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      throw {
        error: 'Network error',
        message: error.message || 'Failed to connect to server',
        statusCode: 0,
      } as ApiError;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Specific API methods
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  
  logout: () =>
    apiClient.post('/api/auth/logout'),
  
  refreshToken: () =>
    apiClient.post('/api/auth/refresh'),
};

export const productAPI = {
  getAll: (params?: any) => apiClient.get('/api/erp/products', params),
  getById: (id: string) => apiClient.get(`/api/erp/products/${id}`),
  create: (data: any) => apiClient.post('/api/erp/products', data),
  update: (id: string, data: any) => apiClient.put(`/api/erp/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/erp/products/${id}`),
};

export const inventoryAPI = {
  getStock: () => apiClient.get('/api/erp/inventory/stock'),
  getTransactions: (params?: any) => apiClient.get('/api/erp/inventory/transactions', params),
  getLowStockAlerts: () => apiClient.get('/api/erp/inventory/alerts/low-stock'),
  getExpiryAlerts: () => apiClient.get('/api/erp/inventory/alerts/expiry'),
  adjustStock: (data: any) => apiClient.post('/api/erp/inventory/adjust', data),
};

export const salesAPI = {
  getOrders: (params?: any) => apiClient.get('/api/erp/sales/orders', params),
  getOrder: (id: string) => apiClient.get(`/api/erp/sales/orders/${id}`),
  createOrder: (data: any) => apiClient.post('/api/erp/sales/orders', data),
  updateOrder: (id: string, data: any) => apiClient.put(`/api/erp/sales/orders/${id}`, data),
};

export const purchaseAPI = {
  getOrders: (params?: any) => apiClient.get('/api/erp/purchases/orders', params),
  getOrder: (id: string) => apiClient.get(`/api/erp/purchases/orders/${id}`),
  createOrder: (data: any) => apiClient.post('/api/erp/purchases/orders', data),
  approveOrder: (id: string) => apiClient.put(`/api/erp/purchases/orders/${id}/approve`),
  rejectOrder: (id: string) => apiClient.put(`/api/erp/purchases/orders/${id}/reject`),
};

export const customerAPI = {
  getAll: (params?: any) => apiClient.get('/api/erp/customers', params),
  getById: (id: string) => apiClient.get(`/api/erp/customers/${id}`),
  create: (data: any) => apiClient.post('/api/erp/customers', data),
  update: (id: string, data: any) => apiClient.put(`/api/erp/customers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/erp/customers/${id}`),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/api/erp/dashboard/stats'),
  getActivity: () => apiClient.get('/api/erp/dashboard/activity'),
  getRecentSales: () => apiClient.get('/api/erp/dashboard/recent-sales'),
  getTopProducts: () => apiClient.get('/api/erp/dashboard/top-products'),
  getAlerts: () => apiClient.get('/api/erp/dashboard/alerts'),
  getRevenueChart: (params?: any) => apiClient.get('/api/erp/dashboard/revenue-chart', params),
};
