'use client';

import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useProductMutations, useProducts } from "@/lib/hooks/products";

export default function ImportExportPage() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importProducts } = useProductMutations();
  const { data: products = [] } = useProducts();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await importProducts.mutateAsync(file);

      clearInterval(progressInterval);
      setImportProgress(100);

      // Mock results - in real implementation, this would come from the API
      setImportResults({
        success: Math.floor(Math.random() * 50) + 10,
        failed: Math.floor(Math.random() * 5),
        errors: []
      });

      toast({
        title: "Import Completed",
        description: "Products have been imported successfully"
      });

    } catch (error) {
      setImportResults({
        success: 0,
        failed: 1,
        errors: ["Import failed due to server error"]
      });

      toast({
        title: "Import Failed",
        description: "Failed to import products",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
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

  const downloadTemplate = () => {
    const templateHeaders = [
      'SKU', 'Name', 'Category', 'Brand', 'Potency',
      'Purchase Price', 'Selling Price', 'MRP', 'HSN Code', 'GST Rate',
      'Stock', 'Description', 'Tags'
    ];

    const templateContent = [
      templateHeaders.join(','),
      'ARM-001,"Arnica Montana 200CH","Dilutions","SBL","200CH",45.00,85.00,90.00,30049014,18,100,"Homeopathic dilution for bruising and trauma","trauma;bruising;muscle pain"',
      'BEL-002,"Belladonna 30CH","Dilutions","Dr. Reckeweg","30CH",35.00,65.00,70.00,30049014,18,150,"Homeopathic dilution for fever and inflammation","fever;inflammation;headache"'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Import template has been downloaded"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import / Export Products</h2>
        <p className="text-gray-600">Bulk operations for product management</p>
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
                    <span>Importing products...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              {importResults && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        Import Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                          <div className="text-sm text-gray-600">Imported</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{importResults.success + importResults.failed}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                      </div>

                      {importResults.errors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
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
