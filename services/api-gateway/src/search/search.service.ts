import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SearchService {
  private readonly serviceUrls = {
    products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8001',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8002',
    sales: process.env.SALES_SERVICE_URL || 'http://localhost:8003',
    customers: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:8005',
  };

  async search(query: string, type?: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: {
          results: [],
          total: 0,
        },
      };
    }

    const searchPromises = [];

    // Search products
    if (!type || type === 'products') {
      searchPromises.push(
        this.searchProducts(query, limit).catch(() => ({ type: 'products', results: [] }))
      );
    }

    // Search customers
    if (!type || type === 'customers') {
      searchPromises.push(
        this.searchCustomers(query, limit).catch(() => ({ type: 'customers', results: [] }))
      );
    }

    // Search invoices
    if (!type || type === 'invoices') {
      searchPromises.push(
        this.searchInvoices(query, limit).catch(() => ({ type: 'invoices', results: [] }))
      );
    }

    const results = await Promise.all(searchPromises);

    const aggregated = results.reduce((acc, curr) => {
      acc[curr.type] = curr.results;
      return acc;
    }, {});

    const total = results.reduce((sum, curr) => sum + (curr.results?.length || 0), 0);

    return {
      success: true,
      data: {
        query,
        results: aggregated,
        total,
      },
    };
  }

  private async searchProducts(query: string, limit: number) {
    try {
      const response = await axios.get(`${this.serviceUrls.products}/api/v1/products`, {
        params: { search: query, limit },
        timeout: 5000,
      });

      return {
        type: 'products',
        results: response.data.data?.products || [],
      };
    } catch (error) {
      return { type: 'products', results: [] };
    }
  }

  private async searchCustomers(query: string, limit: number) {
    try {
      const response = await axios.get(`${this.serviceUrls.customers}/api/v1/customers`, {
        params: { search: query, limit },
        timeout: 5000,
      });

      return {
        type: 'customers',
        results: response.data.data || [],
      };
    } catch (error) {
      return { type: 'customers', results: [] };
    }
  }

  private async searchInvoices(query: string, limit: number) {
    try {
      const response = await axios.get(`${this.serviceUrls.sales}/api/v1/sales/invoices`, {
        params: { search: query, limit },
        timeout: 5000,
      });

      return {
        type: 'invoices',
        results: response.data.data?.invoices || [],
      };
    } catch (error) {
      return { type: 'invoices', results: [] };
    }
  }
}
