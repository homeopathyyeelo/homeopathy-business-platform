'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface GMBPost {
    id: number;
    title: string;
    content: string;
    media_url?: string;
    status: 'PUBLISHED' | 'FAILED' | 'PENDING' | 'SCHEDULED';
    published_at?: string;
    scheduled_for?: string;
    post_url?: string;
    error_message?: string;
    created_at: string;
    account: {
        location_name: string;
    };
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export default function GMBHistoryPage() {
    const [posts, setPosts] = useState<GMBPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 25,
        pages: 0
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchPosts = async (page = 1) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '25',
                ...(statusFilter && { status: statusFilter }),
                ...(searchQuery && { search: searchQuery }),
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: dateTo }),
            });

            const response = await fetch(`/api/social/gmb/posts?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setPosts(data.data.posts || []);
                setPagination({
                    total: data.data.total,
                    page: data.data.page,
                    limit: data.data.limit,
                    pages: data.data.pages
                });
            } else {
                toast.error('Failed to fetch posts');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Error loading history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(1);
    }, [statusFilter, dateFrom, dateTo]); // Auto-refresh on filter change

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(1);
    };

    const handleRetry = async (postId: number) => {
        try {
            const response = await fetch(`/api/social/gmb/posts/${postId}/retry`, {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Retry initiated');
                fetchPosts(pagination.page); // Refresh current page
            } else {
                toast.error(data.error || 'Retry failed');
            }
        } catch (error) {
            toast.error('Error retrying post');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Published
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" /> Failed
                    </span>
                );
            case 'SCHEDULED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" /> Scheduled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                    </span>
                );
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Publishing History</h1>
                <p className="text-gray-500">View and manage your Google My Business posts</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>

                    <select
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="FAILED">Failed</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="PENDING">Pending</option>
                    </select>

                    <input
                        type="date"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />

                    <input
                        type="date"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        Loading posts...
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No posts found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(post.created_at), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{post.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{post.content}</div>
                                            {post.error_message && (
                                                <div className="text-xs text-red-500 mt-1">{post.error_message}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(post.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {post.post_url && (
                                                <a
                                                    href={post.post_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center"
                                                >
                                                    View <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                            {post.status === 'FAILED' && (
                                                <button
                                                    onClick={() => handleRetry(post.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                >
                                                    Retry <RefreshCw className="w-3 h-3 ml-1" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span>{' '}
                                of <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => fetchPosts(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>

                                {/* Page numbers could be added here for advanced pagination */}
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    Page {pagination.page} of {pagination.pages}
                                </span>

                                <button
                                    onClick={() => fetchPosts(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
