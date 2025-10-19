import { kafkaProducer } from '@/lib/kafka/producer';

const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:8002';

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  category_id: string;
  brand_id?: string;
  potency_id?: string;
  packing_size_id: string;
  hsn_code: string;
  barcode?: string;
  sku: string;
  base_price: number;
  selling_price: number;
  mrp: number;
  cost_price: number;
  tax_rate: number;
  reorder_level: number;
  min_stock_level: number;
  max_stock_level: number;
  is_prescription_required: boolean;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  images: string[];
  tags: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
  country?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id?: string;
  batch_number?: string;
  quantity: number;
  available_qty: number;
  reserved_qty: number;
  damaged_qty: number;
  manufacture_date?: string;
  expiry_date?: string;
  cost_price: number;
  selling_price: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class ProductServiceAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = PRODUCT_SERVICE_URL;
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

  // Products
  async getProducts(page: number = 1, pageSize: number = 10, search?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return this.request(`/api/v1/products?${params.toString()}`);
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.request<{ data: Product }>(`/api/v1/products/${id}`);
    return response.data;
  }

  async getProductByBarcode(barcode: string): Promise<Product> {
    const response = await this.request<{ data: Product }>(`/api/v1/products/barcode/${barcode}`);
    return response.data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await this.request<{ data: Product[] }>(`/api/v1/products/search?q=${query}`);
    return response.data;
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const response = await this.request<{ data: Product }>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });

    // Publish product created event
    await kafkaProducer.publishProductEvent('product.created', {
      product_id: response.data.id,
      name: response.data.name,
      sku: response.data.sku,
    });

    return response.data;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const response = await this.request<{ data: Product }>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Publish product updated event
    await kafkaProducer.publishProductEvent('product.updated', {
      product_id: id,
      updates,
    });

    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/api/v1/products/${id}`, {
      method: 'DELETE',
    });

    // Publish product deleted event
    await kafkaProducer.publishProductEvent('product.deleted', {
      product_id: id,
    });
  }

  // Categories
  async getCategories(page: number = 1, pageSize: number = 50): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    return this.request(`/api/v1/categories?${params.toString()}`);
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.request<{ data: Category }>(`/api/v1/categories/${id}`);
    return response.data;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const response = await this.request<{ data: Category }>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });

    return response.data;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const response = await this.request<{ data: Category }>(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/v1/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Brands
  async getBrands(page: number = 1, pageSize: number = 50): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    return this.request(`/api/v1/brands?${params.toString()}`);
  }

  async getBrand(id: string): Promise<Brand> {
    const response = await this.request<{ data: Brand }>(`/api/v1/brands/${id}`);
    return response.data;
  }

  async createBrand(brand: Partial<Brand>): Promise<Brand> {
    const response = await this.request<{ data: Brand }>('/api/v1/brands', {
      method: 'POST',
      body: JSON.stringify(brand),
    });

    return response.data;
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
    const response = await this.request<{ data: Brand }>(`/api/v1/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response.data;
  }

  async deleteBrand(id: string): Promise<void> {
    await this.request(`/api/v1/brands/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory
  async getInventory(page: number = 1, pageSize: number = 10): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    return this.request(`/api/v1/inventory?${params.toString()}`);
  }

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    const response = await this.request<{ data: Inventory[] }>(`/api/v1/inventory/product/${productId}`);
    return response.data;
  }

  async getLowStock(): Promise<Inventory[]> {
    const response = await this.request<{ data: Inventory[] }>('/api/v1/inventory/low-stock');
    return response.data;
  }

  async adjustStock(data: {
    product_id: string;
    quantity: number;
    type: 'in' | 'out' | 'adjustment';
    reason?: string;
  }): Promise<void> {
    await this.request('/api/v1/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Publish inventory adjusted event
    await kafkaProducer.publishInventoryEvent('inventory.adjusted', data);
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }
}

export const productServiceAPI = new ProductServiceAPI();
export default productServiceAPI;
