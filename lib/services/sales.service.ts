// Sales API Service
import { api, PaginatedResponse } from '../api-client';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: 'retail' | 'wholesale' | 'b2b';
  customerId: string;
  customerName: string;
  customerPhone?: string;
  branchId: string;
  branchName: string;
  items: SalesInvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  roundOff: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'draft' | 'confirmed' | 'cancelled';
  salesmanId?: string;
  salesmanName?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  mrp: number;
  rate: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  items: SalesInvoiceItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  deliveryDate?: string;
  createdAt: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: SalesInvoiceItem[];
  total: number;
  refundAmount: number;
  refundMode: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PaymentCollection {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMode: string;
  reference?: string;
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
  }>;
  createdBy: string;
  createdAt: string;
}

export const salesService = {
  // Sales Invoices
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentStatus?: string;
  }): Promise<PaginatedResponse<SalesInvoice>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<SalesInvoice>>(`/sales/invoices?${queryParams}`);
  },

  getInvoice: async (id: string): Promise<SalesInvoice> => {
    return api.get<SalesInvoice>(`/sales/invoices/${id}`);
  },

  createInvoice: async (data: Partial<SalesInvoice>): Promise<SalesInvoice> => {
    return api.post<SalesInvoice>('/sales/invoices', data);
  },

  updateInvoice: async (id: string, data: Partial<SalesInvoice>): Promise<SalesInvoice> => {
    return api.put<SalesInvoice>(`/sales/invoices/${id}`, data);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    return api.delete(`/sales/invoices/${id}`);
  },

  confirmInvoice: async (id: string): Promise<SalesInvoice> => {
    return api.post<SalesInvoice>(`/sales/invoices/${id}/confirm`);
  },

  cancelInvoice: async (id: string, reason: string): Promise<SalesInvoice> => {
    return api.post<SalesInvoice>(`/sales/invoices/${id}/cancel`, { reason });
  },

  printInvoice: async (id: string): Promise<void> => {
    return api.download(`/sales/invoices/${id}/print`, `invoice-${id}.pdf`);
  },

  // Sales Orders
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<SalesOrder>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<SalesOrder>>(`/sales/orders?${queryParams}`);
  },

  getOrder: async (id: string): Promise<SalesOrder> => {
    return api.get<SalesOrder>(`/sales/orders/${id}`);
  },

  createOrder: async (data: Partial<SalesOrder>): Promise<SalesOrder> => {
    return api.post<SalesOrder>('/sales/orders', data);
  },

  convertOrderToInvoice: async (orderId: string): Promise<SalesInvoice> => {
    return api.post<SalesInvoice>(`/sales/orders/${orderId}/convert`);
  },

  // Sales Returns
  getReturns: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<SalesReturn>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<SalesReturn>>(`/sales/returns?${queryParams}`);
  },

  getReturn: async (id: string): Promise<SalesReturn> => {
    return api.get<SalesReturn>(`/sales/returns/${id}`);
  },

  createReturn: async (data: Partial<SalesReturn>): Promise<SalesReturn> => {
    return api.post<SalesReturn>('/sales/returns', data);
  },

  approveReturn: async (id: string): Promise<SalesReturn> => {
    return api.post<SalesReturn>(`/sales/returns/${id}/approve`);
  },

  // Payment Collection
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
  }): Promise<PaginatedResponse<PaymentCollection>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<PaymentCollection>>(`/sales/payments?${queryParams}`);
  },

  createPayment: async (data: Partial<PaymentCollection>): Promise<PaymentCollection> => {
    return api.post<PaymentCollection>('/sales/payments', data);
  },

  // Outstanding
  getOutstanding: async (customerId?: string): Promise<any> => {
    const params = customerId ? `?customer_id=${customerId}` : '';
    return api.get(`/sales/outstanding${params}`);
  },

  // Reports
  getSalesReport: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
    branchId?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/sales/reports?${queryParams}`);
  },

  // Hold Bills
  getHoldBills: async (): Promise<SalesInvoice[]> => {
    return api.get<SalesInvoice[]>('/sales/hold-bills');
  },

  holdBill: async (data: Partial<SalesInvoice>): Promise<SalesInvoice> => {
    return api.post<SalesInvoice>('/sales/hold-bills', data);
  },

  resumeHoldBill: async (id: string): Promise<SalesInvoice> => {
    return api.get<SalesInvoice>(`/sales/hold-bills/${id}`);
  },
};
