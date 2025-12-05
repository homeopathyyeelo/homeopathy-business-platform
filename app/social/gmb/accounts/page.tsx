'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    RefreshCw,
    Trash2,
    Plus,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface GMBAccount {
    id: string;
    businessName: string;
    locationName: string;
    locationId: string;
    status: 'connected' | 'expired' | 'expiring_soon';
    tokenExpiresAt: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<GMBAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/social/gmb/accounts', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${document.cookie.split('auth-token=')[1]?.split(';')[0]}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setAccounts(data.data);
            } else {
                toast.error('Failed to fetch accounts');
            }
        } catch (error) {
            toast.error('Error loading accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this account? Scheduled posts may fail.')) return;

        try {
            const response = await fetch(`http://localhost:3005/api/social/gmb/accounts/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${document.cookie.split('auth-token=')[1]?.split(';')[0]}`
                }
            });

            if (response.ok) {
                toast.success('Account disconnected');
                fetchAccounts();
            } else {
                toast.error('Failed to disconnect account');
            }
        } catch (error) {
            toast.error('Error disconnecting account');
        }
    };

    const handleConnect = async () => {
        try {
            console.log('Starting OAuth flow...');
            const token = document.cookie.split('auth-token=')[1]?.split(';')[0];
            console.log('Auth token:', token ? 'Found' : 'Missing');

            const response = await fetch('http://localhost:3005/api/social/gmb/oauth/initiate', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success && data.authUrl) {
                console.log('Redirecting to:', data.authUrl);
                window.location.href = data.authUrl;
            } else {
                console.error('OAuth init failed:', data);
                toast.error(data.error || 'Failed to initialize connection');
            }
        } catch (error) {
            console.error('OAuth error:', error);
            toast.error('Error starting OAuth flow');
        }
    };

    const getStatusBadge = (status: string, expiresAt: string) => {
        switch (status) {
            case 'connected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                    </span>
                );
            case 'expiring_soon':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expiring soon
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Expired
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Connected Accounts
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your Google My Business location connections.</p>
                </div>

                <button
                    onClick={handleConnect}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect New Location
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : !accounts || accounts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No accounts connected</h3>
                    <p className="text-gray-500 mt-2">Connect your Google My Business account to start posting</p>
                    <button
                        onClick={handleConnect}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Connect Account
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                        <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    {getStatusBadge(account.status, account.tokenExpiresAt)}
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate" title={account.businessName}>
                                    {account.businessName}
                                </h3>

                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate" title={account.locationName}>{account.locationName}</span>
                                </div>

                                <div className="text-xs text-gray-400 mb-6 bg-gray-50 p-2 rounded">
                                    Token expires {formatDistanceToNow(new Date(account.tokenExpiresAt), { addSuffix: true })}
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    {account.status !== 'connected' && (
                                        <button
                                            onClick={handleConnect}
                                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reconnect
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDisconnect(account.id)}
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Disconnect
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
