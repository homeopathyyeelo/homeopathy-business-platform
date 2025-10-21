// Purchases API Service
import { api, PaginatedResponse } from '../api-client';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  vendorId: string;
  vendorName: string;
  branchId: string;
  branchName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  receivedQuantity?: number;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  grnDate: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  branchId: string;
  items: GoodsReceiptItem[];
  status: 'pending' | 'completed';
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity?: number;
  mrp: number;
  rate: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  billDate: string;
  vendorId: string;
  vendorName: string;
  grnId?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  dueDate?: string;
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  paymentMode: string;
  reference?: string;
  bills: Array<{
    billId: string;
    billNumber: string;
    amount: number;
  }>;
  createdBy: string;
  createdAt: string;
}

export const purchasesService = {
  // Purchase Orders
  getPurchaseOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    vendorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<PurchaseOrder>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<PurchaseOrder>>(`/purchases/orders?${queryParams}`);
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    return api.get<PurchaseOrder>(`/purchases/orders/${id}`);
  },

  createPurchaseOrder: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    return api.post<PurchaseOrder>('/purchases/orders', data);
  },

  updatePurchaseOrder: async (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    return api.put<PurchaseOrder>(`/purchases/orders/${id}`, data);
  },

  approvePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    return api.post<PurchaseOrder>(`/purchases/orders/${id}/approve`);
  },

  cancelPurchaseOrder: async (id: string, reason: string): Promise<PurchaseOrder> => {
    return api.post<PurchaseOrder>(`/purchases/orders/${id}/cancel`, { reason });
  },

  printPurchaseOrder: async (id: string): Promise<void> => {
    return api.download(`/purchases/orders/${id}/print`, `po-${id}.pdf`);
  },

  // Goods Receipts (GRN)
  getGoodsReceipts: async (params?: {
    page?: number;
    limit?: number;
    poId?: string;
    status?: string;
  }): Promise<PaginatedResponse<GoodsReceipt>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<GoodsReceipt>>(`/purchases/grn?${queryParams}`);
  },

  getGoodsReceipt: async (id: string): Promise<GoodsReceipt> => {
    return api.get<GoodsReceipt>(`/purchases/grn/${id}`);
  },

  createGoodsReceipt: async (data: Partial<GoodsReceipt>): Promise<GoodsReceipt> => {
    return api.post<GoodsReceipt>('/purchases/grn', data);
  },

  completeGoodsReceipt: async (id: string): Promise<GoodsReceipt> => {
    return api.post<GoodsReceipt>(`/purchases/grn/${id}/complete`);
  },

  // Purchase Bills
  getPurchaseBills: async (params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
    paymentStatus?: string;
  }): Promise<PaginatedResponse<PurchaseBill>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<PurchaseBill>>(`/purchases/bills?${queryParams}`);
  },

  getPurchaseBill: async (id: string): Promise<PurchaseBill> => {
    return api.get<PurchaseBill>(`/purchases/bills/${id}`);
  },

  createPurchaseBill: async (data: Partial<PurchaseBill>): Promise<PurchaseBill> => {
    return api.post<PurchaseBill>('/purchases/bills', data);
  },

  // Vendor Payments
  getVendorPayments: async (params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
  }): Promise<PaginatedResponse<VendorPayment>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<VendorPayment>>(`/purchases/payments?${queryParams}`);
  },

  createVendorPayment: async (data: Partial<VendorPayment>): Promise<VendorPayment> => {
    return api.post<VendorPayment>('/purchases/payments', data);
  },

  // Vendor Price Comparison
  getVendorPriceComparison: async (productId: string): Promise<any[]> => {
    return api.get(`/purchases/price-comparison/${productId}`);
  },

  // AI Auto Reorder
  getAIReorderSuggestions: async (branchId?: string): Promise<any[]> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get(`/purchases/ai-reorder${params}`);
  },

  generateAIPurchaseOrder: async (suggestions: any[]): Promise<PurchaseOrder> => {
    return api.post<PurchaseOrder>('/purchases/ai-generate-po', { suggestions });
  },

  // Reports
  getPurchaseReport: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
    vendorId?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/purchases/reports?${queryParams}`);
  },
};
