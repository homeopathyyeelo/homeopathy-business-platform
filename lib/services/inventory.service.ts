// Inventory API Service
import { api, PaginatedResponse } from '../api-client';

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  batchId: string;
  batchNumber: string;
  branchId: string;
  branchName: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  mrp: number;
  purchasePrice: number;
  expiryDate: string;
  rackLocation?: string;
  lastUpdated: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  batchId: string;
  branchId: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  items: StockTransferItem[];
  createdBy: string;
  createdAt: string;
  receivedAt?: string;
}

export interface StockTransferItem {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  receivedQuantity?: number;
}

export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  branchId: string;
  quantity: number;
  expiryDate: string;
  daysToExpiry: number;
  mrp: number;
  value: number;
}

export interface StockValuation {
  totalValue: number;
  totalQuantity: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    value: number;
    quantity: number;
  }>;
  byBranch: Array<{
    branchId: string;
    branchName: string;
    value: number;
    quantity: number;
  }>;
}

export const inventoryService = {
  // Current Stock
  getStock: async (params?: {
    branchId?: string;
    productId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockItem>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<StockItem>>(`/inventory/stock?${queryParams}`);
  },

  getStockByProduct: async (productId: string, branchId?: string): Promise<StockItem[]> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get<StockItem[]>(`/inventory/stock/product/${productId}${params}`);
  },

  // Stock Adjustments
  getAdjustments: async (params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockAdjustment>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<StockAdjustment>>(`/inventory/adjustments?${queryParams}`);
  },

  createAdjustment: async (data: Partial<StockAdjustment>): Promise<StockAdjustment> => {
    return api.post<StockAdjustment>('/inventory/adjustments', data);
  },

  // Stock Transfers
  getTransfers: async (params?: {
    status?: string;
    fromBranchId?: string;
    toBranchId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockTransfer>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<StockTransfer>>(`/inventory/transfers?${queryParams}`);
  },

  getTransfer: async (id: string): Promise<StockTransfer> => {
    return api.get<StockTransfer>(`/inventory/transfers/${id}`);
  },

  createTransfer: async (data: Partial<StockTransfer>): Promise<StockTransfer> => {
    return api.post<StockTransfer>('/inventory/transfers', data);
  },

  receiveTransfer: async (id: string, items: Array<{ id: string; receivedQuantity: number }>): Promise<StockTransfer> => {
    return api.post<StockTransfer>(`/inventory/transfers/${id}/receive`, { items });
  },

  cancelTransfer: async (id: string, reason: string): Promise<StockTransfer> => {
    return api.post<StockTransfer>(`/inventory/transfers/${id}/cancel`, { reason });
  },

  // Expiry Alerts
  getExpiryAlerts: async (days: number = 90): Promise<ExpiryAlert[]> => {
    return api.get<ExpiryAlert[]>(`/inventory/expiry-alerts?days=${days}`);
  },

  // Low Stock
  getLowStock: async (branchId?: string): Promise<StockItem[]> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get<StockItem[]>(`/inventory/low-stock${params}`);
  },

  // Dead Stock
  getDeadStock: async (days: number = 180, branchId?: string): Promise<StockItem[]> => {
    const params = new URLSearchParams({ days: days.toString(), ...(branchId && { branch_id: branchId }) }).toString();
    return api.get<StockItem[]>(`/inventory/dead-stock?${params}`);
  },

  // Stock Valuation
  getValuation: async (branchId?: string): Promise<StockValuation> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get<StockValuation>(`/inventory/valuation${params}`);
  },

  // AI Reorder Suggestions
  getReorderSuggestions: async (branchId?: string): Promise<any[]> => {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return api.get<any[]>(`/inventory/ai-reorder${params}`);
  },

  // Stock Reconciliation
  reconcileStock: async (branchId: string, items: Array<{ productId: string; batchId: string; physicalCount: number }>): Promise<any> => {
    return api.post('/inventory/reconciliation', { branchId, items });
  },
};
