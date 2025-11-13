'use client';

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductMutations, useProducts, useProductBrands } from "@/lib/hooks/products";
import { authFetch } from '@/lib/api/fetch-utils';

interface LogMessage {
  type: 'progress' | 'log' | 'master' | 'error' | 'complete';
  message: string;
  percentage: number;
  row_number?: number;
  timestamp: string;
  data?: any;
}

export default function ImportExportPage() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMode, setImportMode] = useState<'standard' | 'advanced'>('advanced');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    totalRows?: number;
    inserted?: number;
    updated?: number;
    processTime?: string;
    successRate?: number;
  } | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [finalResults, setFinalResults] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { importProducts } = useProductMutations();
  const { data: products = [] } = useProducts();
  const { data: brands = [] } = useProductBrands();

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValidFile = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidFile) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    if (importMode === 'advanced') {
      await handleAdvancedImport(file);
    } else {
      await handleStandardImport(file);
    }
  };

  const handleStandardImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress(10);
    setImportResults(null);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // Call import API
      const response = await importProducts.mutateAsync(file);

      clearInterval(progressInterval);
      setImportProgress(100);

      // Extract results from API response
      const data = response?.data?.data || response?.data || {};
      const resultData = {
        success: (data.inserted || 0) + (data.updated || 0),
        failed: data.skipped || 0,
        errors: data.errors || [],
        totalRows: data.total_rows || 0,
        inserted: data.inserted || 0,
        updated: data.updated || 0,
        processTime: data.process_time || '',
        successRate: data.success_rate || 0
      };

      setImportResults(resultData as any);

      if (resultData.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${resultData.inserted} products, updated ${resultData.updated} products`
        });
      } else {
        toast({
          title: "Import Completed with Warnings",
          description: `${resultData.failed} products skipped or failed`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      setImportProgress(0);
      const errorMessage = error?.response?.data?.error || error?.message || "Import failed due to server error";
      setImportResults({
        success: 0,
        failed: 1,
        errors: [errorMessage]
      });

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 1000);
    }
  };

  const handleAdvancedImport = async (file: File) => {
    console.log('🚀 Starting import...', file.name);
    setIsImporting(true);
    setProgress(0);
    setLogs([]);
    setFinalResults(null);

    try {
      if (!file) {
        throw new Error('No file selected');
      }

      const formData = new FormData();
      formData.append('file', file);
      if (selectedBrandId) {
        formData.append('brand_id', selectedBrandId);
      }

      console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'bytes');

      // Start SSE connection - use fetch directly for streaming, not authFetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:3005/api/erp/products/import/stream', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      // Read stream
      let streamComplete = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream ended');
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              const msg: LogMessage = data;

              // Update progress
              if (msg.percentage) {
                setProgress(msg.percentage);
              }

              // Add log
              setLogs(prev => [...prev, msg]);

              // Handle completion
              if (msg.type === 'complete' && msg.data) {
                console.log('✅ IMPORT COMPLETE - Setting finalResults:', msg.data);
                console.log('Category wise:', msg.data.category_wise);
                console.log('Brand wise:', msg.data.brand_wise);
                setFinalResults(msg.data);
                streamComplete = true;
                toast({
                  title: "Import Complete!",
                  description: `${msg.data.inserted} inserted, ${msg.data.updated} updated`
                });
              }

              // Handle errors
              if (msg.type === 'error') {
                toast({
                  title: "Import Error",
                  description: msg.message,
                  variant: "destructive"
                });
              }
            } catch (e) {
              console.error('Parse error:', e, 'Line:', line);
            }
          } else if (line.startsWith('event: done')) {
            console.log('✅ Received done event');
            streamComplete = true;
          }
        }
      }
      
      if (!streamComplete) {
        console.warn('Stream ended without complete event');
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const setProgress = (value: number) => {
    setImportProgress(value);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'complete': return '🎉';
      case 'error': return '❌';
      case 'master': return '🔧';
      case 'log': return '📝';
      default: return '•';
    }
  };

  const getLogColor = (message: string) => {
    if (!message) return 'text-gray-700';
    if (message.includes('Created')) return 'text-green-600';
    if (message.includes('Updated')) return 'text-blue-600';
    if (message.includes('category') || message.includes('brand') || message.includes('potency')) return 'text-purple-600';
    if (message.includes('❌') || message.includes('⚠️')) return 'text-red-600';
    return 'text-gray-700';
  };

  const exportProducts = () => {
    // Create CSV content
    const headers = [
      'SKU', 'Name', 'Category', 'Brand', 'Potency',
      'Purchase Price', 'Selling Price', 'MRP', 'HSN Code', 'GST Rate',
      'Stock', 'Description', 'Tags'
    ];

    const csvContent = [
      headers.join(','),
      ...products.map((product: any) => [
        product.sku || '',
        `"${product.name || ''}"`,
        product.category || '',
        product.brand || '',
        product.potency || '',
        product.purchase_price || 0,
        product.unit_price || 0,
        product.mrp || 0,
        product.hsn_code || '',
        product.gst_rate || 0,
        product.stock || 0,
        `"${product.description || ''}"`,
        `"${product.tags?.join(';') || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Started",
      description: "Products are being exported to CSV"
    });
  };

  const downloadTemplate = async () => {
    try {
      // Download template from Go API
      const response = await authFetch('http://localhost:3005/api/erp/products/template');
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Template_File_Medicine_Product_List.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Homeopathy product import template downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import / Export Products</h2>
          <p className="text-gray-600">Bulk operations for product management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={importMode === 'standard' ? 'default' : 'outline'}>Standard</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportMode(importMode === 'standard' ? 'advanced' : 'standard')}
          >
            {importMode === 'standard' ? (
              <><Zap className="w-4 h-4 mr-2" />Switch to Advanced</>
            ) : (
              <>Switch to Standard</>
            )}
          </Button>
          <Badge variant={importMode === 'advanced' ? 'default' : 'outline'}>Advanced</Badge>
        </div>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Products</TabsTrigger>
          <TabsTrigger value="export">Export Products</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Import Products from File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV or Excel file with product data. Make sure to follow the template format.
                  Large files may take several minutes to process.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Brand Selection */}
                <div>
                  <Label htmlFor="brand-select" className="text-sm font-medium">
                    Select Brand <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((brand: any) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedBrandId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Please select a brand before uploading a file
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="file-upload" className="text-sm font-medium">
                    Upload File <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls"
                    disabled={isImporting || !selectedBrandId}
                    className="cursor-pointer mt-2"
                  />
                  {!selectedBrandId && (
                    <p className="text-sm text-red-500 mt-1">
                      Select a brand first
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!selectedBrandId}>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </Button>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {importMode === 'advanced' ? '⚡ Live Import Progress' : 'Importing products'}
                      {importMode === 'advanced' && logs.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Row {logs[logs.length - 1]?.row_number || 0} processing...)
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-blue-600">{Math.round(importProgress)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={importProgress} className="w-full h-3" />
                    {importMode === 'advanced' && importProgress > 0 && importProgress < 100 && (
                      <div className="absolute -top-1 left-0 w-full h-5 pointer-events-none">
                        <div 
                          className="absolute h-5 w-1 bg-blue-500 animate-pulse"
                          style={{ left: `${importProgress}%`, transition: 'left 0.3s ease-out' }}
                        />
                      </div>
                    )}
                  </div>
                  {importMode === 'advanced' && (
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span className="flex items-center gap-1">
                        <span className="animate-spin">🔄</span> Processing row-by-row...
                      </span>
                      <span className="font-medium">{logs.length} events captured</span>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Mode Live Logs */}
              {importMode === 'advanced' && logs.length > 0 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isImporting ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        )}
                        Live Import Logs
                      </div>
                      <span className="text-sm font-normal text-gray-500">
                        {logs.length} events
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] w-full rounded-md border bg-gray-50 p-4">
                      {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <p className="text-sm">Waiting for import to start...</p>
                        </div>
                      ) : (
                        <div className="space-y-1 font-mono text-xs">
                          {logs.filter(log => log && log.message).map((log, index) => (
                            <div 
                              key={index}
                              className={`flex items-start space-x-2 py-1 ${getLogColor(log.message)}`}
                            >
                              <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                              <div className="flex-1">
                                <span className="text-gray-400 mr-2">
                                  [{new Date(log.timestamp).toLocaleTimeString()}]
                                </span>
                                {log.row_number && (
                                  <span className="text-blue-500 mr-2">
                                    [Row {log.row_number}]
                                  </span>
                                )}
                                <span>{log.message}</span>
                              </div>
                            </div>
                          ))}
                          <div ref={logsEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Advanced Mode Final Results */}
              {importMode === 'advanced' && finalResults && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Import Complete - Summary Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-gray-700">{finalResults.total_rows}</div>
                        <div className="text-xs text-gray-500">Total Rows</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600">{finalResults.inserted}</div>
                        <div className="text-xs text-gray-500">Inserted</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{finalResults.updated}</div>
                        <div className="text-xs text-gray-500">Updated</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-red-600">{finalResults.skipped}</div>
                        <div className="text-xs text-gray-500">Skipped</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600">{finalResults.success_rate?.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>

                    {/* Category & Brand Analytics */}
                    {(finalResults.category_wise || finalResults.brand_wise) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {finalResults.category_wise && Object.keys(finalResults.category_wise).length > 0 && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-semibold text-sm mb-3 text-gray-700">📊 Category Wise</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {Object.entries(finalResults.category_wise).map(([category, count]: [string, any]) => (
                                <div key={category} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{category}</span>
                                  <Badge variant="outline" className="font-mono">{count}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {finalResults.brand_wise && Object.keys(finalResults.brand_wise).length > 0 && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="font-semibold text-sm mb-3 text-gray-700">🏢 Brand Wise</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {Object.entries(finalResults.brand_wise).map(([brand, count]: [string, any]) => (
                                <div key={brand} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{brand}</span>
                                  <Badge variant="outline" className="font-mono">{count}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Errors List */}
                    {finalResults.errors && finalResults.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h5 className="font-semibold text-sm mb-2 text-red-800">❌ Validation Errors ({finalResults.errors.length})</h5>
                        <ScrollArea className="h-24">
                          <div className="space-y-1 text-xs text-red-700">
                            {finalResults.errors.slice(0, 10).map((error: string, idx: number) => (
                              <div key={idx}>• {error}</div>
                            ))}
                            {finalResults.errors.length > 10 && (
                              <div className="text-gray-500 italic">...and {finalResults.errors.length - 10} more errors</div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      ⏱️ Process Time: {finalResults.process_time}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Standard Mode Results */}
              {importMode === 'standard' && importResults && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                          Import Results
                        </div>
                        {importResults.successRate !== undefined && (
                          <div className="text-sm font-normal">
                            Success Rate: <span className="font-bold text-green-600">{importResults.successRate.toFixed(1)}%</span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        {importResults.totalRows !== undefined && (
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{importResults.totalRows}</div>
                            <div className="text-xs text-gray-600">Total Rows</div>
                          </div>
                        )}
                        {importResults.inserted !== undefined && (
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{importResults.inserted}</div>
                            <div className="text-xs text-gray-600">Inserted</div>
                          </div>
                        )}
                        {importResults.updated !== undefined && (
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{importResults.updated}</div>
                            <div className="text-xs text-gray-600">Updated</div>
                          </div>
                        )}
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                          <div className="text-xs text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">{importResults.success}</div>
                          <div className="text-xs text-gray-600">Success</div>
                        </div>
                      </div>

                      {importResults.processTime && (
                        <div className="text-sm text-center text-gray-500 mb-3">
                          Processing Time: <span className="font-semibold">{importResults.processTime}</span>
                        </div>
                      )}

                      {importResults.errors && importResults.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg">
                          <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Errors & Warnings ({importResults.errors.length})
                          </h4>
                          <div className="max-h-60 overflow-y-auto">
                            <ul className="space-y-1 text-sm text-red-600">
                              {importResults.errors.slice(0, 20).map((error, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{error}</span>
                                </li>
                              ))}
                              {importResults.errors.length > 20 && (
                                <li className="text-gray-500 italic">
                                  ...and {importResults.errors.length - 20} more errors
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {(!importResults.errors || importResults.errors.length === 0) && importResults.success > 0 && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            All products imported successfully! No errors detected.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Export Products to File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Export all products to CSV format for backup or external use.
                  The file will include all product details and can be imported back later.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <FileSpreadsheet className="w-8 h-8 mb-2 text-green-500" />
                    <h3 className="font-semibold">Current Products</h3>
                    <p className="text-sm text-gray-600 mb-4">{products.length} products</p>
                    <Button onClick={exportProducts} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-8 h-8 mb-2 text-blue-500" />
                    <h3 className="font-semibold">Template</h3>
                    <p className="text-sm text-gray-600 mb-4">For new imports</p>
                    <Button variant="outline" onClick={downloadTemplate} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Upload className="w-8 h-8 mb-2 text-purple-500" />
                    <h3 className="font-semibold">Bulk Update</h3>
                    <p className="text-sm text-gray-600 mb-4">Update existing products</p>
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Updates
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Export Options</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium">Included Fields:</h5>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      <li>SKU, Name, Category</li>
                      <li>Brand, Potency</li>
                      <li>Pricing (Purchase, Selling, MRP)</li>
                      <li>Tax Information (HSN, GST)</li>
                      <li>Stock Levels</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium">Usage Tips:</h5>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      <li>Export before making bulk changes</li>
                      <li>Use template for consistent formatting</li>
                      <li>Validate data before importing</li>
                      <li>Keep backup of original file</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
