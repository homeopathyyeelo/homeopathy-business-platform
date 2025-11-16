'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileText, Eye, X, Loader2 } from 'lucide-react';

interface UploadSummary {
  uploadId: string;
  filename: string;
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  fuzzyMatchedCount: number;
  status: string;
  message: string;
}

interface UploadItem {
  id: string;
  rowIndex: number;
  rawSku?: string;
  rawBarcode?: string;
  rawName?: string;
  rawQty: number;
  rawBatchNo?: string;
  rawExpiryDate?: string;
  rawMrp?: number;
  matchedProductId?: string;
  matchedBy?: string;
  matchedScore?: number;
  reviewRequired: boolean;
  productName?: string;
  productSku?: string;
  errorMessage?: string;
}

export default function InventoryUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Only CSV files are allowed');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8080/api/inventory/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();
      setSummary(data);
      
      // Auto-fetch details
      if (data.uploadId) {
        fetchUploadDetails(data.uploadId);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchUploadDetails = async (uploadId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/inventory/uploads/${uploadId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(prev => prev ? { ...prev, ...data.upload } : data.upload);
      }
    } catch (err) {
      console.error('Failed to fetch upload details', err);
    }
  };

  const handleApprove = async () => {
    if (!summary?.uploadId) return;

    const confirmed = confirm('Are you sure you want to approve this upload? Stock will be updated.');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:8080/api/inventory/uploads/${summary.uploadId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Approval failed');
      }

      alert('Upload approved successfully! Stock has been updated.');
      
      // Refresh details
      fetchUploadDetails(summary.uploadId);
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!summary?.uploadId) return;

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await fetch(`http://localhost:8080/api/inventory/uploads/${summary.uploadId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Rejection failed');
      }

      alert('Upload rejected');
      fetchUploadDetails(summary.uploadId);
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Inventory Upload</h1>
        <p className="text-gray-600">
          Upload inventory data via CSV file. The system will automatically match products and prepare data for review.
        </p>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Download the CSV template below</li>
          <li>Fill in your inventory data with product codes, quantities, and batch details</li>
          <li>Upload the completed CSV file</li>
          <li>Review the upload summary and product matching results</li>
          <li>Wait for super user approval to update inventory</li>
        </ol>
        
        <div className="mt-4">
          <a
            href="/templates/inventory_template.csv"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            download
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </a>
        </div>
      </div>

      {/* Upload Section */}
      {!summary && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Inventory CSV</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">CSV files only (max 10MB)</p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Inventory Data
              </>
            )}
          </button>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upload Summary</h2>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              summary.status === 'approved' ? 'bg-green-100 text-green-800' :
              summary.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {summary.status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{summary.totalRows}</div>
              <div className="text-xs text-gray-600">Total Rows</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">{summary.matchedCount}</div>
              <div className="text-xs text-gray-600">Matched</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-700">{summary.fuzzyMatchedCount}</div>
              <div className="text-xs text-gray-600">Fuzzy Matched</div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-700">{summary.unmatchedCount}</div>
              <div className="text-xs text-gray-600">Unmatched</div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{summary.message}</p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              {showReview ? 'Hide' : 'Review'} Items
            </button>

            {summary.status === 'review' && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve (Super User)
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}

            <button
              onClick={() => {
                setSummary(null);
                setItems([]);
                setFile(null);
                setShowReview(false);
              }}
              className="ml-auto px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              New Upload
            </button>
          </div>
        </div>
      )}

      {/* Review Items Table */}
      {showReview && items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Review Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">SKU/Name</th>
                  <th className="p-2 text-left">Matched Product</th>
                  <th className="p-2 text-left">Match Type</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Batch</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b ${
                      item.reviewRequired ? 'bg-yellow-50' : ''
                    } ${!item.matchedProductId ? 'bg-red-50' : ''}`}
                  >
                    <td className="p-2">{item.rowIndex}</td>
                    <td className="p-2">
                      <div className="font-medium">{item.rawSku || item.rawBarcode}</div>
                      <div className="text-xs text-gray-600">{item.rawName}</div>
                    </td>
                    <td className="p-2">
                      {item.productName ? (
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-gray-600">{item.productSku}</div>
                        </div>
                      ) : (
                        <span className="text-red-600 text-xs">No match</span>
                      )}
                    </td>
                    <td className="p-2">
                      {item.matchedBy && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.matchedBy === 'sku' || item.matchedBy === 'barcode' ? 'bg-green-100 text-green-800' :
                          item.matchedBy === 'exact_name' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.matchedBy} {item.matchedScore ? `(${Math.round(item.matchedScore * 100)}%)` : ''}
                        </span>
                      )}
                    </td>
                    <td className="p-2">{item.rawQty}</td>
                    <td className="p-2 text-xs">{item.rawBatchNo}</td>
                    <td className="p-2">
                      {item.reviewRequired ? (
                        <span className="text-yellow-600 text-xs">Review</span>
                      ) : (
                        <span className="text-green-600 text-xs">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
        <h3 className="font-semibold mb-3">About Inventory Upload</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span><strong>Product Matching:</strong> The system automatically matches products by SKU code. If no exact match is found, it attempts fuzzy matching by product name.</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span><strong>Batch Tracking:</strong> Each inventory entry includes batch number and expiry date for proper batch management and FEFO (First Expiry, First Out) compliance.</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span><strong>Approval Required:</strong> All inventory uploads require super user approval to prevent unauthorized stock adjustments.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
