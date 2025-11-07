import { kafkaProducer } from '@/lib/kafka/producer';
import { authFetch } from '@/lib/api/fetch-utils';

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || '/api';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pincode?: string;
  notes?: string;
  internal_notes?: string;
  tracking_number?: string;
  courier_name?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_price: number;
  notes?: string;
}

export interface CreateOrderRequest {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
  }>;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  payment_method?: string;
  notes?: string;
}

class OrderServiceAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = ORDER_SERVICE_URL;
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
    const response = await authFetch(url, {
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

  // Orders
  async getOrders(page: number = 1, pageSize: number = 10, status?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return this.request(`/api/v1/orders/?${params.toString()}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/v1/orders/${id}/`);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.request<Order[]>(`/api/v1/orders/customer/${customerId}/`);
  }

  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const response = await this.request<Order>('/api/v1/orders/', {
      method: 'POST',
      body: JSON.stringify(order),
    });

    // Publish order created event
    await kafkaProducer.publishOrderEvent('order.created', {
      order_id: response.id,
      order_number: response.order_number,
      customer_id: response.customer_id,
      total_amount: response.total_amount,
      items_count: order.items.length,
    });

    return response;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const response = await this.request<Order>(`/api/v1/orders/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Publish order updated event
    await kafkaProducer.publishOrderEvent('order.updated', {
      order_id: id,
      updates,
    });

    return response;
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const response = await this.request<Order>(`/api/v1/orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    // Publish order cancelled event
    await kafkaProducer.publishOrderEvent('order.cancelled', {
      order_id: id,
      reason,
    });

    return response;
  }

  async confirmOrder(id: string): Promise<Order> {
    const response = await this.request<Order>(`/api/v1/orders/${id}/confirm/`, {
      method: 'POST',
    });

    // Publish order confirmed event
    await kafkaProducer.publishOrderEvent('order.confirmed', {
      order_id: id,
      order_number: response.order_number,
    });

    return response;
  }

  async getInvoice(id: string): Promise<Blob> {
    const url = `${this.baseURL}/api/v1/orders/${id}/invoice/`;
    const response = await authFetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.status}`);
    }

    return response.blob();
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/health/');
  }
}

export const orderServiceAPI = new OrderServiceAPI();
export default orderServiceAPI;
