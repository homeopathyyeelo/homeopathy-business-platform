'use client';

import { useState, useEffect } from 'react';
import { golangAPI } from '@/lib/api';
import { ChevronDown, ChevronRight, Package, TrendingUp, AlertTriangle, Filter } from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  potency: string;
  form: string;
  packSize: string;
  barcode: string;
  hsnCode: string;
  currentStock: number;
  sellingPrice: number;
  mrp: number;
  taxPercent: number;
  isActive: boolean;
}

interface ProductGroup {
  baseProductName: string;
  baseSku: string;
  category: string;
  brand: string;
  totalVariants: number;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  isActive: boolean;
  variants: ProductVariant[];
}

export default function GroupedProductsPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loadingVariants, setLoadingVariants] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  useEffect(() => {
    loadGroups();
  }, [page, search, categoryFilter, brandFilter]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(brandFilter && { brand: brandFilter }),
      });

      const res = await golangAPI.get(`/api/erp/products/grouped?${params}`);
      setGroups(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load grouped products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (baseName: string, brand: string) => {
    setLoadingVariants(prev => new Set(prev).add(baseName));
    try {
      const params = new URLSearchParams({ brand });
      const res = await golangAPI.get(`/api/erp/products/grouped/${encodeURIComponent(baseName)}/variants?${params}`);
      
      // Update the group with loaded variants
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.baseProductName === baseName && group.brand === brand
            ? { ...group, variants: res.data.data || [] }
            : group
        )
      );
    } catch (error) {
      console.error('Failed to load variants:', error);
    } finally {
      setLoadingVariants(prev => {
        const newSet = new Set(prev);
        newSet.delete(baseName);
        return newSet;
      });
    }
  };

  const toggleGroup = (baseName: string, brand: string) => {
    const groupKey = `${baseName}-${brand}`;
    const newExpanded = new Set(expandedGroups);
    
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
      // Load variants if not already loaded
      const group = groups.find(g => g.baseProductName === baseName && g.brand === brand);
      if (group && group.variants.length === 0) {
        loadVariants(baseName, brand);
      }
    }
    
    setExpandedGroups(newExpanded);
  };

  const isExpanded = (baseName: string, brand: string) => {
    return expandedGroups.has(`${baseName}-${brand}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products (Grouped by Variants)</h1>
          <p className="text-sm text-gray-600 mt-1">
            View products grouped by medicine name with expandable variants
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900">
                {groups.reduce((sum, g) => sum + g.totalVariants, 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {groups.reduce((sum, g) => sum + g.totalStock, 0).toFixed(0)}
              </p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Variants/Product</p>
              <p className="text-2xl font-bold text-gray-900">
                {groups.length > 0 
                  ? (groups.reduce((sum, g) => sum + g.totalVariants, 0) / groups.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by brand..."
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grouped Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => {
                  const groupKey = `${group.baseProductName}-${group.brand}`;
                  const expanded = isExpanded(group.baseProductName, group.brand);
                  const variantsLoading = loadingVariants.has(group.baseProductName);

                  return (
                    <>
                      {/* Group Row */}
                      <tr 
                        key={groupKey}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleGroup(group.baseProductName, group.brand)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{group.baseProductName}</div>
                          <div className="text-xs text-gray-500">{group.baseSku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.category || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.brand || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.totalVariants} variants
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`font-semibold ${
                            group.totalStock < 10 ? 'text-red-600' : 
                            group.totalStock < 50 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {group.totalStock.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          ₹{group.minPrice.toFixed(0)} - ₹{group.maxPrice.toFixed(0)}
                        </td>
                      </tr>

                      {/* Variants Rows (Expanded) */}
                      {expanded && (
                        <>
                          {variantsLoading ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center bg-gray-50">
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                  Loading variants...
                                </div>
                              </td>
                            </tr>
                          ) : group.variants.length > 0 ? (
                            <>
                              {/* Variant Header */}
                              <tr className="bg-blue-50">
                                <td></td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900">Variant Name</td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900">Potency</td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900">Form</td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900 text-center">Pack Size</td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900 text-center">Stock</td>
                                <td className="px-6 py-2 text-xs font-semibold text-blue-900 text-right">MRP</td>
                              </tr>
                              {/* Variant Data */}
                              {group.variants.map((variant) => (
                                <tr key={variant.id} className="bg-blue-50/50 hover:bg-blue-100/50">
                                  <td></td>
                                  <td className="px-6 py-3 text-sm">
                                    <div className="text-gray-900">{variant.name}</div>
                                    <div className="text-xs text-gray-500">
                                      SKU: {variant.sku} | Barcode: {variant.barcode || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-3 text-sm">
                                    <span className="font-mono bg-purple-50 px-2 py-0.5 rounded text-purple-700">
                                      {variant.potency || '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-700">{variant.form || '-'}</td>
                                  <td className="px-6 py-3 text-sm text-center text-gray-700">{variant.packSize || '-'}</td>
                                  <td className="px-6 py-3 text-center">
                                    <span className={`font-semibold ${
                                      variant.currentStock < 10 ? 'text-red-600' : 
                                      variant.currentStock < 50 ? 'text-yellow-600' : 
                                      'text-green-600'
                                    }`}>
                                      {variant.currentStock}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <div className="font-semibold">₹{variant.mrp.toFixed(2)}</div>
                                    <div className="text-xs text-gray-500">GST: {variant.taxPercent || 5}%</div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          ) : (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-gray-500 bg-gray-50">
                                No variants found
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 50 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 50 >= total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 50, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {page}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * 50 >= total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
