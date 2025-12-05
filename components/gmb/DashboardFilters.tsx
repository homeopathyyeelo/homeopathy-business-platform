import React from 'react';

interface DashboardFiltersProps {
    filters: {
        category: string;
        subcategory: string;
        brand: string;
        startDate: string;
        endDate: string;
    };
    onFilterChange: (key: string, value: string) => void;
    categories: string[];
    subcategories: string[]; // You might need to fetch these dynamically based on category
}

export default function DashboardFilters({
    filters,
    onFilterChange,
    categories,
    subcategories,
}: DashboardFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                    value={filters.category}
                    onChange={(e) => onFilterChange('category', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                <select
                    value={filters.subcategory}
                    onChange={(e) => onFilterChange('subcategory', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="">All Sub Categories</option>
                    {subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                            {sub}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                    type="text"
                    value={filters.brand}
                    onChange={(e) => onFilterChange('brand', e.target.value)}
                    placeholder="Filter by Brand"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => onFilterChange('startDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => onFilterChange('endDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>

            <button
                onClick={() => {
                    onFilterChange('category', '');
                    onFilterChange('subcategory', '');
                    onFilterChange('brand', '');
                    onFilterChange('startDate', '');
                    onFilterChange('endDate', '');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
            >
                Clear Filters
            </button>
        </div>
    );
}
