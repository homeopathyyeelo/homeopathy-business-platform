/**
 * Dynamic Right Panel - Contextual Insights for Every Page
 * Automatically shows relevant business insights based on current page
 */

'use client';

import React from 'react';
import { usePageInsights, usePageContext } from '../../lib/hooks/use-page-insights';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  Users,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface InsightCardProps {
  title: string;
  icon: string;
  data: any;
  isLoading: boolean;
  error: any;
}

/**
 * Individual Insight Card Component
 */
function InsightCard({ title, icon, data, isLoading, error }: InsightCardProps) {
  if (isLoading) {
    return (
      <Card className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3 border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <InsightContent data={data} title={title} />
      </CardContent>
    </Card>
  );
}

/**
 * Render insight content based on data type
 */
function InsightContent({ data, title }: { data: any; title: string }) {
  // Handle empty or null data
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">All good! No issues</span>
      </div>
    );
  }

  // Handle array data (list of items)
  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        {data.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
            <span className="truncate">{item.name || item.label || item.title || 'Item'}</span>
            {item.value && (
              <Badge variant="secondary" className="ml-2">
                {item.value}
              </Badge>
            )}
          </div>
        ))}
        {data.length > 3 && (
          <p className="text-xs text-muted-foreground text-right">
            +{data.length - 3} more
          </p>
        )}
      </div>
    );
  }

  // Handle object with nested data
  if (data.data && Array.isArray(data.data)) {
    return <InsightContent data={data.data} title={title} />;
  }

  // Handle count/number data
  if (typeof data === 'number' || data.count !== undefined) {
    const count = typeof data === 'number' ? data : data.count;
    return (
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-blue-600">{count}</div>
        <div className="text-xs text-muted-foreground">
          {count === 0 ? 'No items' : count === 1 ? 'item' : 'items'}
        </div>
      </div>
    );
  }

  // Handle summary with multiple KPIs
  if (data.kpis || data.stats || data.summary) {
    const kpiData = data.kpis || data.stats || data.summary;
    if (Array.isArray(kpiData)) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {kpiData.slice(0, 4).map((kpi: any, idx: number) => (
            <div key={idx} className="text-center p-2 bg-slate-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {kpi.value || kpi.count || 0}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {kpi.label || kpi.name}
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  // Handle expiry alerts
  if (data.alerts && Array.isArray(data.alerts)) {
    return (
      <div className="space-y-2">
        {data.alerts.slice(0, 3).map((alert: any, idx: number) => (
          <div 
            key={idx} 
            className={`p-2 rounded text-sm ${
              alert.severity === 'critical' ? 'bg-red-50 text-red-700' :
              alert.severity === 'warning' ? 'bg-orange-50 text-orange-700' :
              'bg-yellow-50 text-yellow-700'
            }`}
          >
            <div className="font-medium truncate">
              {alert.productName || alert.name}
            </div>
            <div className="text-xs">
              {alert.daysLeft ? `${alert.daysLeft} days left` : 'Check soon'}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle activity log
  if (data.activities || (Array.isArray(data) && data[0]?.action)) {
    const activities = data.activities || data;
    return (
      <div className="space-y-2">
        {activities.slice(0, 3).map((activity: any, idx: number) => (
          <div key={idx} className="flex gap-2 text-xs p-2 bg-slate-50 rounded">
            <Activity className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium truncate">{activity.description || activity.action}</p>
              <p className="text-muted-foreground">{activity.user_name || 'System'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle sales/financial data
  if (data.today !== undefined || data.total !== undefined) {
    return (
      <div className="space-y-2">
        {data.today !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Today</span>
            <span className="font-bold text-green-600">₹{data.today.toLocaleString()}</span>
          </div>
        )}
        {data.month !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm">This Month</span>
            <span className="font-bold">₹{data.month.toLocaleString()}</span>
          </div>
        )}
        {data.total !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Total</span>
            <span className="font-bold text-blue-600">₹{data.total.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback: display raw data as JSON
  return (
    <div className="text-xs text-muted-foreground font-mono">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(data, null, 2).slice(0, 200)}
      </pre>
    </div>
  );
}

/**
 * Main Dynamic Right Panel Component
 */
export default function DynamicRightPanel() {
  const { pageName, insights, isLoading } = usePageInsights(6);
  const context = usePageContext();

  return (
    <div className="w-80 bg-slate-50 border-l border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center gap-2 text-white mb-1">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Smart Insights</h2>
        </div>
        <p className="text-xs text-blue-100">
          {pageName} Module • Contextual Data
        </p>
      </div>

      {/* Page Context Badge */}
      <div className="p-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            📍 {context.context.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {insights.length} insights
          </span>
        </div>
      </div>

      {/* Insights List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && insights.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="mb-3">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                title={insight.config.title}
                icon={insight.config.icon}
                data={insight.data}
                isLoading={insight.isLoading}
                error={insight.error}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full text-left text-xs p-2 hover:bg-white rounded transition-colors flex items-center justify-between">
              <span>Export Data</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button className="w-full text-left text-xs p-2 hover:bg-white rounded transition-colors flex items-center justify-between">
              <span>Generate Report</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button className="w-full text-left text-xs p-2 hover:bg-white rounded transition-colors flex items-center justify-between">
              <span>View Analytics</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Auto-refreshing</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
