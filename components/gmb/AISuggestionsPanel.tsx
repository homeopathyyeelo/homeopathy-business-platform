'use client';

import { useGmbMissingCategories, useGmbAISuggestions } from '@/hooks/useGmbAnalytics';
import { Lightbulb, AlertTriangle, Sparkles, Copy } from 'lucide-react';
import { useState } from 'react';

export default function AISuggestionsPanel() {
    const { data: missing, isLoading: missingLoading } = useGmbMissingCategories();
    const { suggestions, isLoading: suggestionsLoading } = useGmbAISuggestions(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Missing Categories Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Missing Categories</h3>
                        <p className="text-gray-600 mt-1">
                            You haven't posted in these categories recently. Consider creating content to maintain a balanced profile.
                        </p>
                        {missingLoading ? (
                            <div className="mt-4 h-6 w-48 bg-yellow-200 animate-pulse rounded"></div>
                        ) : missing.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {missing.map((cat) => (
                                    <span key={cat} className="px-3 py-1 bg-white border border-yellow-300 text-yellow-800 rounded-full text-sm font-medium">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-green-600 mt-2 font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Great job! You've covered all key categories recently.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Lightbulb className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">AI Content Ideas</h3>
                        <p className="text-sm text-purple-600">Tailored suggestions for your homeopathy clinic</p>
                    </div>
                </div>

                {suggestionsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 animate-pulse">
                                <div className="h-4 w-1/3 bg-gray-200 rounded mb-3"></div>
                                <div className="h-16 w-full bg-gray-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="grid gap-4">
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wide rounded">
                                        {suggestion.category}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(suggestion.content, index)}
                                        className="text-gray-400 hover:text-purple-600 transition-colors"
                                        title="Copy content"
                                    >
                                        {copiedIndex === index ? <span className="text-xs text-green-600 font-medium">Copied!</span> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">{suggestion.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No suggestions available right now. Try syncing your posts first.
                    </div>
                )}
            </div>
        </div>
    );
}
