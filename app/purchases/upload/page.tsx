'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, FileText, ShoppingCart, Loader2, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  details?: any;
}

export default function PurchaseUploadPage() {
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

      // Step 2: Detecting format
      addProcessingStep('detect', 'processing', 'Detecting file format...');
      const isMargFormat = fileContent.includes('<MARGERP FORMAT>');
      addProcessingStep('detect', 'completed', isMargFormat ? 'Marg ERP format detected ✓' : 'Simple CSV format detected ✓');
      
      await sleep(300);

      // Step 3: Parsing data
      addProcessingStep('parse', 'processing', 'Parsing invoice data...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/uploads/purchase', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        addProcessingStep('parse', 'error', data.error || 'Parsing failed');
        throw new Error(data.error || 'Upload failed');
      }

      addProcessingStep('parse', 'completed', `Parsed ${data.results?.length || 0} invoice(s)`);
      
      await sleep(300);

      // Step 4: Matching products
      addProcessingStep('match', 'processing', 'Matching products with database...');
      const totalItems = data.results?.reduce((sum: number, r: any) => sum + r.itemCount, 0) || 0;
      const matched = data.results?.reduce((sum: number, r: any) => sum + r.matchedCount, 0) || 0;
      const unmatched = data.results?.reduce((sum: number, r: any) => sum + r.unmatchedCount, 0) || 0;
      
      setCurrentStats({
        totalInvoices: data.results?.length || 0,
        totalItems,
        matchedProducts: matched,
        unmatchedProducts: unmatched,
        matchRate: totalItems > 0 ? Math.round((matched / totalItems) * 100) : 0
      });
      
      addProcessingStep('match', 'completed', `Matched ${matched}/${totalItems} products (${Math.round((matched/totalItems)*100)}%)`);
      
      await sleep(300);

      // Step 5: Calculating totals
      addProcessingStep('calculate', 'processing', 'Calculating invoice totals...');
      
      const totalAmount = data.results?.reduce((sum: number, r: any) => {
        return sum + (r.totalAmount || 0);
      }, 0) || 0;
      
      addProcessingStep('calculate', 'completed', `Total amount: ₹${totalAmount.toLocaleString('en-IN')}`);
      
      await sleep(300);

      // Step 6: Creating approval session
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/Template_Purchase_Upload.csv';
    link.download = 'Template_Purchase_Upload.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Upload</h1>
          <p className="text-gray-600 mt-2">Upload purchase invoices via CSV file</p>
        </div>
        <button
          onClick={() => router.push('/purchases/approvals')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CheckCircle2 className="w-4 h-4" />
          View Pending Approvals
        </button>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Download the CSV template below</li>
          <li>Fill in your purchase invoice data following the template format</li>
          <li>Upload the completed CSV file</li>
          <li>Review the upload summary and check for any errors</li>
          <li>Wait for super user approval to complete the import</li>
        </ol>
        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Purchase CSV</h3>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
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
                <ShoppingCart className="w-5 h-5" />
                Upload Purchase Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing Steps */}
      {uploading && processingSteps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Processing Upload
          </h3>
          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                {step.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                {step.status === 'processing' && (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
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
                    step.status === 'processing' ? 'text-blue-900' :
                    'text-gray-600'
                  }`}>
                    {step.message}
                  </p>
                  {step.details && (
                    <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Statistics */}
      {currentStats && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Processing Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <FileText className="w-4 h-4" />
                Invoices
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {currentStats.totalInvoices}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Package className="w-4 h-4" />
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
              
              {uploadResult.results && uploadResult.results.length > 0 && (
                <div className="space-y-3 mt-4">
                  {uploadResult.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-green-200"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Invoice Number</p>
                          <p className="font-medium text-gray-900">
                            {result.invoiceNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Items</p>
                          <p className="font-medium text-gray-900">{result.itemCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Matched Products</p>
                          <p className="font-medium text-green-600">
                            {result.matchedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Unmatched Products</p>
                          <p className="font-medium text-orange-600">
                            {result.unmatchedCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-green-700 text-sm mt-4">
                Your upload is pending approval. A super user will review and approve it shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
        <div className="text-center text-gray-500 py-8">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>Your recent uploads will appear here</p>
        </div>
      </div>
    </div>
  );
}
