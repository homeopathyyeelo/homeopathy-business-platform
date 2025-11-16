import { useRouter } from 'next/navigation';

export interface SearchResult {
  id: string;
  type: 'product' | 'batch' | 'sale' | 'purchase' | 'customer' | 'vendor';
  title: string;
  subtitle?: string;
  url: string;
  metadata?: Record<string, any>;
}

export class GlobalSearch {
  private router: ReturnType<typeof useRouter>;

  constructor(router: ReturnType<typeof useRouter>) {
    this.router = router;
  }

  // Search products by SKU, name, barcode
  searchProducts(query: string) {
    if (!query.trim()) return;
    
    const searchUrl = `/products?search=${encodeURIComponent(query.trim())}`;
    this.router.push(searchUrl);
  }

  // Search batches by batch number or product
  searchBatches(query: string) {
    if (!query.trim()) return;
    
    const searchUrl = `/batches?search=${encodeURIComponent(query.trim())}`;
    this.router.push(searchUrl);
  }

  // Search sales by invoice number or customer
  searchSales(query: string) {
    if (!query.trim()) return;
    
    const searchUrl = `/sales?search=${encodeURIComponent(query.trim())}`;
    this.router.push(searchUrl);
  }

  // Search purchases by invoice number or vendor
  searchPurchases(query: string) {
    if (!query.trim()) return;
    
    const searchUrl = `/purchases?search=${encodeURIComponent(query.trim())}`;
    this.router.push(searchUrl);
  }

  // Universal search - tries to determine the best module based on query pattern
  universalSearch(query: string) {
    if (!query.trim()) return;

    const trimmedQuery = query.trim().toLowerCase();
    
    // Determine search type based on query patterns
    if (trimmedQuery.includes('batch') || /^\d{4,6}$/.test(trimmedQuery)) {
      this.searchBatches(query);
    } else if (trimmedQuery.includes('invoice') || trimmedQuery.includes('sale') || /^INV-/.test(trimmedQuery.toUpperCase())) {
      this.searchSales(query);
    } else if (trimmedQuery.includes('purchase') || /^PO-/.test(trimmedQuery.toUpperCase())) {
      this.searchPurchases(query);
    } else {
      // Default to product search
      this.searchProducts(query);
    }
  }

  // Get search suggestions based on query
  async getSearchSuggestions(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      // This would call a backend API for search suggestions
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }
}

export const useGlobalSearch = (router: ReturnType<typeof useRouter>) => {
  return new GlobalSearch(router);
};
