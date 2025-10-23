// Customers/CRM API Service
import { api, PaginatedResponse } from '../api-client';

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  type: 'retail' | 'wholesale' | 'b2b' | 'doctor' | 'distributor';
  groupId?: string;
  groupName?: string;
  gstNumber?: string;
  panNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  creditLimit: number;
  creditDays: number;
  outstanding: number;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroup {
  id: string;
  name: string;
  code: string;
  discountPercentage: number;
  creditLimit: number;
  creditDays: number;
  isActive: boolean;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'earned' | 'redeemed';
  reference: string;
  description: string;
  createdAt: string;
}

export interface CustomerLedger {
  id: string;
  customerId: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
}

export interface Communication {
  id: string;
  customerId: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
}

export const customersService = {
  // Customers CRUD
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    groupId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Customer>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Customer>>(`/customers?${queryParams}`);
  },

  getCustomer: async (id: string): Promise<Customer> => {
    return api.get<Customer>(`/customers/${id}`);
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    return api.post<Customer>('/customers', data);
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return api.put<Customer>(`/customers/${id}`, data);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    return api.delete(`/customers/${id}`);
  },

  // Customer Groups
  getCustomerGroups: async (): Promise<CustomerGroup[]> => {
    return api.get<CustomerGroup[]>('/customers/groups');
  },

  createCustomerGroup: async (data: Partial<CustomerGroup>): Promise<CustomerGroup> => {
    return api.post<CustomerGroup>('/customers/groups', data);
  },

  // Loyalty Points
  getLoyaltyTransactions: async (customerId: string): Promise<LoyaltyTransaction[]> => {
    return api.get<LoyaltyTransaction[]>(`/customers/${customerId}/loyalty`);
  },

  addLoyaltyPoints: async (customerId: string, points: number, reference: string): Promise<LoyaltyTransaction> => {
    return api.post<LoyaltyTransaction>(`/customers/${customerId}/loyalty/add`, { points, reference });
  },

  redeemLoyaltyPoints: async (customerId: string, points: number, reference: string): Promise<LoyaltyTransaction> => {
    return api.post<LoyaltyTransaction>(`/customers/${customerId}/loyalty/redeem`, { points, reference });
  },

  // Outstanding & Ledger
  getCustomerLedger: async (customerId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CustomerLedger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<CustomerLedger[]>(`/customers/${customerId}/ledger?${queryParams}`);
  },

  getOutstanding: async (customerId?: string): Promise<any> => {
    const params = customerId ? `?customer_id=${customerId}` : '';
    return api.get(`/customers/outstanding${params}`);
  },

  // Communication
  sendWhatsApp: async (customerId: string, message: string, templateId?: string): Promise<Communication> => {
    return api.post<Communication>(`/customers/${customerId}/whatsapp`, { message, templateId });
  },

  sendEmail: async (customerId: string, subject: string, message: string): Promise<Communication> => {
    return api.post<Communication>(`/customers/${customerId}/email`, { subject, message });
  },

  sendSMS: async (customerId: string, message: string): Promise<Communication> => {
    return api.post<Communication>(`/customers/${customerId}/sms`, { message });
  },

  getCommunicationLogs: async (customerId: string): Promise<Communication[]> => {
    return api.get<Communication[]>(`/customers/${customerId}/communications`);
  },

  // Bulk Operations
  bulkImport: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/customers/bulk-import', formData);
  },

  bulkExport: async (): Promise<void> => {
    return api.download('/customers/export', 'customers.csv');
  },
};
