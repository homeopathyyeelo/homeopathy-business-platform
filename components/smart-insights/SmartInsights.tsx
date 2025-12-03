"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  action?: {
    label: string;
    href: string;
  };
  priority: 'high' | 'medium' | 'low';
}

interface SmartInsightsProps {
  pageType: 'dashboard' | 'customers' | 'products' | 'inventory' | 'sales' | 'pos' | 'reports';
  data?: any;
  className?: string;
}

export default function SmartInsights({ pageType, data, className = "" }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [pageType, data]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Fetch relevant data and generate insights based on page type
      const generatedInsights = await getInsightsForPage(pageType, data);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightsForPage = async (page: string, pageData?: any): Promise<Insight[]> => {
    switch (page) {
      case 'dashboard':
        return await getDashboardInsights(pageData);
      case 'customers':
        return await getCustomerInsights(pageData);
      case 'products':
        return await getProductInsights(pageData);
      case 'inventory':
        return await getInventoryInsights(pageData);
      case 'sales':
        return await getSalesInsights(pageData);
      case 'pos':
        return await getPOSInsights(pageData);
      case 'reports':
        return await getReportsInsights(pageData);
      default:
        return [];
    }
  };

  const getDashboardInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    try {
      // Fetch dashboard stats
      const response = await fetch('/api/erp/dashboard/stats');
      const stats = await response.json();

      if (stats.success) {
        const { data: dashboardData } = stats;

        // Revenue trend insight
        if (dashboardData.month_revenue > dashboardData.today_revenue * 30) {
          insights.push({
            id: 'revenue-trend',
            type: 'success',
            title: 'Strong Monthly Performance',
            description: `Monthly revenue is ${Math.round((dashboardData.month_revenue / (dashboardData.today_revenue * 30)) * 100)}% above daily average`,
            value: `₹${dashboardData.month_revenue.toLocaleString()}`,
            trend: 'up',
            priority: 'high'
          });
        }

        // Low stock alert
        if (dashboardData.low_stock_items > 0) {
          insights.push({
            id: 'low-stock',
            type: 'warning',
            title: 'Stock Alert',
            description: `${dashboardData.low_stock_items} products running low`,
            value: dashboardData.low_stock_items,
            action: { label: 'View Items', href: '/inventory?filter=low-stock' },
            priority: 'high'
          });
        }

        // Customer growth
        if (dashboardData.total_customers > 100) {
          insights.push({
            id: 'customer-base',
            type: 'info',
            title: 'Growing Customer Base',
            description: 'Strong customer retention and growth',
            value: `${dashboardData.total_customers} customers`,
            trend: 'up',
            priority: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Dashboard insights error:', error);
    }

    return insights;
  };

  const getCustomerInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    try {
      const response = await fetch('/api/customers?limit=100');
      const customers = await response.json();

      if (customers.success) {
        const customerData = customers.data;

        // Customer type distribution
        const retailCount = customerData.filter((c: any) => c.customerType === 'RETAIL').length;
        const wholesaleCount = customerData.filter((c: any) => c.customerType === 'WHOLESALE').length;
        const doctorCount = customerData.filter((c: any) => c.customerType === 'DOCTOR').length;

        insights.push({
          id: 'customer-mix',
          type: 'info',
          title: 'Customer Distribution',
          description: `${retailCount} Retail, ${wholesaleCount} Wholesale, ${doctorCount} Doctors`,
          priority: 'medium'
        });

        // Outstanding balances
        const outstandingCustomers = customerData.filter((c: any) => c.outstandingBalance > 0);
        if (outstandingCustomers.length > 0) {
          const totalOutstanding = outstandingCustomers.reduce((sum: number, c: any) => sum + c.outstandingBalance, 0);
          insights.push({
            id: 'outstanding-balance',
            type: 'warning',
            title: 'Outstanding Payments',
            description: `${outstandingCustomers.length} customers have pending payments`,
            value: `₹${totalOutstanding.toLocaleString()}`,
            action: { label: 'Follow Up', href: '/customers?filter=outstanding' },
            priority: 'high'
          });
        }

        // New customer opportunity
        if (customerData.length < 50) {
          insights.push({
            id: 'customer-growth',
            type: 'info',
            title: 'Growth Opportunity',
            description: 'Consider customer acquisition campaigns',
            action: { label: 'Marketing', href: '/marketing/campaigns' },
            priority: 'low'
          });
        }
      }
    } catch (error) {
      console.error('Customer insights error:', error);
    }

    return insights;
  };

  const getProductInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    try {
      const response = await fetch('/api/erp/products?limit=100');
      const products = await response.json();

      if (products.success) {
        const productData = products.data;

        // Category analysis
        const categories = productData.reduce((acc: any, product: any) => {
          const category = product.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const topCategory = Object.entries(categories).sort(([, a], [, b]) => (b as number) - (a as number))[0];
        if (topCategory) {
          insights.push({
            id: 'top-category',
            type: 'info',
            title: 'Top Category',
            description: `${topCategory[0]} has ${topCategory[1]} products`,
            priority: 'medium'
          });
        }

        // Pricing insights
        const productsWithMRP = productData.filter((p: any) => p.mrp > 0);
        if (productsWithMRP.length > 0) {
          const avgMRP = productsWithMRP.reduce((sum: number, p: any) => sum + p.mrp, 0) / productsWithMRP.length;
          insights.push({
            id: 'avg-pricing',
            type: 'info',
            title: 'Average Product Price',
            description: 'Across all active products',
            value: `₹${Math.round(avgMRP)}`,
            priority: 'low'
          });
        }

        // Missing barcodes
        const missingBarcodes = productData.filter((p: any) => !p.barcode);
        if (missingBarcodes.length > 0) {
          insights.push({
            id: 'missing-barcodes',
            type: 'warning',
            title: 'Missing Barcodes',
            description: `${missingBarcodes.length} products need barcodes for POS`,
            action: { label: 'Generate', href: '/products/barcode' },
            priority: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Product insights error:', error);
    }

    return insights;
  };

  const getInventoryInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    // Add inventory-specific insights
    insights.push({
      id: 'fefo-reminder',
      type: 'info',
      title: 'FEFO System Active',
      description: 'First Expiry First Out is maintaining product quality',
      priority: 'low'
    });

    return insights;
  };

  const getSalesInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    // Add sales-specific insights
    insights.push({
      id: 'sales-trend',
      type: 'info',
      title: 'Sales Analytics',
      description: 'Track performance across all channels',
      action: { label: 'View Reports', href: '/reports/sales' },
      priority: 'medium'
    });

    return insights;
  };

  const getPOSInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    // Add POS-specific insights
    insights.push({
      id: 'pos-efficiency',
      type: 'success',
      title: 'POS Ready',
      description: 'All systems operational for quick billing',
      priority: 'low'
    });

    return insights;
  };

  const getReportsInsights = async (data?: any): Promise<Insight[]> => {
    const insights: Insight[] = [];

    // Add reports-specific insights
    insights.push({
      id: 'report-automation',
      type: 'info',
      title: 'Automated Reports',
      description: 'Daily, weekly, and monthly reports available',
      priority: 'low'
    });

    return insights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Smart Insights
        </CardTitle>
        <p className="text-sm text-purple-100">AI-powered analysis for {pageType}</p>
      </CardHeader>
      <CardContent className="p-4">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No insights available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights
              .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .slice(0, 5)
              .map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {getTrendIcon(insight.trend)}
                        {insight.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <div className="text-sm font-semibold text-foreground mb-2">
                          {insight.value}
                        </div>
                      )}
                      {insight.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => window.open(insight.action!.href, '_blank')}
                        >
                          {insight.action.label}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
