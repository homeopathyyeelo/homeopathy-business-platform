import { kafkaProducer } from '@/lib/kafka/producer';

const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || '/api';

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash' | 'cod';
  gateway: 'razorpay' | 'stripe' | 'paypal' | 'manual';
  gateway_transaction_id?: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  gateway_signature?: string;
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  description?: string;
  metadata?: any;
  error_code?: string;
  error_message?: string;
  paid_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  currency?: string;
  payment_method: string;
  gateway: string;
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  description?: string;
}

export interface RefundRequest {
  amount?: number;
  reason: string;
}

class PaymentServiceAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = PAYMENT_SERVICE_URL;
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

  // Payments
  async getPayments(page: number = 1, pageSize: number = 10, status?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return this.request(`/api/v1/payments/?${params.toString()}`);
  }

  async getPayment(id: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/payments/${id}/`);
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return this.request<Payment[]>(`/api/v1/payments/order/${orderId}/`);
  }

  async createPayment(payment: CreatePaymentRequest): Promise<Payment> {
    const response = await this.request<Payment>('/api/v1/payments/', {
      method: 'POST',
      body: JSON.stringify(payment),
    });

    // Publish payment initiated event
    await kafkaProducer.publishPaymentEvent('payment.initiated', {
      payment_id: response.id,
      order_id: response.order_id,
      amount: response.amount,
      payment_method: response.payment_method,
      gateway: response.gateway,
    });

    return response;
  }

  async refundPayment(id: string, refund: RefundRequest): Promise<Payment> {
    const response = await this.request<Payment>(`/api/v1/payments/${id}/refund/`, {
      method: 'POST',
      body: JSON.stringify(refund),
    });

    // Publish refund processed event
    await kafkaProducer.publishPaymentEvent('refund.processed', {
      payment_id: id,
      refund_amount: refund.amount,
      reason: refund.reason,
    });

    return response;
  }

  async verifyPayment(id: string, verificationData: any): Promise<Payment> {
    return this.request<Payment>(`/api/v1/payments/${id}/verify/`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  // Razorpay Integration
  async createRazorpayOrder(amount: number, orderId: string): Promise<any> {
    return this.request('/api/v1/payments/razorpay/create-order/', {
      method: 'POST',
      body: JSON.stringify({ amount, order_id: orderId }),
    });
  }

  async verifyRazorpayPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<any> {
    return this.request('/api/v1/payments/razorpay/verify/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stripe Integration
  async createStripePaymentIntent(amount: number, orderId: string): Promise<any> {
    return this.request('/api/v1/payments/stripe/create-intent/', {
      method: 'POST',
      body: JSON.stringify({ amount, order_id: orderId }),
    });
  }

  async confirmStripePayment(paymentIntentId: string): Promise<any> {
    return this.request('/api/v1/payments/stripe/confirm/', {
      method: 'POST',
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/health/');
  }
}

export const paymentServiceAPI = new PaymentServiceAPI();
export default paymentServiceAPI;
