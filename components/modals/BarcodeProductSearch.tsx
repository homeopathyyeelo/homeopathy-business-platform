'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { jsonFetcher } from '@/lib/utils/fetcher';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  mrp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export default function BarcodeProductSearch({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Clear query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  // Only fetch when modal is open and query is >= 2 chars
  const shouldFetch = open && debouncedQuery.length >= 2;
  
  const { data, isLoading, error } = useSWR<{ success: boolean; data: Product[] }>(
    shouldFetch ? `http://localhost:3005/api/erp/products?search=${encodeURIComponent(debouncedQuery)}&limit=20` : null,
    jsonFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 second cache
    }
  );

  const products = data?.data || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Product for Barcode</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
          <Input
            placeholder="Type product name or SKU (min 2 characters)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full"
          />

          <div className="flex-1 overflow-y-auto border rounded-md">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            )}

            {error && (
              <div className="py-8 text-center text-sm text-red-600">
                Error: {error.message}
              </div>
            )}

            {!isLoading && !error && query.length >= 2 && products.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                No products found for "{query}"
              </div>
            )}

            {!isLoading && !error && query.length < 2 && (
              <div className="py-8 text-center text-sm text-gray-400">
                Type at least 2 characters to search
              </div>
            )}

            {products.length > 0 && (
              <div className="divide-y">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelect(product);
                      onClose();
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span>SKU: {product.sku}</span>
                      <span>•</span>
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>{product.category}</span>
                      <span>•</span>
                      <span className="font-medium">₹{product.mrp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
