'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authFetch } from '@/lib/api/fetch-utils';
import { apiFetch } from '@/lib/utils/api-fetch';

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Package,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Percent,
} from 'lucide-react';

interface SessionDetail {
  session: any;
  purchase: any;
  items: any[];
}

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [sessionId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/api/uploads/session/${sessionId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch details');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this purchase and import all data into inventory?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiFetch('/api/uploads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'approve' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Approval failed');
      }

      alert('✅ Purchase approved and imported successfully!');
      router.push('/admin/approvals');
    } catch (err: any) {
      alert(`❌ Approval failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await apiFetch('/api/uploads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'reject', reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Rejection failed');
      }

      alert('Upload rejected');
      router.push('/admin/approvals');
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Details</h3>
          <p className="text-red-700">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/admin/approvals')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Approvals
          </button>
        </div>
      </div>
    );
  }

  const { session, purchase, items } = data;

  // Calculate totals (convert strings to numbers)
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0);
  const grandTotal = subtotal;

  // GST breakup
  const gstBreakup: Record<string, { taxable: number; cgst: number; sgst: number; igst: number }> = {};
  items.forEach((item) => {
    const rate = `${parseFloat(item.tax_percent || 0)}%`;
    if (!gstBreakup[rate]) {
      gstBreakup[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    const taxable = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0) - parseFloat(item.discount_amount || 0);
    gstBreakup[rate].taxable += taxable;
    
    // Assume intra-state (CGST+SGST), adjust if IGST needed
    const taxAmt = parseFloat(item.tax_amount || 0);
    gstBreakup[rate].cgst += taxAmt / 2;
    gstBreakup[rate].sgst += taxAmt / 2;
  });

  // Profit estimates
  const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0)), 0);
  const totalMRP = items.reduce((sum, item) => sum + (parseFloat(item.mrp || 0) * parseFloat(item.quantity || 0)), 0);
  const estimatedProfit = totalMRP - totalCost;
  const profitPercent = totalMRP > 0 ? Math.round((estimatedProfit / totalMRP) * 100) : 0;

  // Smart Insights Calculations
  const avgMargin = profitPercent;
  const highMarginItems = items.filter(item => {
    const cost = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
    const mrp = parseFloat(item.mrp || 0) * parseFloat(item.quantity || 0);
    return mrp > 0 && ((mrp - cost) / mrp) > 0.4;
  }).length;
  const lowMarginItems = items.filter(item => {
    const cost = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
    const mrp = parseFloat(item.mrp || 0) * parseFloat(item.quantity || 0);
    return mrp > 0 && ((mrp - cost) / mrp) < 0.2;
  }).length;
  const unmatchedItems = items.filter(item => !item.matched_product_id).length;
  const totalUnits = items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const avgCostPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0;
  const avgMRPPerUnit = totalUnits > 0 ? totalMRP / totalUnits : 0;
  const estimatedStockValue = totalMRP;
  const cashOutflow = grandTotal;
  const breakEvenSales = totalCost / 0.7; // Assuming 30% operating expenses
  const roi = totalCost > 0 ? Math.round(((totalMRP - totalCost) / totalCost) * 100) : 0;

  return (
    <div className="flex gap-6 pb-20">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/approvals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Invoice Review</h1>
            <p className="text-gray-600 mt-1">
              Verify all details before approving
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            {actionLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            Approve & Import
          </button>
        </div>
      </div>

      {/* Invoice Header Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Invoice Number
            </div>
            <div className="text-xl font-bold text-gray-900">
              {purchase.invoice_number}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Invoice Date
            </div>
            <div className="text-xl font-bold text-gray-900">
              {purchase.invoice_date ? new Date(purchase.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Building2 className="w-4 h-4" />
              Supplier
            </div>
            <div className="text-xl font-bold text-gray-900">
              {purchase.vendor_name}
            </div>
            {purchase.vendor_gstin && (
              <div className="text-xs text-gray-600 mt-1">
                GSTIN: {purchase.vendor_gstin}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Package className="w-4 h-4" />
              Total Items
            </div>
            <div className="text-xl font-bold text-gray-900">
              {items.length}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Invoice Items - Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Product Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Batch</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Cost Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">MRP</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Disc%</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">GST%</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Tax Amt</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const itemCost = parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0);
                const itemMRPTotal = parseFloat(item.mrp || 0) * parseFloat(item.quantity || 0);
                const itemProfit = itemMRPTotal - itemCost;
                const itemMargin = itemMRPTotal > 0 ? Math.round((itemProfit / itemMRPTotal) * 100) : 0;
                const matchStatus = item.matched_product_id ? 'text-green-600' : 'text-orange-600';

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-xs text-gray-600">
                        SKU: {item.product_code} | {item.brand} {item.potency && `- ${item.potency}`}
                      </div>
                      <div className="text-xs text-gray-600">{item.size} {item.form}</div>
                      {!item.matched_product_id && (
                        <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not in database
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.batch_number}
                      {item.expiry_date && (
                        <div className="text-xs text-gray-500">
                          Exp: {new Date(item.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{parseFloat(item.quantity || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{parseFloat(item.mrp || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">{parseFloat(item.discount_percent || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right">{parseFloat(item.tax_percent || 0).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right">₹{parseFloat(item.tax_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      ₹{parseFloat(item.total_amount || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${itemMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {itemMargin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Breakup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-600" />
            GST Breakup (CGST + SGST)
          </h3>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Rate</th>
                <th className="text-right py-2">Taxable</th>
                <th className="text-right py-2">CGST</th>
                <th className="text-right py-2">SGST</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gstBreakup).map(([rate, amounts]) => (
                <tr key={rate} className="border-b">
                  <td className="py-2 font-medium">{rate}</td>
                  <td className="text-right">₹{amounts.taxable.toFixed(2)}</td>
                  <td className="text-right">₹{amounts.cgst.toFixed(2)}</td>
                  <td className="text-right">₹{amounts.sgst.toFixed(2)}</td>
                  <td className="text-right font-semibold">₹{(amounts.cgst + amounts.sgst).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Invoice Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal (Before Tax)</span>
              <span className="font-medium">₹{(totalCost - totalDiscount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Discount</span>
              <span className="font-medium text-orange-600">- ₹{totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total GST</span>
              <span className="font-medium">₹{totalTax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-semibold">Grand Total</span>
              <span className="text-lg font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Cost (Purchase)</span>
                <span className="font-medium">₹{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total MRP Value</span>
                <span className="font-medium">₹{totalMRP.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Estimated Gross Margin
                </span>
                <span className={`font-bold text-lg ${profitPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitPercent}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Potential Profit: ₹{estimatedProfit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>{items.length}</strong> items • 
            <strong className="ml-2">₹{grandTotal.toLocaleString('en-IN')}</strong> total • 
            <strong className="ml-2 text-green-600">{profitPercent}%</strong> margin
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approve & Import
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Smart Insights Sidebar */}
      <div className="w-80 space-y-4 sticky top-4 h-fit">
        {/* Smart Insights Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Smart Insights
          </h3>
          <p className="text-sm text-purple-100 mt-1">AI-powered analysis</p>
        </div>

        {/* Profit Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Profit Analysis
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Margin</span>
              <span className="font-bold text-green-600">{avgMargin}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Profit</span>
              <span className="font-semibold">₹{estimatedProfit.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ROI</span>
              <span className="font-semibold text-blue-600">{roi}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Break-even Sales</span>
              <span className="font-semibold">₹{breakEvenSales.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
          </div>
        </div>

        {/* Item Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Item Insights
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Units</span>
              <span className="font-semibold">{totalUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">High Margin (&gt;40%)</span>
              <span className="font-semibold text-green-600">{highMarginItems} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Margin (&lt;20%)</span>
              <span className="font-semibold text-orange-600">{lowMarginItems} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Not in Database</span>
              <span className="font-semibold text-red-600">{unmatchedItems} items</span>
            </div>
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Stock Value
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Cost/Unit</span>
              <span className="font-semibold">₹{avgCostPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg MRP/Unit</span>
              <span className="font-semibold">₹{avgMRPPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stock Value (MRP)</span>
              <span className="font-semibold">₹{estimatedStockValue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cash Outflow</span>
              <span className="font-semibold text-red-600">₹{cashOutflow.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Recommendations
          </h4>
          <div className="space-y-2 text-xs">
            {unmatchedItems > 0 && (
              <div className="flex items-start gap-2 text-orange-700">
                <span>⚠️</span>
                <span>{unmatchedItems} products not in system. Add them before approval.</span>
              </div>
            )}
            {avgMargin > 50 && (
              <div className="flex items-start gap-2 text-green-700">
                <span>✅</span>
                <span>Excellent margins! Good profitability expected.</span>
              </div>
            )}
            {avgMargin < 30 && (
              <div className="flex items-start gap-2 text-red-700">
                <span>⚠️</span>
                <span>Low overall margin. Review pricing strategy.</span>
              </div>
            )}
            {lowMarginItems > items.length * 0.3 && (
              <div className="flex items-start gap-2 text-amber-700">
                <span>💡</span>
                <span>Many low-margin items. Consider negotiating better prices.</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-blue-700">
              <span>📊</span>
              <span>Expected sales needed: ₹{breakEvenSales.toLocaleString('en-IN', {maximumFractionDigits: 0})} to break-even.</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-50 rounded p-2 text-center">
              <div className="text-blue-600 font-bold text-lg">{items.length}</div>
              <div className="text-blue-700">Products</div>
            </div>
            <div className="bg-green-50 rounded p-2 text-center">
              <div className="text-green-600 font-bold text-lg">{totalUnits}</div>
              <div className="text-green-700">Units</div>
            </div>
            <div className="bg-purple-50 rounded p-2 text-center">
              <div className="text-purple-600 font-bold text-lg">{profitPercent}%</div>
              <div className="text-purple-700">Margin</div>
            </div>
            <div className="bg-orange-50 rounded p-2 text-center">
              <div className="text-orange-600 font-bold text-lg">{roi}%</div>
              <div className="text-orange-700">ROI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
