import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Server, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDatabaseConfig } from "@/lib/config/database-connection";
import { checkProductionHealth } from "@/lib/config/production-db";

interface DatabaseStatusProps {
  className?: string;
}

export function DatabaseStatus({ className = "" }: DatabaseStatusProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<{
    type: 'supabase' | 'postgresql';
    connected: boolean;
    loading: boolean;
    lastCheck: Date | null;
    details?: any;
  }>({
    type: 'supabase',
    connected: false,
    loading: true,
    lastCheck: null
  });

  const checkDatabaseStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));

    try {
      const config = await getDatabaseConfig();
      
      if (config.type === 'postgresql') {
        const health = await checkProductionHealth();
        setStatus({
          type: 'postgresql',
          connected: health.status === 'healthy',
          loading: false,
          lastCheck: new Date(),
          details: health.details
        });
      } else {
        // For Supabase, assume connected if we can get config
        setStatus({
          type: 'supabase',
          connected: true,
          loading: false,
          lastCheck: new Date(),
          details: { url: config.supabase?.url }
        });
      }
    } catch (error) {
      console.error('Database status check failed:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        loading: false,
        lastCheck: new Date()
      }));
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    checkDatabaseStatus();
    toast({
      title: "Status Refreshed",
      description: "Database connection status updated",
    });
  };

  const getStatusColor = () => {
    if (status.loading) return 'secondary';
    return status.connected ? 'default' : 'destructive';
  };

  const getStatusText = () => {
    if (status.loading) return 'Checking...';
    return status.connected ? 'Connected' : 'Disconnected';
  };

  const getStatusIcon = () => {
    if (status.loading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (status.type === 'postgresql') {
      return status.connected ? 
        <Server className="h-4 w-4 text-green-500" /> : 
        <Server className="h-4 w-4 text-red-500" />;
    } else {
      return status.connected ? 
        <Database className="h-4 w-4 text-blue-500" /> : 
        <Database className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Database Status
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={status.loading}
          >
            <RefreshCw className={`h-3 w-3 ${status.loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Badge variant="outline">
            {status.type === 'postgresql' ? 'PostgreSQL' : 'Supabase'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {status.lastCheck && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Check:</span>
            <span className="text-xs text-muted-foreground">
              {status.lastCheck.toLocaleTimeString()}
            </span>
          </div>
        )}

        {!status.connected && !status.loading && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Database connection failed. Check your configuration and network.
            </AlertDescription>
          </Alert>
        )}

        {status.connected && status.type === 'postgresql' && status.details && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Host: {status.details.config?.host || 'Unknown'}</div>
            <div>Database: {status.details.config?.database || 'Unknown'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DatabaseStatus;