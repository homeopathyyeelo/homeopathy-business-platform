"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ServiceHealth {
  name: string;
  status: string;
  latency: number;
}

export default function StatusBarPage() {
  const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
  const { data, error, isLoading } = useSWR(`${API_URL}/api/erp/system/health`, fetcher, {
    refreshInterval: 10000 // Refresh every 10 seconds
  });

  const services: ServiceHealth[] = data?.services || [];
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const downCount = services.filter(s => s.status === 'down').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health Monitor</h1>
        <p className="text-muted-foreground">Real-time microservice status and health monitoring</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">Microservices monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <p className="text-xs text-muted-foreground">Services running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{downCount}</div>
            <p className="text-xs text-muted-foreground">Services offline</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Detailed health status of all microservices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading service health...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>Failed to fetch service health data</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {service.status === 'healthy' ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.status === 'healthy' ? 'Service is operational' : 'Service is not responding'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.latency}ms
                      </div>
                      <p className="text-xs text-muted-foreground">Response time</p>
                    </div>
                    <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle>Service Endpoints</CardTitle>
          <CardDescription>Microservice port assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">api-golang (Legacy)</span>
              <span className="text-muted-foreground">http://localhost:3005</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">api-golang-master (Primary)</span>
              <span className="text-muted-foreground">http://localhost:3005</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">purchase-service</span>
              <span className="text-muted-foreground">http://localhost:8006</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">invoice-parser</span>
              <span className="text-muted-foreground">http://localhost:8005</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">api-gateway</span>
              <span className="text-muted-foreground">http://localhost:4000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
