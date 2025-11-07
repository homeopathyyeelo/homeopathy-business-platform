'use client';

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useProductMutations, useProducts } from "@/lib/hooks/products";
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
  const [importMode, setImportMode] = useState<'standard' | 'advanced'>('advanced');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
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
    setIsImporting(true);
    setProgress(0);
    setLogs([]);
    setFinalResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Start SSE connection
      const response = await authFetch('http://localhost:3005/api/erp/products/import/stream', {
        method: 'POST',
        body: formData,
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
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

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
                setFinalResults(msg.data);
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
              console.error('Parse error:', e);
            }
          }
        }
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
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV or Excel files (MAX. 10MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isImporting}
                    />
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
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
                <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import Complete
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Inserted:</span>
                      <span className="ml-2 font-bold text-green-600">{finalResults.inserted}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2 font-bold text-blue-600">{finalResults.updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Skipped:</span>
                      <span className="ml-2 font-bold text-red-600">{finalResults.skipped}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success:</span>
                      <span className="ml-2 font-bold text-green-600">{finalResults.success_rate?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Time: {finalResults.process_time}
                  </div>
                </div>
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
