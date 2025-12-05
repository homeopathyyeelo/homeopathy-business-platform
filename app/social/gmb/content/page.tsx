'use client';

import React, { useState, useEffect } from 'react';
import {
    BookmarkPlus,
    Search,
    Filter,
    RefreshCw,
    Trash2,
    Edit2,
    Copy,
    Calendar,
    Hash,
    Image as ImageIcon,
    Plus,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ContentTemplate {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    imageUrl?: string;
    createdAt: string;
    usageCount: number;
}

export default function ContentLibraryPage() {
    const [templates, setTemplates] = useState<ContentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, [filterCategory]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            let url = '/api/social/gmb/content';
            if (filterCategory) url += `?category=${filterCategory}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setTemplates(data.data);
            } else {
                toast.error('Failed to fetch content templates');
            }
        } catch (error) {
            toast.error('Error loading content library');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`/api/social/gmb/content/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Template deleted');
                fetchTemplates();
            } else {
                toast.error('Failed to delete template');
            }
        } catch (error) {
            toast.error('Error deleting template');
        }
    };

    const handleCopyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Content copied to clipboard');
    };

    const handleUseTemplate = (template: ContentTemplate) => {
        // Store in localStorage to be picked up by the main GMB page
        localStorage.setItem('gmb_template_content', template.content);
        if (template.imageUrl) {
            localStorage.setItem('gmb_template_image', template.imageUrl);
        }
        toast.success('Template loaded! Navigate to GMB Posts to use it.');
        window.location.href = '/social/gmb';
    };

    const filteredTemplates = templates.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const categories = ['All', 'Seasonal', 'Disease', 'Promotional', 'Educational', 'Custom'];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookmarkPlus className="w-6 h-6 text-purple-600" />
                        Content Library
                    </h1>
                    <p className="text-gray-500 mt-1">Save and reuse your best GMB post templates.</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates by title, content, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat === 'All' ? '' : cat.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(cat === 'All' && !filterCategory) || filterCategory === cat.toLowerCase()
                                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    } border`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchTemplates}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <BookmarkPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Try a different search term.' : 'Create your first content template to get started.'}
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Template Image */}
                            {template.imageUrl && (
                                <div className="h-40 bg-gray-100 overflow-hidden">
                                    <img
                                        src={template.imageUrl}
                                        alt={template.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-5">
                                {/* Category Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        {template.category}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Used {template.usageCount} times
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {template.title}
                                </h3>

                                {/* Content Preview */}
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {template.content}
                                </p>

                                {/* Tags */}
                                {template.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {template.tags.slice(0, 3).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                                            >
                                                <Hash className="w-3 h-3 mr-0.5" />
                                                {tag}
                                            </span>
                                        ))}
                                        {template.tags.length > 3 && (
                                            <span className="text-xs text-gray-400 px-2">
                                                +{template.tags.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Meta Info */}
                                <div className="text-xs text-gray-400 mb-4 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(template.createdAt), 'MMM d, yyyy')}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleUseTemplate(template)}
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 mr-1.5" />
                                        Use
                                    </button>

                                    <button
                                        onClick={() => handleCopyToClipboard(template.content)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete template"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Template Modal - Simple for now */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Create Template</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Template creation form coming soon. For now, save templates from the main GMB Posts page.
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
