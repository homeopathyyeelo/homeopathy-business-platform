'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, TrendingUp } from 'lucide-react';
import { golangAPI } from '@/lib/api';

interface AIRecommendation {
    productId: string;
    productName: string;
    sku: string;
    mrp: number;
    sellingPrice: number;
    category: string;
    brand: string;
    confidence: number;
    support: number;
    reason: string;
    stock: number;
}

interface AIRecommendationsProps {
    cartProductIds: string[];
    onAddToCart: (product: AIRecommendation) => void;
    className?: string;
}

export default function AIRecommendations({ cartProductIds, onAddToCart, className }: AIRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (cartProductIds.length === 0) {
            setRecommendations([]);
            return;
        }

        fetchRecommendations();
    }, [cartProductIds]);

    const fetchRecommendations = async () => {
        try {
            setIsLoading(true);
            const response = await golangAPI.get('/v1/ai/recommendations', {
                params: {
                    productIds: cartProductIds.join(','),
                    limit: 6
                }
            });

            if (response.data.success) {
                setRecommendations(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
            setRecommendations([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (cartProductIds.length === 0) {
        return null;
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                        <CardTitle className="text-lg">AI Recommendations</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600 animate-pulse" />
                        <p className="text-sm">Analyzing purchase patterns...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Customers Also Bought</CardTitle>
                            <p className="text-xs text-gray-500">AI-powered suggestions to increase sales</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {recommendations.length} items
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recommendations.map((rec) => (
                        <div
                            key={rec.productId}
                            className="border rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm line-clamp-2">{rec.productName}</h4>
                                    <p className="text-xs text-gray-500">{rec.sku}</p>
                                </div>
                                {rec.confidence > 0.7 && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        Popular
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{rec.category}</span>
                                    <span className="text-gray-500">{rec.brand}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-green-600">₹{rec.sellingPrice.toFixed(2)}</span>
                                    {rec.mrp > rec.sellingPrice && (
                                        <span className="text-xs text-gray-400 line-through">₹{rec.mrp.toFixed(2)}</span>
                                    )}
                                </div>
                                <p className="text-xs text-purple-600 font-medium">{rec.reason}</p>
                            </div>

                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                onClick={() => onAddToCart(rec)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Quick Add
                            </Button>
                        </div>
                    ))}
                </div>

                {recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div className="text-xs text-purple-900">
                                <p className="font-medium">AI Insight</p>
                                <p className="text-purple-700">
                                    These products are frequently bought together by customers with similar purchases.
                                    Adding them can increase basket value by 15-25%.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
