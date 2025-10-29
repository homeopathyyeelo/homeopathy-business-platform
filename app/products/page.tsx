'use client';

import { useCallback, useMemo, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import { useRouter } from 'next/navigation';
import { Package, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { useProducts, useProductStats, useProductMutations } from '@/lib/hooks/products';

export default function ProductListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useProducts({ page, perPage, search });
  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const stats = useProductStats(products);
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
      key: 'id', 
      title: 'ID', 
      sortable: true,
      render: (val: any) => <span className="font-mono text-sm">#{val}</span>
    },
    { 
      key: 'name', 
      title: 'Product Name', 
      sortable: true,
      render: (val: any, row: any) => (
        <div>
          <div className="font-medium">{val}</div>
          <div className="text-xs text-gray-500">{row.category}</div>
        </div>
      )
    },
    { 
      key: 'sku', 
      title: 'SKU', 
      sortable: true,
      render: (val: any) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{val}</span>
    },
    { 
      key: 'stock_qty', 
      title: 'Stock', 
      sortable: true,
      render: (val: any, row: any) => (
        <span className={`font-semibold ${
          (val ?? row.stock ?? 0) < 10 ? 'text-red-600' : (val ?? row.stock ?? 0) < 50 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {(val ?? row.stock ?? 0)} units
        </span>
      )
    },
    { 
      key: 'unit_price', 
      title: 'Price', 
      sortable: true,
      render: (val: any, row: any) => <span className="font-semibold">{(val ?? row.sellingPrice)?.toLocaleString()}</span>
    },
    { 
      key: 'is_active', 
      title: 'Status', 
      sortable: true,
      render: (val: any, row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          (val ?? row.isActive) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {(val ?? row.isActive) ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

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

      {/* Products Table */}
      <DataTable
        title="Product Management"
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
