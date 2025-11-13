'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import { useRouter } from 'next/navigation';
import { Package, Plus, TrendingUp, AlertTriangle, Filter } from 'lucide-react';
import { useProducts, useProductStats, useProductMutations } from '@/lib/hooks/products';
import { golangAPI } from '@/lib/api';

export default function ProductListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [potencyFilter, setPotencyFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Master data for filters - lazy loaded
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [potencies, setPotencies] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  
  // Loading states for each filter
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [potenciesLoading, setPotenciesLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(false);
  
  // Search states for each filter
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [potencySearch, setPotencySearch] = useState('');
  const [formSearch, setFormSearch] = useState('');
  
  // Lazy load functions - called when dropdown opens
  const loadCategories = useCallback(() => {
    if (categories.length > 0 || categoriesLoading) return;
    setCategoriesLoading(true);
    golangAPI.get('/api/erp/categories')
      .then(res => setCategories(res.data?.data?.categories || []))
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, [categories.length, categoriesLoading]);
  
  const loadBrands = useCallback(() => {
    if (brands.length > 0 || brandsLoading) return;
    setBrandsLoading(true);
    golangAPI.get('/api/erp/brands')
      .then(res => setBrands(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setBrandsLoading(false));
  }, [brands.length, brandsLoading]);
  
  const loadPotencies = useCallback(() => {
    if (potencies.length > 0 || potenciesLoading) return;
    setPotenciesLoading(true);
    golangAPI.get('/api/erp/potencies')
      .then(res => setPotencies(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setPotenciesLoading(false));
  }, [potencies.length, potenciesLoading]);
  
  const loadForms = useCallback(() => {
    if (forms.length > 0 || formsLoading) return;
    setFormsLoading(true);
    golangAPI.get('/api/erp/forms')
      .then(res => setForms(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setFormsLoading(false));
  }, [forms.length, formsLoading]);
  
  // Background prefetch all filter options silently on mount
  useEffect(() => {
    const prefetchFilters = async () => {
      try {
        // Load all filters in parallel without showing loaders
        await Promise.all([
          golangAPI.get('/api/erp/categories').then((res) =>
            setCategories(res.data?.data?.categories || [])
          ),
          golangAPI.get('/api/erp/brands').then((res) =>
            setBrands(Array.isArray(res.data?.data) ? res.data.data : [])
          ),
          golangAPI.get('/api/erp/potencies').then((res) =>
            setPotencies(Array.isArray(res.data?.data) ? res.data.data : [])
          ),
          golangAPI.get('/api/erp/forms').then((res) =>
            setForms(Array.isArray(res.data?.data) ? res.data.data : [])
          ),
        ]);
      } catch (error) {
        // Silently fail — filters will load on demand if needed
        console.debug('Background filter prefetch failed:', error);
      }
    };

    // Prefetch after 1 second to avoid blocking initial page render
    //const timer = setTimeout(prefetchFilters, 1000);
    //return () => clearTimeout(timer);
  }, []);
  
  // ⚡ PURE LAZY LOADING: Filters load ONLY when user clicks/focuses input
  // No background prefetch - lighter page load, data fetched on-demand

  const { data, isLoading } = useProducts({ 
    page, 
    perPage, 
    search,
    category: categoryFilter,
    brand: brandFilter,
    potency: potencyFilter,
    form: formFilter,
  });
  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const { data: statsData } = useProductStats(); // Use API-based stats
  const stats = statsData ?? { total: 0, active: 0, lowStock: 0, totalValue: 0, categories: 0, brands: 0 };
  const { remove } = useProductMutations();

  const handleAdd = useCallback(() => router.push('/products/add'), [router]);
  const handleEdit = useCallback((row: any) => router.push(`/products/edit/${row.id}`), [router]);
  const handleView = useCallback((row: any) => router.push(`/products/${row.id}`), [router]);

  const handleDelete = useCallback((row: any) => {
    if (confirm(`Delete product: ${row.name}?`)) {
      remove.mutateAsync(String(row.id)).catch(() => {/* noop */});
    }
  }, [remove]);

  const serverPagination = useMemo(() => ({
    page,
    perPage,
    total,
    onPageChange: (newPage: number) => setPage(newPage),
    onPerPageChange: (newPerPage: number) => {
      setPerPage(newPerPage);
      setPage(1);
    },
  }), [page, perPage, total]);

  const columns = [
    { 
      key: 'sku', 
      title: 'SKU', 
      sortable: true,
      render: (val: any) => <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded font-semibold">{val}</span>
    },
    { 
      key: 'name', 
      title: 'Product Name', 
      sortable: true,
      render: (val: any) => <span className="font-medium">{val}</span>
    },
    { 
      key: 'category', 
      title: 'Category', 
      sortable: true,
      render: (val: any) => <span className="text-sm text-gray-700">{val || '-'}</span>
    },
    { 
      key: 'brand', 
      title: 'Brand', 
      sortable: true,
      render: (val: any) => <span className="text-sm text-gray-700">{val || '-'}</span>
    },
    { 
      key: 'potency', 
      title: 'Potency', 
      sortable: true,
      render: (val: any) => <span className="text-sm font-mono bg-purple-50 px-2 py-0.5 rounded">{val || '-'}</span>
    },
    { 
      key: 'form', 
      title: 'Form', 
      sortable: true,
      render: (val: any) => <span className="text-sm text-gray-700">{val || '-'}</span>
    },
    { 
      key: 'packSize', 
      title: 'Pack Size', 
      sortable: true,
      render: (val: any) => <span className="text-sm text-gray-600">{val || '-'}</span>
    },
    { 
      key: 'hsnCode', 
      title: 'HSN Code', 
      sortable: true,
      render: (val: any) => <span className="text-xs font-mono text-gray-500">{val || '-'}</span>
    },
    { 
      key: 'currentStock', 
      title: 'Stock', 
      sortable: true,
      render: (val: any) => (
        <span className={`font-semibold ${
          (val ?? 0) < 10 ? 'text-red-600' : (val ?? 0) < 50 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {(val ?? 0)}
        </span>
      )
    },
    { 
      key: 'sellingPrice', 
      title: 'Price', 
      sortable: true,
      render: (val: any) => <span className="font-semibold">₹{(val ?? 0).toLocaleString()}</span>
    },
    { 
      key: 'isActive', 
      title: 'Status', 
      sortable: true,
      render: (val: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  const handleClearFilters = () => {
    setCategoryFilter('');
    setBrandFilter('');
    setPotencyFilter('');
    setFormFilter('');
    setPage(1);
  };

  const activeFiltersCount = [categoryFilter, brandFilter, potencyFilter, formFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Value</p>
              <div className="text-2xl font-bold text-purple-600">{stats.totalValue.toLocaleString()}</div>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category {categories.length > 0 && <span className="text-xs text-gray-500">({categories.length})</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={categoriesLoading ? "Loading..." : `🔍 Search ${categories.length || ''} categories...`}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  onFocus={loadCategories}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {categoriesLoading && (
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {categorySearch && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                  <div 
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                    onClick={() => { setCategoryFilter(''); setCategorySearch(''); setPage(1); }}
                  >
                    <span className="text-gray-600">✕ Clear filter</span>
                  </div>
                  {categories
                    .filter((cat: any) => 
                      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((cat: any) => (
                      <div
                        key={cat.id}
                        className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                          categoryFilter === cat.name ? 'bg-blue-100 font-semibold' : ''
                        }`}
                        onClick={() => {
                          setCategoryFilter(cat.name);
                          setCategorySearch('');
                          setPage(1);
                        }}
                      >
                        {cat.name}
                      </div>
                    ))}
                  {categories.filter((cat: any) => 
                    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
              {categoryFilter && !categorySearch && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categoryFilter}
                    <button
                      onClick={() => { setCategoryFilter(''); setPage(1); }}
                      className="ml-1 hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand {brands.length > 0 && <span className="text-xs text-gray-500">({brands.length})</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={brandsLoading ? "Loading..." : `🔍 Search ${brands.length || ''} brands...`}
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  onFocus={loadBrands}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {brandsLoading && (
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {brandSearch && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                  <div 
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                    onClick={() => { setBrandFilter(''); setBrandSearch(''); setPage(1); }}
                  >
                    <span className="text-gray-600">✕ Clear filter</span>
                  </div>
                  {brands
                    .filter((brand: any) => 
                      brand.name.toLowerCase().includes(brandSearch.toLowerCase())
                    )
                    .map((brand: any) => (
                      <div
                        key={brand.id}
                        className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                          brandFilter === brand.name ? 'bg-blue-100 font-semibold' : ''
                        }`}
                        onClick={() => {
                          setBrandFilter(brand.name);
                          setBrandSearch('');
                          setPage(1);
                        }}
                      >
                        {brand.name}
                      </div>
                    ))}
                  {brands.filter((brand: any) => 
                    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
              {brandFilter && !brandSearch && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {brandFilter}
                    <button
                      onClick={() => { setBrandFilter(''); setPage(1); }}
                      className="ml-1 hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Potency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potency {potencies.length > 0 && <span className="text-xs text-gray-500">({potencies.length})</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={potenciesLoading ? "Loading..." : `🔍 Search ${potencies.length || ''} potencies...`}
                  value={potencySearch}
                  onChange={(e) => setPotencySearch(e.target.value)}
                  onFocus={loadPotencies}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {potenciesLoading && (
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {potencySearch && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                  <div 
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                    onClick={() => { setPotencyFilter(''); setPotencySearch(''); setPage(1); }}
                  >
                    <span className="text-gray-600">✕ Clear filter</span>
                  </div>
                  {potencies
                    .filter((pot: any) => 
                      pot.code.toLowerCase().includes(potencySearch.toLowerCase()) ||
                      pot.name.toLowerCase().includes(potencySearch.toLowerCase())
                    )
                    .map((pot: any) => (
                      <div
                        key={pot.id}
                        className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                          potencyFilter === pot.code ? 'bg-blue-100 font-semibold' : ''
                        }`}
                        onClick={() => {
                          setPotencyFilter(pot.code);
                          setPotencySearch('');
                          setPage(1);
                        }}
                      >
                        {pot.code} - {pot.name}
                      </div>
                    ))}
                  {potencies.filter((pot: any) => 
                    pot.code.toLowerCase().includes(potencySearch.toLowerCase()) ||
                    pot.name.toLowerCase().includes(potencySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
              {potencyFilter && !potencySearch && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {potencyFilter}
                    <button
                      onClick={() => { setPotencyFilter(''); setPage(1); }}
                      className="ml-1 hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Form Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form {forms.length > 0 && <span className="text-xs text-gray-500">({forms.length})</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={formsLoading ? "Loading..." : `🔍 Search ${forms.length || ''} forms...`}
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  onFocus={loadForms}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {formsLoading && (
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {formSearch && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-lg">
                  <div 
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                    onClick={() => { setFormFilter(''); setFormSearch(''); setPage(1); }}
                  >
                    <span className="text-gray-600">✕ Clear filter</span>
                  </div>
                  {forms
                    .filter((form: any) => 
                      form.name.toLowerCase().includes(formSearch.toLowerCase())
                    )
                    .map((form: any) => (
                      <div
                        key={form.id}
                        className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm ${
                          formFilter === form.name ? 'bg-blue-100 font-semibold' : ''
                        }`}
                        onClick={() => {
                          setFormFilter(form.name);
                          setFormSearch('');
                          setPage(1);
                        }}
                      >
                        {form.name}
                      </div>
                    ))}
                  {forms.filter((form: any) => 
                    form.name.toLowerCase().includes(formSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
              {formFilter && !formSearch && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formFilter}
                    <button
                      onClick={() => { setFormFilter(''); setPage(1); }}
                      className="ml-1 hover:text-blue-600"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <DataTable
        title="Product Master List"
        columns={columns}
        data={products}
        loading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        serverPagination={serverPagination}
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  );
}
