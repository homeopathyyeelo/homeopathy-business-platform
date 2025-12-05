'use client';

import React, { useState } from 'react';
import {
    Sparkles,
    Thermometer,
    Calendar,
    ShoppingBag,
    Send,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedContent {
    title: string;
    content: string;
}

export default function SmartComposerPage() {
    const [mode, setMode] = useState<'topic' | 'season' | 'disease'>('topic');
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    // Inputs
    const [topic, setTopic] = useState('');
    const [season, setSeason] = useState('winter');
    const [disease, setDisease] = useState('');
    const [tone, setTone] = useState('informative');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let endpoint = '/api/social/gmb/generate/topic';
            let body: any = { tone, product_ids: selectedProducts };

            if (mode === 'season') {
                endpoint = '/api/social/gmb/generate/season';
                body = { season, product_ids: selectedProducts };
            } else if (mode === 'disease') {
                endpoint = '/api/social/gmb/generate/disease';
                body = { disease, product_ids: selectedProducts };
            } else {
                body.topic = topic;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data.success) {
                setGeneratedContent(data.data);
                toast.success('Content generated successfully!');
            } else {
                toast.error(data.error || 'Generation failed');
            }
        } catch (error) {
            toast.error('Error generating content');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!generatedContent) return;

        // Logic to publish (reuse existing quick post API)
        try {
            const response = await fetch('/api/social/gmb/posts/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: generatedContent.content,
                    // Add title if API supports it, or prepend to content
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Post published successfully!');
                setGeneratedContent(null);
            } else {
                toast.error(data.error || 'Publishing failed');
            }
        } catch (error) {
            toast.error('Error publishing post');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Controls */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        Smart Composer
                    </h1>
                    <p className="text-gray-500">Generate AI-powered GMB posts in seconds.</p>
                </div>

                {/* Mode Selection */}
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('topic')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'topic' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Custom Topic
                    </button>
                    <button
                        onClick={() => setMode('season')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'season' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Seasonal
                    </button>
                    <button
                        onClick={() => setMode('disease')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'disease' ? 'bg-white shadow text-purple-700' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Disease Awareness
                    </button>
                </div>

                {/* Dynamic Inputs */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    {mode === 'topic' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Benefits of Arnica for sports injuries"
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    {mode === 'season' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                            <select
                                value={season}
                                onChange={(e) => setSeason(e.target.value)}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="winter">Winter (Immunity & Cold)</option>
                                <option value="summer">Summer (Hydration & Heat)</option>
                                <option value="monsoon">Monsoon (Dengue & Malaria)</option>
                                <option value="festive">Festive (Digestion & Detox)</option>
                            </select>
                        </div>
                    )}

                    {mode === 'disease' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Disease / Condition</label>
                            <input
                                type="text"
                                value={disease}
                                onChange={(e) => setDisease(e.target.value)}
                                placeholder="e.g., Dengue, Arthritis, Migraine"
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="informative">Informative & Professional</option>
                            <option value="empathetic">Empathetic & Caring</option>
                            <option value="urgent">Urgent (Alerts)</option>
                            <option value="promotional">Promotional</option>
                        </select>
                    </div>

                    {/* Product Selection Placeholder - To be connected to ERP search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feature Products (Optional)</label>
                        <div className="p-3 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center text-sm text-gray-500">
                            Product selection coming soon...
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || (mode === 'topic' && !topic) || (mode === 'disease' && !disease)}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" /> Generate Content
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>

                    {generatedContent ? (
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title</label>
                                <input
                                    type="text"
                                    value={generatedContent.title}
                                    onChange={(e) => setGeneratedContent({ ...generatedContent, title: e.target.value })}
                                    className="w-full p-2 border-b border-gray-200 focus:border-purple-500 focus:ring-0 text-lg font-medium text-gray-900"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Content</label>
                                <textarea
                                    value={generatedContent.content}
                                    onChange={(e) => setGeneratedContent({ ...generatedContent, content: e.target.value })}
                                    className="w-full h-64 p-2 border rounded-md focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    AI Validated & Compliant
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleGenerate}
                                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                    >
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={handlePublish}
                                        className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Publish Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a mode and generate content to see preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
