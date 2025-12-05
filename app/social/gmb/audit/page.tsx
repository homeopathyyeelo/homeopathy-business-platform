'use client';

import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    RefreshCw,
    FileText,
    Calendar,
    Settings,
    AlertCircle,
    CheckCircle2,
    User,
    Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLog {
    ID: string;
    UserID: string | null;
    Action: string;
    EntityType: string;
    EntityID: string;
    Details: string;
    CreatedAt: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterAction]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = '/api/social/gmb/audit';
            if (filterAction) url += `?action=${filterAction}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setLogs(data.data);
            } else {
                toast.error('Failed to fetch audit logs');
            }
        } catch (error) {
            toast.error('Error loading audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('POST')) return <FileText className="w-4 h-4" />;
        if (action.includes('SCHEDULE')) return <Calendar className="w-4 h-4" />;
        if (action.includes('ACCOUNT')) return <Settings className="w-4 h-4" />;
        if (action.includes('ERROR') || action.includes('FAIL')) return <AlertCircle className="w-4 h-4" />;
        return <History className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes('FAIL') || action.includes('ERROR')) return 'bg-red-100 text-red-700';
        if (action.includes('PUBLISH')) return 'bg-green-100 text-green-700';
        if (action.includes('SCHEDULE')) return 'bg-blue-100 text-blue-700';
        if (action.includes('CREATE')) return 'bg-purple-100 text-purple-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-blue-600" />
                        Audit Log
                    </h1>
                    <p className="text-gray-500 mt-1">Track all system activities and user actions.</p>
                </div>

                <button
                    onClick={fetchLogs}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh Logs"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="POST_CREATED">Post Created</option>
                        <option value="POST_PUBLISHED">Post Published</option>
                        <option value="POST_SCHEDULED">Post Scheduled</option>
                        <option value="ACCOUNT_CONNECTED">Account Connected</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">Time</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Action</th>
                                <th className="px-6 py-3 font-medium text-gray-500">User</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.ID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {format(new Date(log.CreatedAt), 'MMM d, h:mm a')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.Action)}`}>
                                                <span className="mr-1.5">{getActionIcon(log.Action)}</span>
                                                {log.Action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-gray-700">
                                                {log.UserID ? (
                                                    <>
                                                        <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                        User
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bot className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                                                        System
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-md truncate font-mono text-xs">
                                            {log.Details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
