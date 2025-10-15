
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CSVRow {
  ID: string;
  UniqueCode: string;
  'Group/Category': string;
  MedicineName: string;
  'Power/Variant/Salt': string;
  Size: string;
  Price: string;
  Qty: string;
}

const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const { toast } = useToast();

  const sampleCSVData = `ID,UniqueCode,Group/Category,MedicineName,Power/Variant/Salt,Size,Price,Qty
100A11,0614021090,DIL,Acid fluor.,CM,11ml,196,100
100A16,0614021136,DIL,Acidum nitricum,CM,11ml,196,100
100A18,0614021180,DIL,Acidum phosphoricum,CM,11ml,196,100
100A20,0614021225,DIL,Aconitum napellus,CM,11ml,196,100
100A22,0614021270,DIL,Actaea racemosa,CM,11ml,196,100`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      
      setCsvData(data);
      validateCSVData(data);
    };
    reader.readAsText(file);
  };

  const validateCSVData = (data: CSVRow[]) => {
    const results = data.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Required field validations
      if (!row.ID) errors.push('ID is required');
      if (!row.MedicineName) errors.push('Medicine Name is required');
      if (!row.Price || isNaN(parseFloat(row.Price))) errors.push('Valid price is required');
      if (!row.Qty || isNaN(parseInt(row.Qty))) errors.push('Valid quantity is required');

      // Data format validations
      if (row.Price && parseFloat(row.Price) < 0) warnings.push('Price should not be negative');
      if (row.Qty && parseInt(row.Qty) < 0) warnings.push('Quantity should not be negative');

      return {
        rowIndex: index + 1,
        row,
        errors,
        warnings,
        status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid'
      };
    });

    setValidationResults(results);
  };

  const handleImport = async () => {
    setImporting(true);
    const validRows = validationResults.filter(r => r.status !== 'error');
    
    if (validRows.length === 0) {
      toast({
        title: "Error",
        description: "No valid rows to import",
        variant: "destructive",
      });
      setImporting(false);
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // First, ensure categories exist
      const categories = [...new Set(validRows.map(r => r.row['Group/Category']))];
      for (const categoryName of categories) {
        if (categoryName) {
          await supabase
            .from('categories')
            .upsert({ 
              name: categoryName, 
              description: `${categoryName} - Imported category`,
              is_active: true 
            }, { 
              onConflict: 'name' 
            });
        }
      }

      // Get category mappings
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name');
      
      const categoryMap = categoryData?.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {} as Record<string, string>) || {};

      // Import products
      for (const validation of validRows) {
        try {
          const row = validation.row;
          const categoryId = categoryMap[row['Group/Category']];

          const productData = {
            product_code: row.UniqueCode || row.ID,
            name: row.MedicineName,
            description: `${row['Power/Variant/Salt']} - ${row.Size}`,
            category_id: categoryId,
            retail_price: parseFloat(row.Price) || 0,
            purchase_price: parseFloat(row.Price) * 0.7, // Assume 30% margin
            wholesale_price: parseFloat(row.Price) * 0.9, // Assume 10% discount for wholesale
            is_active: true
          };

          const { data, error } = await supabase
            .from('products')
            .upsert(productData, { onConflict: 'product_code' })
            .select();

          if (error) throw error;

          // Create inventory entry
          if (data && data[0]) {
            const inventoryData = {
              product_id: data[0].id,
              warehouse_id: (await supabase.from('warehouses').select('id').limit(1).single()).data?.id,
              quantity_in_stock: parseInt(row.Qty) || 0,
              purchase_price: parseFloat(row.Price) * 0.7,
              selling_price_retail: parseFloat(row.Price),
              selling_price_wholesale: parseFloat(row.Price) * 0.9,
            };

            await supabase
              .from('inventory')
              .upsert(inventoryData, { onConflict: 'product_id,warehouse_id' });
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Row ${validation.rowIndex}: ${error.message}`);
        }
      }

      setImportResults({
        total: validRows.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      });

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} products, ${errorCount} errors`,
      });

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CSV Import</h2>
          <p className="text-muted-foreground">
            Import products and inventory data from CSV files.
          </p>
        </div>
        <Button variant="outline" onClick={downloadSampleCSV}>
          <Download className="h-4 w-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Validate</TabsTrigger>
          <TabsTrigger value="preview">Preview Data</TabsTrigger>
          <TabsTrigger value="results">Import Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file to import product data. Make sure your CSV follows the sample format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
              
              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">{csvData.length} rows</Badge>
                </div>
              )}

              {validationResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Validation Summary</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{validationResults.filter(r => r.status === 'valid').length} Valid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-yellow-500" />
                      <span>{validationResults.filter(r => r.status === 'warning').length} Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{validationResults.filter(r => r.status === 'error').length} Errors</span>
                    </div>
                  </div>
                </div>
              )}

              {csvData.length > 0 && (
                <Button 
                  onClick={handleImport} 
                  disabled={importing || validationResults.filter(r => r.status !== 'error').length === 0}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {validationResults.filter(r => r.status !== 'error').length} Valid Rows
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Review the data before importing</CardDescription>
            </CardHeader>
            <CardContent>
              {validationResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Row</TableHead>
                      <TableHead>Medicine Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map((validation, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {validation.status === 'valid' && <Badge className="bg-green-500">Valid</Badge>}
                          {validation.status === 'warning' && <Badge className="bg-yellow-500">Warning</Badge>}
                          {validation.status === 'error' && <Badge className="bg-red-500">Error</Badge>}
                        </TableCell>
                        <TableCell>{validation.rowIndex}</TableCell>
                        <TableCell>{validation.row.MedicineName}</TableCell>
                        <TableCell>{validation.row['Group/Category']}</TableCell>
                        <TableCell>{validation.row.Price}</TableCell>
                        <TableCell>{validation.row.Qty}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {validation.errors.map((error: string, i: number) => (
                              <div key={i} className="text-red-600 text-sm">{error}</div>
                            ))}
                            {validation.warnings.map((warning: string, i: number) => (
                              <div key={i} className="text-yellow-600 text-sm">{warning}</div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No data to preview. Please upload a CSV file first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>Summary of the last import operation</CardDescription>
            </CardHeader>
            <CardContent>
              {importResults ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{importResults.total}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  </div>
                  
                  {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Error Details:</h4>
                      <div className="space-y-1">
                        {importResults.errorDetails.map((error: string, index: number) => (
                          <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No import results available. Please import a CSV file first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSVImport;
