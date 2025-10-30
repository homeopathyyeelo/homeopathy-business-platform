/**
 * Dynamic Page Insights Hook
 * Automatically detects current page and fetches relevant insights
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { 
  getInsightsForPage, 
  getPrioritizedInsights, 
  type InsightConfig,
  type PageInsightsConfig 
} from '../insights/page-insights-config';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface InsightData {
  config: InsightConfig;
  data: any;
  isLoading: boolean;
  error: any;
}

export interface PageInsights {
  pageName: string;
  insights: InsightData[];
  isLoading: boolean;
}

/**
 * Main hook for dynamic page insights
 */
export function usePageInsights(maxInsights: number = 5): PageInsights {
  const pathname = usePathname();
  const [pageConfig, setPageConfig] = useState<PageInsightsConfig | null>(null);
  const [insightsData, setInsightsData] = useState<InsightData[]>([]);

  // Detect page change and update configuration
  useEffect(() => {
    const config = getInsightsForPage(pathname || '/');
    setPageConfig(config);
  }, [pathname]);

  // Fetch data for all insights
  useEffect(() => {
    if (!pageConfig) return;

    const prioritizedInsights = getPrioritizedInsights(
      pageConfig.insights,
      maxInsights
    );

    const fetchAllInsights = async () => {
      const results: InsightData[] = [];

      for (const insightConfig of prioritizedInsights) {
        // Create a placeholder while loading
        results.push({
          config: insightConfig,
          data: null,
          isLoading: true,
          error: null
        });
      }

      setInsightsData(results);

      // Fetch each insight's data
      for (let i = 0; i < prioritizedInsights.length; i++) {
        const insightConfig = prioritizedInsights[i];
        
        try {
          // Use API base URL from environment variable
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api/erp';
          const apiUrl = insightConfig.dataFetcher.startsWith('http') 
            ? insightConfig.dataFetcher 
            : `http://localhost:3005${insightConfig.dataFetcher}`;
          
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }
          const data = await response.json();

          setInsightsData(prev => {
            const updated = [...prev];
            updated[i] = {
              config: insightConfig,
              data: data,
              isLoading: false,
              error: null
            };
            return updated;
          });
        } catch (error) {
          setInsightsData(prev => {
            const updated = [...prev];
            updated[i] = {
              config: insightConfig,
              data: null,
              isLoading: false,
              error: error
            };
            return updated;
          });
        }
      }
    };

    fetchAllInsights();
  }, [pageConfig, maxInsights]);

  return {
    pageName: pageConfig?.pageName || 'Loading...',
    insights: insightsData,
    isLoading: insightsData.some(i => i.isLoading)
  };
}

/**
 * Hook for single insight with auto-refresh
 */
export function useInsight(endpoint: string, refreshInterval: number = 30000) {
  // Prepend API URL if needed
  const apiUrl = endpoint.startsWith('http') 
    ? endpoint 
    : `http://localhost:3005${endpoint}`;
  
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 10000
  });

  return {
    data,
    isLoading,
    error
  };
}

/**
 * Hook to detect page context for custom logic
 */
export function usePageContext() {
  const pathname = usePathname();
  
  const getContext = () => {
    if (pathname?.startsWith('/products')) return 'products';
    if (pathname?.startsWith('/inventory')) return 'inventory';
    if (pathname?.startsWith('/sales')) return 'sales';
    if (pathname?.startsWith('/purchases')) return 'purchases';
    if (pathname?.startsWith('/customers')) return 'customers';
    if (pathname?.startsWith('/vendors')) return 'vendors';
    if (pathname?.startsWith('/finance')) return 'finance';
    if (pathname?.startsWith('/hr')) return 'hr';
    if (pathname?.startsWith('/reports')) return 'reports';
    if (pathname?.startsWith('/analytics')) return 'analytics';
    if (pathname?.startsWith('/marketing')) return 'marketing';
    if (pathname?.startsWith('/settings')) return 'settings';
    if (pathname === '/dashboard') return 'dashboard';
    return 'general';
  };

  return {
    pathname,
    context: getContext(),
    isProductsPage: pathname?.startsWith('/products'),
    isInventoryPage: pathname?.startsWith('/inventory'),
    isSalesPage: pathname?.startsWith('/sales'),
    isPurchasePage: pathname?.startsWith('/purchases'),
    isCustomerPage: pathname?.startsWith('/customers'),
    isVendorPage: pathname?.startsWith('/vendors'),
    isFinancePage: pathname?.startsWith('/finance'),
    isHRPage: pathname?.startsWith('/hr'),
    isReportsPage: pathname?.startsWith('/reports'),
    isAnalyticsPage: pathname?.startsWith('/analytics'),
    isMarketingPage: pathname?.startsWith('/marketing'),
    isSettingsPage: pathname?.startsWith('/settings'),
    isDashboard: pathname === '/dashboard'
  };
}
