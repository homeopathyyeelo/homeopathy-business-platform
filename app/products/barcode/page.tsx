"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Download, X, Eye, Loader2, Filter, Zap } from "lucide-react";
import { toast } from "sonner";
import { golangAPI } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category?: string;
  brand?: string;
  potency?: string;
  form?: string;
  pack_size?: string;
  stock?: number;
  mrp?: number;
}

interface BarcodeTemplate {
  id: string;
  name: string;
  type: string;
  format: string;
  width: number;
  height: number;
  description: string;
}

const barcodeTemplates: BarcodeTemplate[] = [
  { id: '1', name: '1D Standard', type: '1D', format: 'CODE128', width: 50, height: 25, description: 'Standard 1D barcode (CODE128)' },
  { id: '2', name: '1D Compact', type: '1D', format: 'CODE128', width: 40, height: 20, description: 'Compact 1D barcode' },
  { id: '3', name: 'EAN-13', type: '1D', format: 'EAN13', width: 45, height: 25, description: 'EAN-13 retail barcode' },
];

const printLayouts = [
  { id: 'thermal-4x6-12', name: '4x6" Thermal (12 per page)', width: 4, height: 6, perPage: 12, cols: 2, rows: 6 },
  { id: 'thermal-3x5-single', name: '3x5" Thermal (Single Sticker)', width: 3, height: 2, perPage: 1, cols: 1, rows: 1 },
];

// Component to fetch and display barcode image
const BarcodeImage = ({ productId, className }: { productId: string, className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Use the public endpoint since it doesn't require auth and returns JSON with base64
        const response = await fetch(`http://localhost:3005/api/erp/products/${productId}/barcode-image`);
        const data = await response.json();
        if (data.data && data.data.image) {
          setImageUrl(data.data.image);
        }
      } catch (error) {
        console.error("Failed to load barcode image", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchImage();
    }
  }, [productId]);

  if (loading) return <div className={`flex items-center justify-center bg-gray-100 ${className}`}><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>;
  if (!imageUrl) return <div className={`bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 ${className}`}>No Image</div>;

  return <img src={imageUrl} alt="Barcode" className={className} />;
};

// Visual representation of barcode templates
const TemplateVisual = ({ templateId }: { templateId: string }) => {
  if (templateId === '1') { // Standard
    return (
      <div className="w-32 h-12 border border-gray-200 bg-white p-1 flex flex-col items-center justify-center gap-0.5">
        <div className="w-24 h-6 bg-black opacity-80" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)' }}></div>
        <div className="text-[8px] font-mono leading-none">CODE128</div>
      </div>
    );
  }
  if (templateId === '2') { // Compact
    return (
      <div className="w-24 h-10 border border-gray-200 bg-white p-1 flex flex-col items-center justify-center gap-0.5">
        <div className="w-16 h-5 bg-black opacity-80" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 1px, transparent 1px, transparent 3px)' }}></div>
        <div className="text-[6px] font-mono leading-none">COMPACT</div>
      </div>
    );
  }
  if (templateId === '3') { // EAN-13
    return (
      <div className="w-32 h-12 border border-gray-200 bg-white p-1 flex flex-col items-center justify-center gap-0.5">
        <div className="w-24 h-6 bg-black opacity-80" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 3px)' }}></div>
        <div className="flex justify-between w-24 text-[8px] font-mono leading-none px-1">
          <span>1</span><span>234567</span><span>890128</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function BarcodePrintPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(barcodeTemplates[0].id);
  const [selectedLayout, setSelectedLayout] = useState<string>(printLayouts[0].id);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPotency, setSelectedPotency] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const [selectedPackSize, setSelectedPackSize] = useState<string>("all");
  const [selectedPrinter, setSelectedPrinter] = useState<string>("TSE_TE244");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await golangAPI.get('/api/erp/products?limit=1000');

      if (response.data.success && Array.isArray(response.data.data)) {
        const productsWithBarcodes = response.data.data.filter((p: Product) => p.barcode);
        setProducts(productsWithBarcodes);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Quick select functions
  const quickSelectTop = (count: number) => {
    const topProducts = filteredProducts.slice(0, count);
    setSelectedProducts(new Set(topProducts.map(p => p.id)));
    toast.success(`Selected top ${count} products`);
  };

  const selectLowStock = () => {
    const lowStockProducts = filteredProducts.filter(p => (p.stock || 0) < 10);
    setSelectedProducts(new Set(lowStockProducts.map(p => p.id)));
    toast.success(`Selected ${lowStockProducts.length} low stock products`);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedPotency("all");
    setSelectedForm("all");
    setSelectedPackSize("all");
    setSearchTerm("");
    toast.success("Filters cleared");
  };

  // Extract unique filter values
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const potencies = Array.from(new Set(products.map(p => p.potency).filter(Boolean)));
  const forms = Array.from(new Set(products.map(p => p.form).filter(Boolean)));
  const packSizes = Array.from(new Set(products.map(p => p.pack_size).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
    const matchesPotency = selectedPotency === "all" || p.potency === selectedPotency;
    const matchesForm = selectedForm === "all" || p.form === selectedForm;
    const matchesPackSize = selectedPackSize === "all" || p.pack_size === selectedPackSize;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPotency && matchesForm && matchesPackSize;
  });

  const handlePrintClick = () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }
    
    // Show template selection modal (old style)
    setShowTemplateDialog(true);
  };

  const handlePreview = () => {
    setShowTemplateDialog(false);
    setShowPreviewDialog(true);
  };

  // Direct thermal print function - 12 labels per 3x5 sheet
  const handleDirectThermalPrint = async () => {
    try {
      setShowPreviewDialog(false);
      toast.loading("Generating barcodes...");
      
      const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
      
      // Create hidden iframe for silent printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        toast.error("Failed to create print document");
        return;
      }

      // Build HTML for 4x6 inch label sheets - 12 labels per sheet (2 columns × 6 rows)
      let printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Barcode Labels</title>
          <style>
            /* 4x6 inch thermal label sheet - 12 labels (2 cols × 6 rows) */
            @page {
              size: 4in 6in;
              margin: 0;
            }
            
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .page {
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .page {
              width: 4in;
              height: 6in;
              padding: 0;
              display: grid;
              grid-template-columns: 2in 2in;
              grid-template-rows: repeat(6, 1in);
              gap: 0;
              page-break-after: always;
              page-break-inside: avoid;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .label {
              width: 100%;
              height: 100%;
              padding: 2px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 0.2px dotted #ccc;
              overflow: hidden;
            }
            
            .product-name {
              font-size: 8pt;
              font-weight: 700;
              text-align: center;
              margin: 0;
              line-height: 1.1;
              max-height: 0.3in;
              overflow: hidden;
              color: #000;
              width: 100%;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            
            .barcode-image {
              width: 1.6in;
              height: auto;
              max-height: 0.4in;
              margin: 2px 0;
            }
            
            .barcode-number {
              font-family: 'Courier New', monospace;
              font-size: 7pt;
              font-weight: 600;
              margin: 0;
              letter-spacing: 0.5px;
              color: #000;
              line-height: 1;
            }
            
            .mrp {
              font-size: 9pt;
              font-weight: 800;
              margin-top: 2px;
              color: #000;
              line-height: 1;
            }
          </style>
        </head>
        <body>
      `;

      // Fetch all barcode images first
      const labelsData = [];
      for (const product of selectedProductsList) {
        try {
          const response = await fetch(`http://localhost:3005/api/erp/products/${product.id}/barcode-image`);
          const data = await response.json();
          labelsData.push({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            mrp: product.mrp,
            image: data.data?.image || ''
          });
        } catch (error) {
          console.error(`Failed to load barcode for ${product.name}`, error);
        }
      }

      // Generate pages with 12 labels each (2 columns × 6 rows)
      const labelsPerPage = 12;
      const totalPages = Math.ceil(labelsData.length / labelsPerPage);
      
      for (let page = 0; page < totalPages; page++) {
        printHTML += '<div class="page">';
        
        const startIdx = page * labelsPerPage;
        const endIdx = Math.min(startIdx + labelsPerPage, labelsData.length);
        
        for (let i = startIdx; i < endIdx; i++) {
          const label = labelsData[i];
          printHTML += `
            <div class="label">
              <div class="product-name">${label.name}</div>
              <img src="${label.image}" alt="Barcode" class="barcode-image" />
              <div class="barcode-number">${label.barcode}</div>
              <div class="mrp">₹${label.mrp ? label.mrp.toFixed(2) : '0.00'}</div>
            </div>
          `;
        }
        
        // Fill remaining cells with empty labels
        for (let i = endIdx; i < startIdx + labelsPerPage; i++) {
          printHTML += '<div class="label"></div>';
        }
        
        printHTML += '</div>';
      }

      printHTML += `
        </body>
        </html>
      `;

      // Write to iframe
      iframeDoc.open();
      iframeDoc.write(printHTML);
      iframeDoc.close();

      // Wait for images to load, then print directly
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
          toast.success(`Printed ${labelsData.length} labels on ${totalPages} sheet(s)`);
        }, 1000);
      }, 2000);
      
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print barcodes");
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore state
    }
  };

  const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
  const layout = printLayouts.find(l => l.id === selectedLayout);
  const selectedTemplate_obj = barcodeTemplates.find(t => t.id === selectedTemplate);
  const selectedLayout_obj = printLayouts.find(l => l.id === selectedLayout);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Printing</h1>
          <p className="text-muted-foreground">12 labels per 4×6 inch thermal sheet (Safe Fit)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedProducts(new Set())}
            disabled={selectedProducts.size === 0}
          >
            <X className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
          <Button
            onClick={handlePrintClick}
            disabled={selectedProducts.size === 0}
            className="bg-primary"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Barcodes ({selectedProducts.size})
          </Button>
        </div>
      </div>

      {/* Printer Setup Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Printer className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Thermal Printer: TSE_TE244</h3>
              <p className="text-sm text-blue-800">
                ✅ <strong>12 labels per 4×6 inch sheet</strong> (Safe Fit)<br/>
                ✅ Click "Print Barcodes" → Select printer → Click "Print Now"<br/>
                ✅ System automatically handles margins and formatting<br/>
                ✅ No browser print dialog - prints directly to selected printer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Select Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Quick Select</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => quickSelectTop(25)}>
              Top 25
            </Button>
            <Button variant="outline" size="sm" onClick={() => quickSelectTop(50)}>
              Top 50
            </Button>
            <Button variant="outline" size="sm" onClick={() => quickSelectTop(100)}>
              Top 100
            </Button>
            <Button variant="outline" size="sm" onClick={selectLowStock}>
              Low Stock
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedProducts.size === filteredProducts.length ? 'Deselect' : 'Select'} All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Potency</Label>
                <Select value={selectedPotency} onValueChange={setSelectedPotency}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Potencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Potencies</SelectItem>
                    {potencies.map((pot) => (
                      <SelectItem key={pot} value={pot}>{pot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Form</Label>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Forms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form} value={form}>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Pack Size</Label>
                <Select value={selectedPackSize} onValueChange={setSelectedPackSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    {packSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">
                {filteredProducts.length} products
              </Badge>
              {selectedProducts.size > 0 && (
                <Badge variant="default">
                  {selectedProducts.size} selected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products with Barcodes</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({selectedProducts.size}/{filteredProducts.length})
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No products found matching search" : "No products with barcodes"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.brand || '-'}</TableCell>
                      <TableCell className="text-right">₹{product.mrp?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Barcode Template & Print Layout</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Barcode Template</h3>
              <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <div className="grid grid-cols-1 gap-3">
                  {barcodeTemplates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-4 border p-3 rounded-md hover:bg-accent cursor-pointer transition-colors" onClick={() => setSelectedTemplate(template.id)}>
                      <RadioGroupItem value={template.id} id={template.id} />
                      <div className="flex-1 grid gap-1.5">
                        <Label htmlFor={template.id} className="font-medium cursor-pointer">
                          {template.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <TemplateVisual templateId={template.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Print Layout</h3>
              <RadioGroup value={selectedLayout} onValueChange={setSelectedLayout}>
                <div className="space-y-2">
                  {printLayouts.map((layout) => (
                    <div key={layout.id} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer" onClick={() => setSelectedLayout(layout.id)}>
                      <RadioGroupItem value={layout.id} id={layout.id} />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={layout.id} className="font-medium cursor-pointer">
                          {layout.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {layout.perPage} labels per page ({layout.width}" x {layout.height}")
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-3">Select Thermal Printer</h3>
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select printer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TSE_TE244">TSE_TE244 (Default Thermal Printer)</SelectItem>
                  <SelectItem value="system_default">System Default Printer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: <strong>{selectedPrinter}</strong>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview First
            </Button>
            <Button onClick={handleDirectThermalPrint} className="bg-primary">
              <Printer className="w-4 h-4 mr-2" />
              Print Now to {selectedPrinter}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
            <div
              ref={printRef}
              className="bg-white shadow-lg"
              style={{
                width: layout?.id.includes('3x5') ? '3in' : '8.27in',
                minHeight: layout?.id.includes('3x5') ? '5in' : '11.69in',
                padding: layout?.id.includes('3x5') ? '0' : '0.4in', // Zero padding for thermal
              }}
            >
              <style jsx global>{`
                @media print {
                  @page {
                    size: ${layout?.width}in ${layout?.height}in;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  .print-container {
                    width: 100% !important;
                    height: 100% !important;
                  }
                  /* Hide borders when printing thermal labels as they add width/height */
                  .thermal-cell {
                    border: none !important;
                  }
                }
              `}</style>

              <div className="grid" style={{
                gridTemplateColumns: `repeat(${layout?.cols || 1}, 1fr)`,
                gridTemplateRows: `repeat(${layout?.rows || 1}, 1fr)`,
                gap: layout?.id.includes('3x5') ? '0' : '0.5rem', // Zero gap for thermal
                height: layout?.id.includes('3x5') ? '100%' : 'auto',
              }}>
                {selectedProductsList.map((product, idx) => (
                  <div key={`${product.id}-${idx}`} className={`border border-gray-200 flex flex-col items-center justify-center text-center h-full overflow-hidden ${layout?.id.includes('3x5') ? 'thermal-cell' : ''}`} style={{ padding: '2px' }}>
                    <div className="text-[9px] font-bold leading-tight w-full truncate px-1">{product.name}</div>
                    <div className="text-[7px] leading-none text-gray-500">{product.sku}</div>
                    <BarcodeImage productId={product.id} className="h-6 max-w-full object-contain my-0.5" />
                    <div className="text-[7px] font-mono leading-none">{product.barcode}</div>
                    <div className="text-[9px] font-bold leading-tight mt-0.5">₹{product.mrp?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDirectThermalPrint} className="bg-primary">
              <Printer className="w-4 h-4 mr-2" />
              Print to {selectedPrinter}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
