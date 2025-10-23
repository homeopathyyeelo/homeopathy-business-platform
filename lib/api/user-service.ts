import { kafkaProducer } from '@/lib/kafka/producer';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || '/api';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role_id: string;
  department_id?: string;
  branch_id?: string;
  employee_code?: string;
  designation?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  password: string;
  role_id: string;
  department_id?: string;
  branch_id?: string;
  employee_code?: string;
  designation?: string;
}

class UserServiceAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = USER_SERVICE_URL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<{ data: LoginResponse }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Publish login event to Kafka
    await kafkaProducer.publishUserEvent('user.logged_in', {
      username: credentials.username,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });

    // Publish logout event
    await kafkaProducer.publishUserEvent('user.logged_out', {
      timestamp: new Date().toISOString(),
    });
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await this.request<{ data: LoginResponse }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return response.data;
  }

  // User Management
  async getUsers(page: number = 1, pageSize: number = 10, search?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return this.request(`/api/v1/users?${params.toString()}`);
  }

  async getUser(id: string): Promise<User> {
    const response = await this.request<{ data: User }>(`/api/v1/users/${id}`);
    return response.data;
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    const response = await this.request<{ data: User }>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });

    // Publish user created event
    await kafkaProducer.publishUserEvent('user.created', {
      user_id: response.data.id,
      username: response.data.username,
      email: response.data.email,
    });

    return response.data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.request<{ data: User }>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Publish user updated event
    await kafkaProducer.publishUserEvent('user.updated', {
      user_id: id,
      updates,
    });

    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });

    // Publish user deleted event
    await kafkaProducer.publishUserEvent('user.deleted', {
      user_id: id,
    });
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ data: User }>('/api/v1/users/profile');
    return response.data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.request<{ data: User }>('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/api/v1/users/password', {
      method: 'PUT',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }
}

export const userServiceAPI = new UserServiceAPI();
export default userServiceAPI;
