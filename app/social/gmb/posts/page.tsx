'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface GMBPost {
    id: string;
    title: string;
    content: string;
    status: string;
    published_at: string | null;
    created_at: string;
    error_message?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

import DashboardFilters from '@/components/gmb/DashboardFilters';
import CategoryChart from '@/components/gmb/CategoryChart';
import MonthlyChart from '@/components/gmb/MonthlyChart';
import AISuggestionsPanel from '@/components/gmb/AISuggestionsPanel';
import { useGmbAnalyticsByCategory, useGmbAnalyticsByMonth, useGmbAnalyticsBySubCategory } from '@/hooks/useGmbAnalytics';

export default function GMBPostsPage() {
    const [posts, setPosts] = useState<GMBPost[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        subcategory: '',
        brand: '',
        startDate: '',
        endDate: ''
    });

    // Fetch analytics data
    const { data: categoryData } = useGmbAnalyticsByCategory();
    const { data: monthlyData } = useGmbAnalyticsByMonth();
    const { data: subCategoryData } = useGmbAnalyticsBySubCategory(null); // Pass accountID if available, or null for all

    const fetchPosts = async (page: number = 1) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '100',
                category: filters.category,
                subcategory: filters.subcategory,
                brand: filters.brand,
                date_from: filters.startDate,
                date_to: filters.endDate
            });

            const res = await fetch(`http://localhost:3005/api/social/gmb/posts?${queryParams.toString()}`, {
                credentials: 'include'
            });
            const responseData = await res.json();

            if (responseData.success && responseData.data) {
                setPosts(responseData.data.posts || []);
                setPagination({
                    page: responseData.data.page,
                    limit: responseData.data.limit,
                    total: responseData.data.total,
                    totalPages: responseData.data.pages
                });
            } else {
                setPosts([]);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(1);
    }, [filters]); // Refetch when filters change

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleRebuildCategories = async () => {
        if (!confirm('This will re-analyze all posts with missing categories using AI. This may take a while. Continue?')) return;

        try {
            const res = await fetch('http://localhost:3005/api/social/gmb/ai/categorize', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                alert(`Categorization started/completed. ${data.message}`);
                fetchPosts(pagination.page);
            } else {
                alert('Failed to start categorization: ' + data.error);
            }
        } catch (error) {
            console.error('Error rebuilding categories:', error);
            alert('An error occurred');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PUBLISHED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Published
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Failed
                    </span>
                );
            case 'PUBLISHING':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4 animate-pulse" />
                        Publishing
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {status || 'Draft'}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">GMB Posts Dashboard</h1>
                        <p className="text-gray-600 mt-2">
                            Viewing all posts from your Google My Business account
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRebuildCategories}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Rebuild Categories
                        </button>
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await fetch('http://localhost:3005/api/social/gmb/sync', {
                                        method: 'POST',
                                        credentials: 'include'
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        console.log('Synced:', data.message);
                                        fetchPosts(1);
                                    } else {
                                        console.error('Sync failed:', data.error);
                                    }
                                } catch (error) {
                                    console.error('Sync error:', error);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Sync from Google
                        </button>
                        <button
                            onClick={() => fetchPosts(pagination.page)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh List
                        </button>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm text-gray-600">Total Posts</div>
                                <div className="text-3xl font-bold text-gray-900 mt-1">{pagination.total}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm text-gray-600">Published</div>
                                <div className="text-3xl font-bold text-green-600 mt-1">
                                    {posts.filter(p => p.status === 'PUBLISHED').length}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="text-sm text-gray-600">Failed</div>
                                <div className="text-3xl font-bold text-red-600 mt-1">
                                    {posts.filter(p => p.status === 'FAILED').length}
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Categories</h3>
                                <CategoryChart data={categoryData} />
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</h3>
                                <MonthlyChart data={monthlyData} />
                            </div>
                        </div>
                    </div>

                    {/* AI Panel Column */}
                    <div className="lg:col-span-1">
                        <AISuggestionsPanel />
                    </div>
                </div>

                {/* Filters */}
                <DashboardFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    categories={categoryData?.map(c => c.category) || []}
                    subcategories={subCategoryData?.map(c => c.category) || []}
                />

                {/* Posts List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <p className="text-gray-500 text-lg">No posts found</p>
                        <p className="text-gray-400 mt-2">Create your first GMB post to get started</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Title</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Content</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sub Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Brand</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{post.id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{post.title || 'Untitled'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 max-w-md truncate">
                                                {post.content}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{post.category || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{post.sub_category || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{post.brand || '-'}</td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(post.status)}
                                            {post.error_message && (
                                                <div className="text-xs text-red-600 mt-1">{post.error_message}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {post.published_at
                                                ? new Date(post.published_at).toLocaleDateString()
                                                : new Date(post.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchPosts(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => fetchPosts(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
