// Vendors/Suppliers API Service
import { api, PaginatedResponse } from '../api-client';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler';
  contactPerson: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentTerms: string;
  creditDays: number;
  creditLimit: number;
  outstanding: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorLedger {
  id: string;
  vendorId: string;
  date: string;
  type: 'bill' | 'payment' | 'debit_note' | 'credit_note';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
}

export interface VendorContract {
  id: string;
  vendorId: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  terms: string;
  documentUrl?: string;
  status: 'active' | 'expired' | 'terminated';
  createdAt: string;
}

export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  totalAmount: number;
  onTimeDelivery: number;
  qualityRating: number;
  priceCompetitiveness: number;
  overallRating: number;
}

export const vendorsService = {
  // Vendors CRUD
  getVendors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Vendor>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Vendor>>(`/vendors?${queryParams}`);
  },

  getVendor: async (id: string): Promise<Vendor> => {
    return api.get<Vendor>(`/vendors/${id}`);
  },

  createVendor: async (data: Partial<Vendor>): Promise<Vendor> => {
    return api.post<Vendor>('/vendors', data);
  },

  updateVendor: async (id: string, data: Partial<Vendor>): Promise<Vendor> => {
    return api.put<Vendor>(`/vendors/${id}`, data);
  },

  deleteVendor: async (id: string): Promise<void> => {
    return api.delete(`/vendors/${id}`);
  },

  // Vendor Ledger
  getVendorLedger: async (vendorId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<VendorLedger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<VendorLedger[]>(`/vendors/${vendorId}/ledger?${queryParams}`);
  },

  getOutstanding: async (vendorId?: string): Promise<any> => {
    const params = vendorId ? `?vendor_id=${vendorId}` : '';
    return api.get(`/vendors/outstanding${params}`);
  },

  // Vendor Contracts
  getVendorContracts: async (vendorId: string): Promise<VendorContract[]> => {
    return api.get<VendorContract[]>(`/vendors/${vendorId}/contracts`);
  },

  createVendorContract: async (vendorId: string, data: Partial<VendorContract>): Promise<VendorContract> => {
    return api.post<VendorContract>(`/vendors/${vendorId}/contracts`, data);
  },

  uploadContractDocument: async (contractId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload(`/vendors/contracts/${contractId}/upload`, formData);
  },

  // Vendor Performance
  getVendorPerformance: async (vendorId?: string): Promise<VendorPerformance[]> => {
    const params = vendorId ? `?vendor_id=${vendorId}` : '';
    return api.get<VendorPerformance[]>(`/vendors/performance${params}`);
  },

  rateVendor: async (vendorId: string, rating: number, feedback?: string): Promise<any> => {
    return api.post(`/vendors/${vendorId}/rate`, { rating, feedback });
  },

  // Bulk Operations
  bulkImport: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/vendors/bulk-import', formData);
  },

  bulkExport: async (): Promise<void> => {
    return api.download('/vendors/export', 'vendors.csv');
  },
};
