'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  ShoppingCart,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface UploadSession {
  id: string;
  upload_type: string;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  status: string;
  approval_status: string;
  supplier_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  total_amount?: number;
  total_items: number;
  uploaded_by: string;
  uploaded_at: string;
  rejection_reason?: string;
}

export default function ApprovalsPage() {
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'inventory'>('all');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/uploads/purchase?status=pending');
      const data = await response.json();
      
      const inventoryResponse = await fetch('/api/uploads/inventory?status=pending');
      const inventoryData = await inventoryResponse.json();

      const allSessions = [...(data.sessions || []), ...(inventoryData.sessions || [])];
      
      setSessions(
        filter === 'all'
          ? allSessions
          : allSessions.filter((s) => s.upload_type === filter)
      );
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sessionId: string) => {
    if (!confirm('Are you sure you want to approve this upload? This will import the data into the system.')) {
      return;
    }

    try {
      setActionLoading(sessionId);
      const response = await fetch('/api/uploads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'approve' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Approval failed');
      }

      alert('Upload approved and imported successfully!');
      fetchSessions();
    } catch (error: any) {
      alert(`Approval failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sessionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(sessionId);
      const response = await fetch('/api/uploads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'reject', reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rejection failed');
      }

      alert('Upload rejected successfully');
      fetchSessions();
    } catch (error: any) {
      alert(`Rejection failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const pendingCount = sessions.filter((s) => s.approval_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve pending purchase and inventory uploads
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-semibold">
            {pendingCount} Pending
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setFilter('purchase')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === 'purchase'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchases ({sessions.filter((s) => s.upload_type === 'purchase').length})
          </button>
          <button
            onClick={() => setFilter('inventory')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === 'inventory'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory ({sessions.filter((s) => s.upload_type === 'inventory').length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Loading uploads...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending approvals at the moment.</p>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            {/* Session Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {session.upload_type === 'purchase' ? (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.upload_type === 'purchase'
                          ? `Purchase: ${session.invoice_number || 'N/A'}`
                          : 'Inventory Upload'}
                      </h3>
                      <p className="text-sm text-gray-600">{session.file_name}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {session.supplier_name && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Supplier
                        </p>
                        <p className="font-medium text-gray-900">
                          {session.supplier_name}
                        </p>
                      </div>
                    )}
                    {session.invoice_date && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Invoice Date
                        </p>
                        <p className="font-medium text-gray-900">
                          {new Date(session.invoice_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Total Items
                      </p>
                      <p className="font-medium text-gray-900">{session.total_items}</p>
                    </div>
                    {session.total_amount && (
                      <div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Amount
                        </p>
                        <p className="font-medium text-gray-900">
                          ₹{session.total_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Info */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(session.uploaded_at)}
                    </span>
                    {session.error_rows > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        {session.error_rows} errors
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(session.id)}
                    disabled={actionLoading === session.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {actionLoading === session.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(session.id)}
                    disabled={actionLoading === session.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => toggleExpand(session.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {expandedSession === session.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedSession === session.id && (
              <div className="border-t bg-gray-50 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Upload Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {session.total_rows}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {session.processed_rows}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-600">Success</p>
                    <p className="text-2xl font-bold text-green-600">
                      {session.success_rows}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-red-600">
                      {session.error_rows}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
