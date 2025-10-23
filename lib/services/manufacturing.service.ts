// Manufacturing & Warehouse API Service
import { api, PaginatedResponse } from '../api-client';

export interface ManufacturingOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  completedDate?: string;
  bomId: string;
  batchNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  version: string;
  isActive: boolean;
  items: BOMItem[];
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface BOMItem {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unit: string;
  cost: number;
  wastagePercentage?: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  manufacturingOrderId: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  quantityRejected?: number;
  mfgDate: string;
  expiryDate: string;
  status: 'in_progress' | 'completed' | 'quality_check' | 'approved';
  qualityCheckBy?: string;
  qualityCheckDate?: string;
  notes?: string;
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplierId?: string;
  supplierName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  fromWarehouse: string;
  toWarehouse: string;
  items: TransferItem[];
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  transferDate: string;
  receivedDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
}

export const manufacturingService = {
  // Manufacturing Orders
  getManufacturingOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
  }): Promise<PaginatedResponse<ManufacturingOrder>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<ManufacturingOrder>>(`/manufacturing/orders?${queryParams}`);
  },

  getManufacturingOrder: async (id: string): Promise<ManufacturingOrder> => {
    return api.get<ManufacturingOrder>(`/manufacturing/orders/${id}`);
  },

  createManufacturingOrder: async (data: Partial<ManufacturingOrder>): Promise<ManufacturingOrder> => {
    return api.post<ManufacturingOrder>('/manufacturing/orders', data);
  },

  updateManufacturingOrder: async (id: string, data: Partial<ManufacturingOrder>): Promise<ManufacturingOrder> => {
    return api.put<ManufacturingOrder>(`/manufacturing/orders/${id}`, data);
  },

  approveManufacturingOrder: async (id: string): Promise<ManufacturingOrder> => {
    return api.post<ManufacturingOrder>(`/manufacturing/orders/${id}/approve`);
  },

  startProduction: async (id: string): Promise<ManufacturingOrder> => {
    return api.post<ManufacturingOrder>(`/manufacturing/orders/${id}/start`);
  },

  completeProduction: async (id: string, data: any): Promise<ManufacturingOrder> => {
    return api.post<ManufacturingOrder>(`/manufacturing/orders/${id}/complete`, data);
  },

  // Bill of Materials (BOM)
  getBOMs: async (productId?: string): Promise<BOM[]> => {
    const params = productId ? `?product_id=${productId}` : '';
    return api.get<BOM[]>(`/manufacturing/bom${params}`);
  },

  getBOM: async (id: string): Promise<BOM> => {
    return api.get<BOM>(`/manufacturing/bom/${id}`);
  },

  createBOM: async (data: Partial<BOM>): Promise<BOM> => {
    return api.post<BOM>('/manufacturing/bom', data);
  },

  updateBOM: async (id: string, data: Partial<BOM>): Promise<BOM> => {
    return api.put<BOM>(`/manufacturing/bom/${id}`, data);
  },

  activateBOM: async (id: string): Promise<BOM> => {
    return api.post<BOM>(`/manufacturing/bom/${id}/activate`);
  },

  // Production Batches
  getProductionBatches: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
  }): Promise<PaginatedResponse<ProductionBatch>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<ProductionBatch>>(`/manufacturing/batches?${queryParams}`);
  },

  getProductionBatch: async (id: string): Promise<ProductionBatch> => {
    return api.get<ProductionBatch>(`/manufacturing/batches/${id}`);
  },

  createProductionBatch: async (data: Partial<ProductionBatch>): Promise<ProductionBatch> => {
    return api.post<ProductionBatch>('/manufacturing/batches', data);
  },

  qualityCheck: async (id: string, approved: boolean, notes?: string): Promise<ProductionBatch> => {
    return api.post<ProductionBatch>(`/manufacturing/batches/${id}/quality-check`, { approved, notes });
  },

  // Raw Materials
  getRawMaterials: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<RawMaterial>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<RawMaterial>>(`/manufacturing/raw-materials?${queryParams}`);
  },

  getRawMaterial: async (id: string): Promise<RawMaterial> => {
    return api.get<RawMaterial>(`/manufacturing/raw-materials/${id}`);
  },

  createRawMaterial: async (data: Partial<RawMaterial>): Promise<RawMaterial> => {
    return api.post<RawMaterial>('/manufacturing/raw-materials', data);
  },

  updateRawMaterial: async (id: string, data: Partial<RawMaterial>): Promise<RawMaterial> => {
    return api.put<RawMaterial>(`/manufacturing/raw-materials/${id}`, data);
  },

  getRawMaterialStock: async (warehouseId?: string): Promise<any[]> => {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return api.get(`/manufacturing/raw-materials/stock${params}`);
  },

  // Warehouse Transfers
  getWarehouseTransfers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<WarehouseTransfer>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<WarehouseTransfer>>(`/manufacturing/warehouse/transfers?${queryParams}`);
  },

  createWarehouseTransfer: async (data: Partial<WarehouseTransfer>): Promise<WarehouseTransfer> => {
    return api.post<WarehouseTransfer>('/manufacturing/warehouse/transfers', data);
  },

  receiveWarehouseTransfer: async (id: string, receivedItems: any[]): Promise<WarehouseTransfer> => {
    return api.post<WarehouseTransfer>(`/manufacturing/warehouse/transfers/${id}/receive`, { receivedItems });
  },

  // Reports
  getProductionReport: async (startDate: string, endDate: string): Promise<any> => {
    return api.get(`/manufacturing/reports/production?start_date=${startDate}&end_date=${endDate}`);
  },

  getMaterialConsumption: async (startDate: string, endDate: string): Promise<any> => {
    return api.get(`/manufacturing/reports/material-consumption?start_date=${startDate}&end_date=${endDate}`);
  },
};
