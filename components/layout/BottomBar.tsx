'use client';

import { useState, useEffect } from 'react';
import { Wifi, Database, Activity, Clock, Zap, X, Server, Monitor, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface SystemHealth {
  services: Array<{
    service: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
  }>;
}

interface CounterStatus {
  connected: number;
  total: number;
  synced: number;
}

interface BottomBarProps {
  onClose: () => void;
}

export default function BottomBar({ onClose }: BottomBarProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({ services: [] });
  const [counterStatus, setCounterStatus] = useState<CounterStatus>({ connected: 0, total: 0, synced: 0 });
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusData();
    const interval = setInterval(fetchStatusData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatusData = async () => {
    setLoading(true);
    try {
      // Fetch system health
      const healthRes = await fetch('http://localhost:3005/api/v1/system/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData.success && healthData.data) {
          setSystemHealth(healthData.data);
        }
      }

      // Fetch counter status
      const countersRes = await fetch('http://localhost:3005/api/erp/pos/counters');
      if (countersRes.ok) {
        const countersData = await countersRes.json();
        if (countersData.success && countersData.data) {
          const counters = countersData.data;
          setCounterStatus({
            connected: counters.filter((c: any) => c.status === 'connected').length,
            total: counters.length,
            synced: counters.filter((c: any) => c.syncStatus === 'synced').length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
      setLastSync(new Date());
    }
  };

  const healthyServices = systemHealth.services.filter(s => s.status === 'up').length;
  const totalServices = systemHealth.services.length;
  const overallHealth = totalServices > 0 ? (healthyServices / totalServices * 100) : 100;

  return (
    <footer className="h-10 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-gray-300 text-xs flex items-center px-6 gap-6 border-t border-gray-700 shadow-2xl">
      <div className="flex items-center gap-6">
        {/* Network Status */}
        <div className="flex items-center gap-2">
          <Wifi className={`h-3.5 w-3.5 ${overallHealth > 90 ? 'text-green-400' : overallHealth > 50 ? 'text-yellow-400' : 'text-red-400'}`} />
          <span className={`${overallHealth > 90 ? 'text-green-400' : overallHealth > 50 ? 'text-yellow-400' : 'text-red-400'} font-medium`}>
            {overallHealth > 90 ? 'Online' : overallHealth > 50 ? 'Degraded' : 'Offline'}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* System Health */}
        <div className="flex items-center gap-2">
          <Server className={`h-3.5 w-3.5 ${overallHealth > 90 ? 'text-green-400' : overallHealth > 50 ? 'text-yellow-400' : 'text-red-400'}`} />
          <span>Health: <span className={`${overallHealth > 90 ? 'text-green-400' : overallHealth > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(overallHealth)}%</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Multi-PC Sync */}
        <div className="flex items-center gap-2">
          <Monitor className={`h-3.5 w-3.5 ${counterStatus.connected > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
          <span>Sync: <span className={`${counterStatus.synced === counterStatus.total && counterStatus.total > 0 ? 'text-green-400' : 'text-yellow-400'}`}>{counterStatus.synced}/{counterStatus.total}</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Database Status */}
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>DB: <span className="text-blue-400">Connected</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Message Queue */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-purple-400" />
          <span>Kafka: <span className="text-purple-400">Active</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Last Sync */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <span>Sync: <span className="text-orange-400">{lastSync.toLocaleTimeString()}</span></span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-6">
        {/* Background Jobs */}
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span><span className="text-yellow-400 font-medium">3</span> Jobs</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* System Info */}
        <span className="text-gray-400">HomeoERP v2.1.0</span>

        <div className="h-4 w-px bg-gray-700" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
          )}
          {!loading && overallHealth < 100 && (
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
          )}
          {!loading && overallHealth === 100 && (
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          )}
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Hide status bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
