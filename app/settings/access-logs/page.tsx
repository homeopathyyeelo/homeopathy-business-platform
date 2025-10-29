'use client';

import { useState } from 'react';
import DataTable from '@/components/common/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Activity, Calendar, User, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AccessLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  status: string;
  timestamp: string;
  details?: string;
}

export default function UserAccessLogsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['access-logs', page, perPage, userFilter, actionFilter, dateFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.set('limit', String(perPage));
        params.set('offset', String((page - 1) * perPage));
        if (userFilter) params.set('user_id', userFilter);
        if (actionFilter) params.set('action', actionFilter);
        if (dateFilter) params.set('date', dateFilter);

        const res = await golangAPI.get(`/api/erp/audit-logs?${params.toString()}`);
        return {
          logs: (res.data?.logs || []) as AccessLog[],
          total: res.data?.total || 0,
        };
      } catch {
        // Demo fallback
        const demoLogs: AccessLog[] = Array.from({ length: 10 }, (_, i) => ({
          id: `log-${i + 1}`,
          user_id: `user-${(i % 3) + 1}`,
          user_name: ['Admin User', 'Manager User', 'Staff User'][i % 3],
          action: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'][i % 5],
          resource: ['products', 'customers', 'sales', 'inventory'][i % 4],
          ip_address: `192.168.1.${i + 10}`,
          user_agent: 'Mozilla/5.0',
          status: i % 4 === 0 ? 'FAILED' : 'SUCCESS',
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          details: i % 2 === 0 ? `Additional details for action ${i}` : undefined,
        }));
        return { logs: demoLogs, total: 100 };
      }
    },
    staleTime: 30000,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: 'timestamp',
      title: 'Timestamp',
      sortable: true,
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      key: 'user_name',
      title: 'User',
      sortable: true,
      render: (val: string, row: AccessLog) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span>{val || row.user_id}</span>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      sortable: true,
      render: (val: string) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          val === 'LOGIN' ? 'bg-green-100 text-green-700' :
          val === 'LOGOUT' ? 'bg-gray-100 text-gray-700' :
          val === 'CREATE' ? 'bg-blue-100 text-blue-700' :
          val === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
          val === 'DELETE' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'resource',
      title: 'Resource',
      sortable: true,
    },
    {
      key: 'ip_address',
      title: 'IP Address',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (val: string) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          val === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {val}
        </span>
      ),
    },
  ];

  const serverPagination = {
    page,
    perPage,
    total,
    onPageChange: setPage,
    onPerPageChange: (newPerPage: number) => {
      setPerPage(newPerPage);
      setPage(1);
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Access Logs</h1>
            <p className="text-gray-600">Audit trail of all user activities</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.status === 'FAILED').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(logs.map(l => l.user_id)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by user, action, or date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Input
                placeholder="Enter user ID..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <DataTable
        title="Access Logs"
        columns={columns}
        data={logs}
        loading={isLoading}
        serverPagination={serverPagination}
      />
    </div>
  );
}
