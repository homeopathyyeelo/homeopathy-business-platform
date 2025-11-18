'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, Package, Users, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'customer' | 'vendor' | 'document' | 'page';
  category?: string;
  brand?: string;
  sku?: string;
  description?: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, any>;
}

interface SearchResponse {
  success: boolean;
  hits: SearchResult[];
  total: number;
  query: string;
  processingTime?: number;
}

export default function CentralAISearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchType, setSearchType] = useState<'all' | 'products' | 'customers'>('all');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string, type: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/erp/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=20`
        );
        const data: SearchResponse = await response.json();

        if (data.success) {
          setResults(data.hits);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query) {
      performSearch(query, searchType);
    } else {
      setResults([]);
    }
  }, [query, searchType, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      router.push(result.url);
    } else if (result.type === 'product') {
      router.push(`/products/${result.id}`);
    } else if (result.type === 'customer') {
      router.push(`/customers/${result.id}`);
    } else if (result.type === 'vendor') {
      router.push(`/vendors/${result.id}`);
    }
    setIsOpen(false);
    setQuery('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'vendor':
        return <TrendingUp className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'bg-blue-500/10 text-blue-600';
      case 'customer':
        return 'bg-green-500/10 text-green-600';
      case 'vendor':
        return 'bg-purple-500/10 text-purple-600';
      case 'document':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all group w-64"
      >
        <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-gray-100 rounded">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 bg-white">
          <DialogHeader className="px-4 pt-4 pb-2 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <DialogTitle className="text-lg">AI-Powered Search</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products, customers, vendors, documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 h-12 text-base"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
              {query && !isLoading && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Results' },
                { value: 'products', label: 'Products' },
                { value: 'customers', label: 'Customers' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSearchType(tab.value as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    searchType === tab.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <ScrollArea className="h-[400px]">
              {results.length === 0 && query && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-2">Try different keywords or filters</p>
                </div>
              )}

              {results.length === 0 && !query && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">Start typing to search...</p>
                  <div className="mt-4 space-y-2 text-xs">
                    <p>Try searching for:</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Badge variant="outline">Sulphur 200</Badge>
                      <Badge variant="outline">Calc Carb</Badge>
                      <Badge variant="outline">Customer name</Badge>
                      <Badge variant="outline">Invoice #</Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      index === selectedIndex
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${getResultColor(result.type)}`}>
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {result.name}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        {result.sku && <span className="text-xs">SKU: {result.sku}</span>}
                        {result.brand && <span className="text-xs">• {result.brand}</span>}
                        {result.category && <span className="text-xs">• {result.category}</span>}
                      </div>
                      {result.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold text-blue-600">MeiliSearch</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
