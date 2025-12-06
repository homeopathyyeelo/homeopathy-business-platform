import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ShoppingBag, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CustomerInsightsPanelProps {
    customerProfile: any;
    loading: boolean;
}

const CustomerInsightsPanel = ({ customerProfile, loading }: CustomerInsightsPanelProps) => {
    if (loading) {
        return (
            <Card className="h-full">
                <CardContent className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </CardContent>
            </Card>
        );
    }

    if (!customerProfile) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-500 flex items-center mb-1">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Outstanding
                        </div>
                        <div className={`text-xl font-bold ${customerProfile.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(customerProfile.outstanding)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-500 flex items-center mb-1">
                            <Clock className="w-4 h-4 mr-1" />
                            Last Visit
                        </div>
                        <div className="text-xl font-bold">
                            {customerProfile.lastVisit ? formatDate(customerProfile.lastVisit) : 'Never'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {customerProfile.visitPattern?.lastVisitDaysAgo || 0} days ago
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-500 flex items-center mb-1">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Avg Bill
                        </div>
                        <div className="text-xl font-bold">
                            {formatCurrency(customerProfile.avgBillValue || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Insights & Alerts */}
            {(customerProfile.aiInsights?.length > 0 || customerProfile.riskScore === 'HIGH') && (
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center text-blue-800">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Smart Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {customerProfile.riskScore === 'HIGH' && (
                                <div className="flex items-start text-sm text-red-700 bg-red-50 p-2 rounded">
                                    <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                                    <span>High Credit Risk: Outstanding amount exceeds 80% of credit limit.</span>
                                </div>
                            )}
                            {customerProfile.aiInsights?.map((insight: string, idx: number) => (
                                <div key={idx} className="text-sm text-blue-700 flex items-start">
                                    <span className="mr-2">•</span>
                                    {insight}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Last Purchase Items */}
            {customerProfile.lastPurchaseItems?.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Last Purchase Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {customerProfile.lastPurchaseItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                                    <span className="font-medium">{item.productName}</span>
                                    <div className="text-gray-500">
                                        {item.quantity} x {formatCurrency(item.price)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CustomerInsightsPanel;
