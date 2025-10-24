// Expiry notification service
import React from 'react';
import { toast } from '@/hooks/use-toast';

export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  batchNo: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExpirySummary {
  '7d': number;
  '1m': number;
  '3m': number;
  '6m': number;
  '1y': number;
}

class ExpiryNotificationService {
  private subscribers: Array<(alerts: ExpiryAlert[]) => void> = [];
  private summarySubscribers: Array<(summary: ExpirySummary) => void> = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startPolling();
  }

  // Subscribe to expiry alerts
  subscribe(callback: (alerts: ExpiryAlert[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Subscribe to expiry summary
  subscribeToSummary(callback: (summary: ExpirySummary) => void) {
    this.summarySubscribers.push(callback);
    return () => {
      this.summarySubscribers = this.summarySubscribers.filter(sub => sub !== callback);
    };
  }

  // Start polling for expiry data
  private startPolling() {
    this.intervalId = setInterval(() => {
      this.fetchExpiryData();
    }, 60000); // Every minute

    // Initial fetch
    this.fetchExpiryData();
  }

  private async fetchExpiryData() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

      // Fetch expiry summary
      const summaryRes = await fetch(`${API_URL}/api/erp/dashboard/expiry-summary`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success && summaryData.data) {
          this.notifySummary(summaryData.data);
        }
      }

      // Fetch detailed alerts
      const alertsRes = await fetch(`${API_URL}/api/erp/inventory/expiries/alerts`);
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        if (alertsData.success && alertsData.data) {
          this.notifyAlerts(alertsData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching expiry data:', error);
    }
  }

  private notifyAlerts(alerts: ExpiryAlert[]) {
    // Show toast notifications for critical alerts
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const highAlerts = alerts.filter(alert => alert.severity === 'high');

    criticalAlerts.forEach(alert => {
      toast({
        title: "🚨 Critical Expiry Alert",
        description: `${alert.productName} (${alert.batchNo}) expires in ${alert.daysUntilExpiry} days`,
        variant: "destructive",
      });
    });

    highAlerts.forEach(alert => {
      toast({
        title: "⚠️ High Priority Expiry",
        description: `${alert.productName} (${alert.batchNo}) expires in ${alert.daysUntilExpiry} days`,
        variant: "default",
      });
    });

    // Notify subscribers
    this.subscribers.forEach(callback => callback(alerts));
  }

  private notifySummary(summary: ExpirySummary) {
    // Show summary notifications if there are many expiring items
    const totalExpiring = Object.values(summary).reduce((sum, count) => sum + count, 0);

    if (totalExpiring > 10) {
      toast({
        title: "📦 Multiple Items Expiring Soon",
        description: `${totalExpiring} products expiring within the next year`,
        variant: "default",
      });
    }

    this.summarySubscribers.forEach(callback => callback(summary));
  }

  // Manual trigger for cron-like updates
  triggerExpiryCheck() {
    this.fetchExpiryData();
  }

  // Cleanup
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Singleton instance
export const expiryNotificationService = new ExpiryNotificationService();

// React hook for using expiry notifications
export function useExpiryNotifications() {
  const [alerts, setAlerts] = React.useState<ExpiryAlert[]>([]);
  const [summary, setSummary] = React.useState<ExpirySummary>({
    '7d': 0,
    '1m': 0,
    '3m': 0,
    '6m': 0,
    '1y': 0,
  });

  React.useEffect(() => {
    const unsubscribeAlerts = expiryNotificationService.subscribe(setAlerts);
    const unsubscribeSummary = expiryNotificationService.subscribeToSummary(setSummary);

    return () => {
      unsubscribeAlerts();
      unsubscribeSummary();
    };
  }, []);

  return { alerts, summary, refresh: () => expiryNotificationService.triggerExpiryCheck() };
}
