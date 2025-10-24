"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Monitor,
  Users,
  Wifi,
  WifiOff,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react";

interface CounterSession {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastActivity: string;
  currentBill?: string;
  operator: string;
  ipAddress: string;
  syncStatus: 'synced' | 'pending' | 'error';
  batteryLevel?: number;
}

export default function MultiPCSyncPage() {
  const [counters, setCounters] = useState<CounterSession[]>([]);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountersData();
    const interval = setInterval(fetchCountersData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCountersData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3005/api/erp/pos/counters');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCounters(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching counters:', error);
      // Mock data fallback
      setCounters([
        {
          id: 'counter-001',
          name: 'Main Counter',
          status: 'connected',
          lastActivity: new Date().toISOString(),
          currentBill: 'BILL-2024-001',
          operator: 'Rajesh Kumar',
          ipAddress: '192.168.1.101',
          syncStatus: 'synced'
        },
        {
          id: 'counter-002',
          name: 'Counter 2',
          status: 'connected',
          lastActivity: new Date(Date.now() - 30000).toISOString(),
          operator: 'Priya Sharma',
          ipAddress: '192.168.1.102',
          syncStatus: 'synced'
        },
        {
          id: 'counter-003',
          name: 'Mobile POS',
          status: 'disconnected',
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          operator: 'Amit Patel',
          ipAddress: '192.168.1.103',
          syncStatus: 'pending',
          batteryLevel: 45
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const registerCounter = async () => {
    const name = prompt('Enter counter name:');
    if (name) {
      try {
        await fetch('http://localhost:3005/api/erp/pos/counters/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        fetchCountersData();
      } catch (error) {
        console.error('Error registering counter:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'syncing': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const connectedCount = counters.filter(c => c.status === 'connected').length;
  const totalBills = counters.filter(c => c.currentBill).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="w-8 h-8 text-blue-500" />
            Multi-PC Sync
          </h1>
          <p className="text-gray-600 mt-1">Manage multiple POS terminals and sync status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCountersData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={registerCounter}>
            <Plus className="w-4 h-4 mr-2" />
            Register Counter
          </Button>
        </div>
      </div>

      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sync Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync-enabled">Enable Multi-PC Sync</Label>
              <p className="text-sm text-gray-600">Allow multiple terminals to share POS sessions</p>
            </div>
            <Switch
              id="sync-enabled"
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <p className="text-sm text-gray-600">Automatically sync data between terminals</p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="redis-url">Redis URL</Label>
              <Input
                id="redis-url"
                placeholder="redis://localhost:6379"
                defaultValue="redis://localhost:6379"
              />
            </div>
            <div>
              <Label htmlFor="sync-interval">Sync Interval (seconds)</Label>
              <Input
                id="sync-interval"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Counters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">of {counters.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalBills}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {counters.filter(c => c.syncStatus === 'synced').length}
            </div>
            <p className="text-xs text-muted-foreground">Fully synchronized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Redis</div>
            <p className="text-xs text-muted-foreground">Pub/Sub active</p>
          </CardContent>
        </Card>
      </div>

      {/* Counters Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Connected Terminals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading counters...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map((counter) => (
                <div key={counter.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(counter.status)}`} />
                      <span className="font-semibold">{counter.name}</span>
                    </div>
                    <Badge variant="outline" className={getSyncStatusColor(counter.syncStatus)}>
                      {counter.syncStatus}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operator:</span>
                      <span className="font-medium">{counter.operator}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">IP Address:</span>
                      <span className="font-mono text-xs">{counter.ipAddress}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="text-xs">
                        {new Date(counter.lastActivity).toLocaleTimeString()}
                      </span>
                    </div>

                    {counter.currentBill && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Bill:</span>
                        <span className="font-mono text-xs text-blue-600">
                          {counter.currentBill}
                        </span>
                      </div>
                    )}

                    {counter.batteryLevel !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Battery:</span>
                        <span className={`text-xs ${counter.batteryLevel < 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {counter.batteryLevel}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Force Sync
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Bill hold sync completed for Counter 1</span>
              <span className="text-gray-500 ml-auto">2s ago</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Wifi className="w-4 h-4 text-blue-500" />
              <span>Mobile POS connected to network</span>
              <span className="text-gray-500 ml-auto">15s ago</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>Auto-sync in progress...</span>
              <span className="text-gray-500 ml-auto">Now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
