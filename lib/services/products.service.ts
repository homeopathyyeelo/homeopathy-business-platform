// Products API Service
import { api, PaginatedResponse } from '../api-client';

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode?: string;
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId: string;
  brandName?: string;
  potencyId?: string;
  potencyName?: string;
  formId?: string;
  formName?: string;
  packSize?: string;
  unit: string;
  hsnCode?: string;
  gstRate: number;
  mrp: number;
  retailPrice: number;
  wholesalePrice: number;
  dealerPrice: number;
  purchasePrice: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  description?: string;
  images?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  manufacturer?: string;
  country?: string;
  isActive: boolean;
}

export interface Potency {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductForm {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  quantity: number;
  availableQuantity: number;
  branchId: string;
  isActive: boolean;
}

export const productsService = {
  // Products CRUD
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    isActive?: boolean;
  }): Promise<any> => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await api.get<any>(`/products?${queryParams}`);
    return response.data || response;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<any>(`/products/${id}`);
    return response.data || response;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<any>('/products', data);
    return response.data || response;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<any>(`/products/${id}`, data);
    return response.data || response;
  },

  deleteProduct: async (id: string): Promise<void> => {
    return api.delete(`/products/${id}`);
  },

  // Bulk operations
  bulkImport: async (file: File, onProgress?: (progress: number) => void): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/products/bulk-import', formData, onProgress);
  },

  bulkExport: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return api.download(`/products/export?format=${format}`, `products.${format}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<any>('/categories');
    return response.data || response;
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post<any>('/categories', data);
    return response.data || response;
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put<any>(`/categories/${id}`, data);
    return response.data || response;
  },

  deleteCategory: async (id: string): Promise<void> => {
    return api.delete(`/categories/${id}`);
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const response = await api.get<any>('/brands');
    return response.data || response;
  },

  createBrand: async (data: Partial<Brand>): Promise<Brand> => {
    const response = await api.post<any>('/brands', data);
    return response.data || response;
  },

  updateBrand: async (id: string, data: Partial<Brand>): Promise<Brand> => {
    const response = await api.put<any>(`/brands/${id}`, data);
    return response.data || response;
  },

  deleteBrand: async (id: string): Promise<void> => {
    return api.delete(`/brands/${id}`);
  },

  // Potencies
  getPotencies: async (): Promise<Potency[]> => {
    const response = await api.get<any>('/potencies');
    return response.data || response;
  },

  createPotency: async (data: Partial<Potency>): Promise<Potency> => {
    const response = await api.post<any>('/potencies', data);
    return response.data || response;
  },

  // Forms
  getForms: async (): Promise<ProductForm[]> => {
    const response = await api.get<any>('/forms');
    return response.data || response;
  },

  // Batches
  getBatches: async (productId: string): Promise<Batch[]> => {
    return api.get<Batch[]>(`/products/${productId}/batches`);
  },

  createBatch: async (productId: string, data: Partial<Batch>): Promise<Batch> => {
    return api.post<Batch>(`/products/${productId}/batches`, data);
  },

  // Barcode generation
  generateBarcode: async (productId: string): Promise<{ barcode: string; imageUrl: string }> => {
    return api.post(`/products/${productId}/barcode`);
  },

  printBarcode: async (productIds: string[]): Promise<void> => {
    return api.download('/products/barcode/print', 'barcodes.pdf');
  },
};
