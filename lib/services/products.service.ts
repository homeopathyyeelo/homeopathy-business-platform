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
  }): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Product>>(`/products?${queryParams}`);
  },

  getProduct: async (id: string): Promise<Product> => {
    return api.get<Product>(`/products/${id}`);
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    return api.post<Product>('/products', data);
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    return api.put<Product>(`/products/${id}`, data);
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
    return api.get<Category[]>('/master/categories');
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    return api.post<Category>('/master/categories', data);
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    return api.put<Category>(`/master/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<void> => {
    return api.delete(`/master/categories/${id}`);
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    return api.get<Brand[]>('/master/brands');
  },

  createBrand: async (data: Partial<Brand>): Promise<Brand> => {
    return api.post<Brand>('/master/brands', data);
  },

  updateBrand: async (id: string, data: Partial<Brand>): Promise<Brand> => {
    return api.put<Brand>(`/master/brands/${id}`, data);
  },

  deleteBrand: async (id: string): Promise<void> => {
    return api.delete(`/master/brands/${id}`);
  },

  // Potencies
  getPotencies: async (): Promise<Potency[]> => {
    return api.get<Potency[]>('/master/potencies');
  },

  createPotency: async (data: Partial<Potency>): Promise<Potency> => {
    return api.post<Potency>('/master/potencies', data);
  },

  // Forms
  getForms: async (): Promise<ProductForm[]> => {
    return api.get<ProductForm[]>('/master/forms');
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
