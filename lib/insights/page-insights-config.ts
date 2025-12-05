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
        title: 'Dashboard Summary',
        icon: '💰',
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 10
      },
      {
        title: 'Customer Overview',
        icon: '👥',
        dataFetcher: '/api/erp/customers?limit=5',
        priority: 9
      },
      {
        title: 'Product Catalog',
        icon: '📦',
        dataFetcher: '/api/erp/products?limit=5',
        priority: 8
      },
      {
        title: 'Recent Activity',
        icon: '📊',
        dataFetcher: '/api/dashboard/activity-feed',
        priority: 7
      },
      {
        title: 'System Status',
        icon: '�',
        dataFetcher: '/api/erp/notifications',
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
        title: 'Product Statistics',
        icon: '📦',
        dataFetcher: '/api/erp/products/stats',
        priority: 10
      },
      {
        title: 'Product Categories',
        icon: '📂',
        dataFetcher: '/api/erp/categories',
        priority: 9
      },
      {
        title: 'Low Stock Items',
        icon: '⚠️',
        dataFetcher: '/api/erp/inventory/alerts/low-stock',
        priority: 8
      },
      {
        title: 'Recent Products',
        icon: '🆕',
        dataFetcher: '/api/erp/products?limit=5&sort=created_at',
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
        title: 'Stock Overview',
        icon: '📊',
        dataFetcher: '/api/inventory',
        priority: 10
      },
      {
        title: 'Low Stock Alerts',
        icon: '⚠️',
        dataFetcher: '/api/erpinventory/low-stock',
        priority: 9
      },
      {
        title: 'Product Categories',
        icon: '📂',
        dataFetcher: '/api/erp/categories',
        priority: 8
      },
      {
        title: 'System Status',
        icon: '🔧',
        dataFetcher: '/api/erp/notifications',
        priority: 7
      }
    ]
  },

  // ============ CUSTOMERS MODULE ============
  {
    pagePattern: /^\/customers/,
    pageName: 'Customers',
    insights: [
      {
        title: 'Customer Overview',
        icon: '👥',
        dataFetcher: '/api/customers?limit=10',
        priority: 10
      },
      {
        title: 'Customer Statistics',
        icon: '📊',
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 9
      },
      {
        title: 'Recent Activity',
        icon: '📝',
        dataFetcher: '/api/dashboard/activity-feed',
        priority: 8
      }
    ]
  },

  // ============ SALES MODULE ============
  {
    pagePattern: /^\/sales/,
    pageName: 'Sales',
    insights: [
      {
        title: 'Sales Summary',
        icon: '💰',
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 10
      },
      {
        title: 'Customer Overview',
        icon: '👥',
        dataFetcher: '/api/erp/customers?limit=5',
        priority: 9
      },
      {
        title: 'Product Performance',
        icon: '📦',
        dataFetcher: '/api/erp/products/stats',
        priority: 8
      }
    ]
  },

  // ============ GMB/SOCIAL MODULE ============
  {
    pagePattern: /^\/social\/gmb/,
    pageName: 'GMB Marketing',
    insights: [
      {
        title: 'Smart Insights',
        icon: '🎯',
        dataFetcher: 'http://localhost:3005/api/social/gmb/trends',
        priority: 10
      },
      {
        title: 'AI Content Ideas',
        icon: '💡',
        dataFetcher: 'http://localhost:3005/api/social/gmb/analytics?groupBy=ai',
        priority: 9
      },
      {
        title: 'Post Analytics',
        icon: '📊',
        dataFetcher: 'http://localhost:3005/api/social/gmb/analytics?groupBy=category',
        priority: 8
      },
      {
        title: 'Monthly Activity',
        icon: '📈',
        dataFetcher: 'http://localhost:3005/api/social/gmb/analytics?groupBy=month',
        priority: 7
      }
    ]
  },

  // ============ OTHER MODULES ============
  {
    pagePattern: /^\/(purchases|vendors|finance|reports|analytics|marketing|hr|settings)/,
    pageName: 'Module',
    insights: [
      {
        title: 'Business Overview',
        icon: '📊',
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 10
      },
      {
        title: 'Recent Activity',
        icon: '📝',
        dataFetcher: '/api/dashboard/activity-feed',
        priority: 9
      },
      {
        title: 'System Status',
        icon: '🔧',
        dataFetcher: '/api/erp/notifications',
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
        dataFetcher: '/api/erp/dashboard/stats',
        priority: 10
      },
      {
        title: 'Customer Base',
        icon: '👥',
        dataFetcher: '/api/erp/customers?limit=5',
        priority: 9
      },
      {
        title: 'System Status',
        icon: '🔔',
        dataFetcher: '/api/erp/notifications',
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
