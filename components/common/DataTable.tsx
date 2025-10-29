'use client';

import { useMemo, useState } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ServerPaginationConfig {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title: string;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  searchable?: boolean;
  exportable?: boolean;
  loading?: boolean;
  serverPagination?: ServerPaginationConfig;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function DataTable({
  columns,
  data,
  title,
  onAdd,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  exportable = true,
  loading = false,
  serverPagination,
  searchValue,
  onSearchChange,
}: DataTableProps) {
  const isServerPaginated = Boolean(serverPagination);

  const [internalSearch, setInternalSearch] = useState('');
  const [pageState, setPageState] = useState(1);
  const [perPageState, setPerPageState] = useState(25);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const searchTerm = searchValue ?? internalSearch;
  const currentPage = serverPagination ? serverPagination.page : pageState;
  const currentPerPage = serverPagination ? serverPagination.perPage : perPageState;
  const shouldFilterLocally = !(isServerPaginated && onSearchChange);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm || !shouldFilterLocally) {
      return data;
    }

    const lowered = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowered)
      )
    );
  }, [data, searchTerm, shouldFilterLocally]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredData, sortDir, sortKey]);

  // Paginate
  const displayedData = isServerPaginated
    ? sortedData
    : sortedData.slice((currentPage - 1) * currentPerPage, currentPage * currentPerPage);

  const totalItems = isServerPaginated
    ? (shouldFilterLocally ? sortedData.length : serverPagination!.total)
    : sortedData.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / currentPerPage)) || 1;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSearchInput = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      if (serverPagination) {
        serverPagination.onPageChange(1);
      } else {
        setPageState(1);
      }
    } else {
      setInternalSearch(value);
      if (!isServerPaginated) {
        setPageState(1);
      }
    }
  };

  const handlePerPageChange = (value: number) => {
    if (serverPagination) {
      serverPagination.onPerPageChange(value);
      serverPagination.onPageChange(1);
    } else {
      setPerPageState(value);
      setPageState(1);
    }
  };

  const handlePrev = () => {
    if (currentPage === 1) return;
    if (serverPagination) {
      serverPagination.onPageChange(currentPage - 1);
    } else {
      setPageState((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNext = () => {
    if (currentPage >= totalPages) return;
    if (serverPagination) {
      serverPagination.onPageChange(currentPage + 1);
    } else {
      setPageState((prev) => Math.min(totalPages, prev + 1));
    }
  };

  const exportToExcel = () => {
    const csv = [
      columns.map((c) => c.title).join(','),
      ...filteredData.map((row) => columns.map((c) => row[c.key]).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {exportable && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            )}
          </div>
        </div>

        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.title}
                    {sortKey === col.key && (
                      <span>{sortDir === 'asc' ? '' : ''}</span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              displayedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - Pagination */}
      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={currentPerPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            of {totalItems} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {Math.min(currentPage, totalPages)} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
