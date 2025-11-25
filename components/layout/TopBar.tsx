'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Menu, Search, Bell, User, Building2, ChevronDown, Plus, RefreshCw, MessageSquare, Settings, LogOut, Loader2, Package, Users } from 'lucide-react';
import { useAuth } from "@/lib/hooks/useAuth";
import { golangAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  module: string;
  navigate_url: string;
  brand?: string;
  category?: string;
  sku?: string;
  stock?: number;
  description?: string;
}

export default function TopBar({ onToggleLeft, onToggleRight }: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 3) { // Increased to 3 chars to be safer
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500); // Increased to 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      console.log('🔍 TopBar Search:', query);
      const response = await golangAPI.get(`/api/erp/search?q=${encodeURIComponent(query)}&type=all&limit=10`);
      
      if (response.data && response.data.success && response.data.hits) {
        setSearchResults(response.data.hits);
        setShowResults(true);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    router.push(result.navigate_url);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      } else {
        // Fallback to general search results page
        setShowResults(false);
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="h-16 bg-gradient-to-r from-orange-100 via-peach-100 to-orange-50 border-b border-orange-200 flex items-center px-6 gap-4 shadow-md z-50">
      <button onClick={onToggleLeft} className="p-2 hover:bg-orange-200/50 rounded-lg">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <div className="hidden md:block">
          <h1 className="font-bold text-lg text-gray-800">HomeoERP</h1>
          <p className="text-xs text-gray-600">v2.1.0</p>
        </div>
      </Link>

      <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/80 border border-orange-200 rounded-lg hover:bg-white">
        <Building2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Main Branch</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <div className="flex-1 max-w-2xl mx-auto" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search products, customers, invoices..."
            className="w-full pl-12 pr-10 py-2.5 bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-orange-100 max-h-[80vh] overflow-hidden">
              <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="flex items-start gap-3 p-3 hover:bg-orange-50 cursor-pointer transition-colors border-b last:border-0 border-orange-50"
                  >
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                      {result.type === 'product' ? (
                        <Package className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Users className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate text-gray-800">{result.name}</p>
                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">
                          {result.module}
                        </Badge>
                      </div>
                      {result.brand && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {result.brand} {result.category && `• ${result.category}`}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {result.sku && (
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">SKU: {result.sku}</span>
                        )}
                        {result.type === 'product' && (result.stock !== undefined) && (
                           <span className={`text-[10px] px-1.5 py-0.5 rounded ${result.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                             {result.stock > 0 ? `${result.stock} in stock` : 'Out of stock'}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
             <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-orange-100">
              <div className="p-4 text-center text-sm text-gray-500">
                No results found for "{searchQuery}"
              </div>
            </Card>
          )}
        </form>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2.5 hover:bg-orange-200/50 rounded-lg"><RefreshCw className="h-5 w-5" /></button>
        <button className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md"><Plus className="h-5 w-5" /></button>
        <button className="p-2.5 hover:bg-orange-200/50 rounded-lg"><MessageSquare className="h-5 w-5" /></button>
        <button onClick={onToggleRight} className="relative p-2.5 hover:bg-orange-200/50 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">5</span>
        </button>

        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 hover:bg-orange-200/50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2 z-50">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
              </div>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50">
                <Settings className="h-4 w-4" />Settings
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600"
              >
                <LogOut className="h-4 w-4" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
