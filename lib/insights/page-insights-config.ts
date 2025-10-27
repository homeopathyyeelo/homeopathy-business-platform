/**
 * Dynamic Page Insights Configuration
 * Maps each page/module to contextual business insights
 */

export interface InsightConfig {
  title: string;
  icon: string;
  dataFetcher: string; // API endpoint or function name
  priority: number; // 1-10, higher = more important
  condition?: string; // Optional condition to show
}

export interface PageInsightsConfig {
  pagePattern: RegExp;
  pageName: string;
  insights: InsightConfig[];
}

/**
 * Complete mapping of all pages to their contextual insights
 * This is the "brain" of the dynamic right sidebar
 */
export const PAGE_INSIGHTS_MAP: PageInsightsConfig[] = [
  // ============ DASHBOARD ============
  {
    pagePattern: /^\/dashboard$/,
    pageName: 'Dashboard',
    insights: [
      {
        title: 'Today\'s Sales Summary',
        icon: '💰',
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 10
      },
      {
        title: 'Expiring Products Alert',
        icon: '⏰',
        dataFetcher: '/api/erp/dashboard/expiry-summary',
        priority: 9
      },
      {
        title: 'Low Stock Alerts',
        icon: '📦',
        dataFetcher: '/api/erp/inventory/alerts/low-stock',
        priority: 8
      },
      {
        title: 'Recent Activity',
        icon: '📊',
        dataFetcher: '/api/erp/dashboard/activity',
        priority: 7
      },
      {
        title: 'Pending Purchase Orders',
        icon: '🛒',
        dataFetcher: '/api/erp/purchases/pending',
        priority: 6
      }
    ]
  },

  // ============ PRODUCTS MODULE ============
  {
    pagePattern: /^\/products/,
    pageName: 'Products',
    insights: [
      {
        title: 'Total Products',
        icon: '📦',
        dataFetcher: '/api/erp/products?limit=1',
        priority: 10
      },
      {
        title: 'Categories',
        icon: '📂',
        dataFetcher: '/api/erp/categories',
        priority: 9
      },
      {
        title: 'Brands',
        icon: '🏭',
        dataFetcher: '/api/erp/brands',
        priority: 8
      },
      {
        title: 'Recent Activity',
        icon: '📊',
        dataFetcher: '/api/erp/dashboard/activity?limit=3',
        priority: 7
      }
    ]
  },

  // ============ INVENTORY MODULE ============
  {
    pagePattern: /^\/inventory/,
    pageName: 'Inventory',
    insights: [
      {
        title: 'Expiry Alerts',
        icon: '🚨',
        dataFetcher: '/api/erp/inventory/alerts/expiry',
        priority: 10
      },
      {
        title: 'Low Stock Alerts',
        icon: '⚠️',
        dataFetcher: '/api/erp/inventory/alerts/low-stock',
        priority: 9
      },
      {
        title: 'Stock Summary',
        icon: '📊',
        dataFetcher: '/api/erp/inventory/stock',
        priority: 8
      },
      {
        title: 'Recent Activity',
        icon: '📝',
        dataFetcher: '/api/erp/dashboard/activity?limit=3',
        priority: 7
      }
    ]
  },

  // ============ SALES, PURCHASE, CUSTOMERS, VENDORS, etc. ============
  // Simplified to use only dashboard/common endpoints
  {
    pagePattern: /^\/(sales|purchases|customers|vendors|finance|reports|analytics|marketing|hr|settings)/,
    pageName: 'Module',
    insights: [
      {
        title: 'Dashboard Summary',
        icon: '📊',
        dataFetcher: '/api/erp/dashboard/summary',
        priority: 10
      },
      {
        title: 'Recent Activity',
        icon: '📝',
        dataFetcher: '/api/erp/dashboard/activity?limit=5',
        priority: 9
      },
      {
        title: 'Expiry Summary',
        icon: '⏰',
        dataFetcher: '/api/erp/dashboard/expiry-summary',
        priority: 8
      }
    ]
  },

  // ============ DEFAULT/FALLBACK ============
  {
    pagePattern: /.*/,
    pageName: 'General',
    insights: [
      {
        title: 'Business Overview',
        icon: '🏪',
        dataFetcher: '/api/erp/dashboard/summary',
        priority: 10
      },
      {
        title: 'Quick Actions',
        icon: '⚡',
        dataFetcher: '/api/erp/dashboard/quick-actions',
        priority: 9
      },
      {
        title: 'System Notifications',
        icon: '🔔',
        dataFetcher: '/api/erp/notifications/recent',
        priority: 8
      }
    ]
  }
];

/**
 * Get insights configuration for current page
 */
export function getInsightsForPage(pathname: string): PageInsightsConfig {
  const match = PAGE_INSIGHTS_MAP.find(config => 
    config.pagePattern.test(pathname)
  );
  
  return match || PAGE_INSIGHTS_MAP[PAGE_INSIGHTS_MAP.length - 1]; // Return default if no match
}

/**
 * Get prioritized insights (top N by priority)
 */
export function getPrioritizedInsights(
  insights: InsightConfig[], 
  limit: number = 5
): InsightConfig[] {
  return [...insights]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
