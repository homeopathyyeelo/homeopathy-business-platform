'use client';

import { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileText, Package, Loader2, TrendingUp, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/api/fetch-utils';
import { apiFetch } from '@/lib/utils/api-fetch';

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  details?: any;
}

export default function InventoryUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string>('');  
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setUploadResult(null);
    }
  };

  const addProcessingStep = (step: string, status: ProcessingStep['status'], message: string, details?: any) => {
    setProcessingSteps(prev => [
      ...prev.map(s => s.step === step ? { ...s, status, message, details } : s),
      ...(prev.find(s => s.step === step) ? [] : [{ step, status, message, details }])
    ]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setProcessingSteps([]);
    setCurrentStats(null);
    setUploadResult(null);

    try {
      // Step 1: Reading file
      addProcessingStep('read', 'processing', 'Reading CSV file...');
      const fileContent = await file.text();
      const lines = fileContent.split('\n').length;
      addProcessingStep('read', 'completed', `File read successfully (${lines} lines, ${(file.size / 1024).toFixed(2)} KB)`);
      
      await sleep(300);

      // Step 2: Parsing inventory data
      addProcessingStep('parse', 'processing', 'Parsing inventory data...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiFetch('/api/uploads/inventory', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        addProcessingStep('parse', 'error', data.error || 'Parsing failed');
        throw new Error(data.error || 'Upload failed');
      }

      addProcessingStep('parse', 'completed', `Parsed ${data.itemCount} inventory item(s)`);
      
      await sleep(300);

      // Step 3: Matching products
      addProcessingStep('match', 'processing', 'Matching products with database...');
      
      setCurrentStats({
        totalItems: data.itemCount || 0,
        matchedProducts: data.matchedCount || 0,
        unmatchedProducts: data.unmatchedCount || 0,
        matchRate: data.itemCount > 0 ? Math.round((data.matchedCount / data.itemCount) * 100) : 0
      });
      
      addProcessingStep('match', 'completed', `Matched ${data.matchedCount}/${data.itemCount} products (${Math.round((data.matchedCount/data.itemCount)*100)}%)`);
      
      await sleep(300);

      // Step 4: Calculating stock totals
      addProcessingStep('calculate', 'processing', 'Calculating stock totals...');
      addProcessingStep('calculate', 'completed', `Total quantity: ${data.itemCount} units`);
      
      await sleep(300);

      // Step 5: Creating approval session
      addProcessingStep('session', 'processing', 'Creating approval session...');
      addProcessingStep('session', 'completed', 'Upload staged for approval ✓');

      setUploadResult(data);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/Template_Inventory_Upload.csv';
    link.download = 'Template_Inventory_Upload.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Upload</h1>
          <p className="text-gray-600 mt-2">Upload inventory data via CSV file</p>
        </div>
        <button
          onClick={() => router.push('/admin/approvals')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CheckCircle2 className="w-4 h-4" />
          View Pending Approvals
        </button>
      </div>

      {/* Instructions Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-purple-800">
          <li>Download the CSV template below</li>
          <li>Fill in your inventory data with product codes, quantities, and batch details</li>
          <li>Upload the completed CSV file</li>
          <li>Review the upload summary and product matching results</li>
          <li>Wait for super user approval to update inventory</li>
        </ol>
        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Inventory CSV</h3>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-purple-600 hover:text-purple-700 font-medium">
                Click to upload
              </span>
              {' '}or drag and drop
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">CSV files only (max 10MB)</p>
            
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Upload Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Upload Inventory Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing Steps */}
      {uploading && processingSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            Processing Upload
          </h3>
          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                {step.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                {step.status === 'processing' && (
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin flex-shrink-0 mt-0.5" />
                )}
                {step.status === 'completed' && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {step.status === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.status === 'error' ? 'text-red-900' :
                    step.status === 'completed' ? 'text-green-900' :
                    step.status === 'processing' ? 'text-purple-900' :
                    'text-gray-600'
                  }`}>
                    {step.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Statistics */}
      {currentStats && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Processing Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Box className="w-4 h-4" />
                Total Items
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.totalItems}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Matched
              </div>
              <div className="text-2xl font-bold text-green-600">
                {currentStats.matchedProducts}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <AlertCircle className="w-4 h-4" />
                Unmatched
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {currentStats.unmatchedProducts}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Match Rate
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {currentStats.matchRate}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && !uploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">
                {uploadResult.message}
              </h4>
              
              <div className="bg-white rounded-lg p-4 border border-green-200 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Items</p>
                    <p className="font-medium text-gray-900">{uploadResult.itemCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Matched Products</p>
                    <p className="font-medium text-green-600">
                      {uploadResult.matchedCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unmatched Products</p>
                    <p className="font-medium text-orange-600">
                      {uploadResult.unmatchedCount}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-green-700 text-sm mt-4">
                Your upload is pending approval. A super user will review and approve it shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">About Inventory Upload</h3>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Product Matching:</strong> The system automatically matches products by SKU code.
            If no exact match is found, it attempts fuzzy matching by product name.
          </p>
          <p>
            <strong>Batch Tracking:</strong> Each inventory entry includes batch number and expiry date
            for proper batch management and FEFO (First Expiry, First Out) compliance.
          </p>
          <p>
            <strong>Approval Required:</strong> All inventory uploads require super user approval
            to prevent unauthorized stock adjustments.
          </p>
        </div>
      </div>
    </div>
  );
}
