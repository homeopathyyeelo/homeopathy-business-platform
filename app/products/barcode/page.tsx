'use client';

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Search, Printer, Download, Barcode as BarcodeIcon,
  Package, Calendar, TrendingUp, QrCode 
} from "lucide-react";
import { golangAPI } from "@/lib/api";
import Barcode from "react-barcode";

interface BarcodeData {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  potency: string;
  form: string;
  brand: string;
  category: string;
  batch_id: string;
  batch_no: string;
  barcode: string;
  barcode_type: string;
  mrp: number;
  exp_date: string;
  quantity: number;
  warehouse: string;
  generated_at: string;
  status: string;
  expiry_status: string;
  created_by: string;
}

export default function BarcodesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeImages, setBarcodeImages] = useState<Record<string, string>>({});
  const [generatingLabels, setGeneratingLabels] = useState(false);
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [labelSize, setLabelSize] = useState("medium");
  const [copies, setCopies] = useState(1);
  const [genProductId, setGenProductId] = useState<string>("");
  const [genBatchId, setGenBatchId] = useState<string>("");
  const [genBatchNo, setGenBatchNo] = useState("");
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [potencyFilter, setPotencyFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");

  // Fetch barcodes with pagination and filters
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['barcodes', page, perPage, searchTerm, categoryFilter, brandFilter, potencyFilter, formFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', perPage.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (brandFilter) params.append('brand', brandFilter);
      if (potencyFilter) params.append('potency', potencyFilter);
      if (formFilter) params.append('form', formFilter);
      
      const res = await golangAPI.get(`/api/erp/products/barcode?${params.toString()}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 0, // Always refetch when dependencies change
  });

  const barcodes: BarcodeData[] = (response && typeof response === 'object' && 'data' in response) ? response.data : [];
  const pagination = (response && typeof response === 'object' && 'pagination' in response) ? response.pagination : { page: 1, limit: 100, total: 0, totalPages: 1 };

  // Fetch products for generation
  const { data: productsResp } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/products');
      return res.data;
    }
  });

  const products: Array<{ id: string; name: string }>
    = Array.isArray(productsResp?.data) ? productsResp.data : (Array.isArray(productsResp) ? productsResp : []);

  // Fetch batches (we will filter by selected product)
  const { data: batchesResp } = useQuery({
    queryKey: ['batches-list'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/products/batches');
      // ensure uniform structure
      return Array.isArray(res.data) ? res : res.data;
    }
  });

  const allBatches: Array<{ id?: string; product_id?: string; batch_no?: string; batch_number?: string }>
    = Array.isArray(batchesResp?.data) ? batchesResp.data : [];

  const batchesForProduct = allBatches.filter((b) => (b.product_id || "") === genProductId);

  // Generate barcode mutation
  const generateMutation = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/products/barcode/generate', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      toast({ title: "Barcode Generated", description: "Barcode has been generated successfully" });
      setIsGenerateDialogOpen(false);
      setGenProductId("");
      setGenBatchId("");
      setGenBatchNo("");
    },
  });

  // Print barcodes mutation
  const printMutation = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/products/barcode/print', payload),
    onSuccess: (data) => {
      toast({ title: "Print Ready", description: "Barcode labels are ready for printing" });
      handlePrint();
    },
  });

  // No need for client-side filtering - backend handles it
  const filteredBarcodes = barcodes;

  // Stats - use pagination total
  const stats = {
    total: pagination.total,
    active: barcodes?.filter((b: BarcodeData) => b.status === 'active').length || 0,
    expiring: barcodes?.filter((b: BarcodeData) => b.expiry_status === 'expiring_soon').length || 0,
    expired: barcodes?.filter((b: BarcodeData) => b.expiry_status === 'expired').length || 0,
    batches: new Set(barcodes?.map((b: BarcodeData) => b.batch_no).filter(Boolean) || []).size,
    products: pagination.total, // Total unique products with barcodes
  };
  
  // Fetch filter options
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/categories');
      return res.data;
    }
  });
  
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/brands');
      return res.data;
    }
  });
  
  const categories = Array.isArray(categoriesData?.data?.categories) ? categoriesData.data.categories : (Array.isArray(categoriesData?.data) ? categoriesData.data : []);
  const brands = Array.isArray(brandsData?.data) ? brandsData.data : [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(filteredBarcodes.map(b => b.id));
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes([...selectedBarcodes, id]);
    } else {
      setSelectedBarcodes(selectedBarcodes.filter(bid => bid !== id));
    }
  };

  // Generate barcode images for selected products
  const generateBarcodeLabels = async () => {
    if (selectedBarcodes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select barcodes to generate labels",
        variant: "destructive"
      });
      return;
    }

    setGeneratingLabels(true);
    try {
      const selectedProducts = barcodes.filter(b => selectedBarcodes.includes(b.id));
      const images: Record<string, string> = {};

      // Fetch barcode images from backend
      for (const product of selectedProducts) {
        try {
          const res = await golangAPI.get(`/api/erp/products/${product.product_id}/barcode-image`);
          if (res.data?.data?.image) {
            images[product.id] = res.data.data.image;
          }
        } catch (err) {
          console.error(`Failed to generate barcode for ${product.product_name}`);
        }
      }

      setBarcodeImages(images);
      toast({
        title: "Success",
        description: `Generated ${Object.keys(images).length} barcode labels`,
      });
      setIsPrintDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate barcode labels:', error);
      toast({
        title: "Error",
        description: "Failed to generate barcode labels",
        variant: "destructive"
      });
    } finally {
      setGeneratingLabels(false);
    }
  };

  const downloadAllBarcodes = () => {
    Object.entries(barcodeImages).forEach(([id, image], index) => {
      const barcode = barcodes.find(b => b.id === id);
      if (barcode) {
        const link = document.createElement('a');
        link.href = image;
        link.download = `barcode-${barcode.sku}-${index + 1}.png`;
        link.click();
      }
    });

    toast({
      title: "Downloaded",
      description: `Downloaded ${Object.keys(barcodeImages).length} barcode images`,
    });
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Barcodes</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; }
          .label { 
            display: inline-block; 
            margin: 10px; 
            padding: 10px; 
            border: 1px solid #ccc;
            text-align: center;
            page-break-inside: avoid;
          }
          .label-small { width: 150px; }
          .label-medium { width: 200px; }
          .label-large { width: 250px; }
          .product-name { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
          .batch-info { font-size: 10px; color: #666; }
          .mrp { font-size: 11px; font-weight: bold; margin-top: 5px; }
          @media print {
            .label { break-inside: avoid; }
          }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handlePrintSelected = () => {
    generateBarcodeLabels();
  };

  const handleRowClick = (barcode: BarcodeData) => {
    router.push(`/products/${barcode.product_id}`);
  };

  const confirmPrint = () => {
    printMutation.mutate({
      barcode_ids: selectedBarcodes,
      label_size: labelSize,
      copies: copies,
    });
    setIsPrintDialogOpen(false);
  };

  const selectedBarcodesData = barcodes.filter(b => selectedBarcodes.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcode Management</h1>
          <p className="text-muted-foreground">Generate and print batch-level barcodes for your homeopathy products</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePrintSelected}
            disabled={selectedBarcodes.length === 0 || generatingLabels}
          >
            <Printer className="h-4 w-4 mr-2" />
            {generatingLabels ? 'Generating...' : `Print Selected (${selectedBarcodes.length})`}
          </Button>
          {Object.keys(barcodeImages).length > 0 && (
            <Button variant="outline" onClick={downloadAllBarcodes}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          )}
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Barcode
          </Button>
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <BarcodeIcon className="h-5 w-5 mr-2" />
            How to Use Barcode Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
                Generate Barcodes
              </h3>
              <p className="text-sm text-blue-800">
                Click <strong>"Generate Barcode"</strong> button → Select product → Choose batch (or enter manually) → Click Generate.
                Each batch gets a unique barcode for tracking.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">2</span>
                Select & Print
              </h3>
              <p className="text-sm text-blue-800">
                Check boxes next to barcodes you want to print → Click <strong>"Print Selected"</strong> → Choose label size (Small/Medium/Large) → Set copies → Print.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">3</span>
                Scan & Track
              </h3>
              <p className="text-sm text-blue-800">
                Use barcode scanner during billing to quickly add products. Track batch-wise inventory, expiry dates, and MRP automatically.
              </p>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Generate barcodes when you receive new stock batches. Print labels and stick them on bottles/boxes for easy scanning during sales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barcodes</CardTitle>
            <BarcodeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <QrCode className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batches</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.batches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.products}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name, SKU, barcode..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to page 1 on search
                  }}
                />
              </div>
            </div>
            
            <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={brandFilter || "all"} onValueChange={(v) => { setBrandFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchTerm || categoryFilter || brandFilter || potencyFilter || formFilter) && (
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
                setBrandFilter("");
                setPotencyFilter("");
                setFormFilter("");
                setPage(1);
              }}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barcodes Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products with Barcodes (Page {pagination.page} of {pagination.totalPages} - Showing {filteredBarcodes.length} of {pagination.total} total)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page:</span>
            <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredBarcodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No barcodes found matching your search" : "No barcodes yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBarcodes.length === filteredBarcodes.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Potency</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch No</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Exp Date</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarcodes.map((barcode: BarcodeData) => (
                  <TableRow 
                    key={barcode.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      // Don't trigger row click if clicking checkbox
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) {
                        return;
                      }
                      handleRowClick(barcode);
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedBarcodes.includes(barcode.id)}
                        onCheckedChange={(checked) => handleSelectBarcode(barcode.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{barcode.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{barcode.sku}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{barcode.potency || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{barcode.form || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{barcode.brand || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{barcode.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{barcode.batch_no}</TableCell>
                    <TableCell className="font-mono text-sm font-bold">{barcode.barcode}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{barcode.barcode_type}</Badge>
                    </TableCell>
                    <TableCell>₹{barcode.mrp?.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={barcode.expiry_status === 'expired' ? 'text-red-600 font-bold' :
                                     barcode.expiry_status === 'expiring_soon' ? 'text-yellow-600 font-bold' : ''}>
                        {barcode.exp_date ? new Date(barcode.exp_date).toLocaleDateString() : '-'}
                        {barcode.expiry_status === 'expired' && <span className="ml-1">⚠️</span>}
                        {barcode.expiry_status === 'expiring_soon' && <span className="ml-1">🔔</span>}
                      </span>
                    </TableCell>
                    <TableCell>{barcode.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{barcode.warehouse}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={barcode.status === 'active' ? 'default' : 'secondary'}>
                        {barcode.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Barcode 
                          value={barcode.barcode} 
                          width={1}
                          height={30}
                          fontSize={8}
                          displayValue={false}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={pagination.page === 1}
                >
                  First
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm px-3">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(pagination.totalPages)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barcode Labels Preview */}
      {Object.keys(barcodeImages).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Barcode Labels ({Object.keys(barcodeImages).length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadAllBarcodes}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(barcodeImages).map(([id, image]) => {
                const barcode = barcodes.find(b => b.id === id);
                if (!barcode) return null;
                return (
                  <div key={id} className="border rounded-lg p-4 text-center bg-white">
                    <div className="text-xs font-semibold mb-2 truncate">
                      {barcode.product_name}
                    </div>
                    <img src={image} alt={`Barcode ${barcode.barcode}`} className="w-full h-auto mb-2" />
                    <div className="text-xs text-muted-foreground">{barcode.barcode}</div>
                    {barcode.mrp > 0 && (
                      <div className="text-sm font-bold mt-1">MRP: ₹{barcode.mrp}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {barcode.potency} | {barcode.form}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Area */}
      <div ref={printRef} style={{ display: 'none' }}>
        {Object.entries(barcodeImages).map(([id, image]) => {
          const barcode = barcodes.find(b => b.id === id);
          if (!barcode) return null;
          return Array.from({ length: copies }).map((_, copyIndex) => (
            <div key={`${id}-${copyIndex}`} className={`label label-${labelSize}`}>
              <div className="product-name">{barcode.product_name}</div>
              <div className="batch-info">
                Potency: {barcode.potency || 'N/A'} | Form: {barcode.form || 'N/A'}
              </div>
              <div className="batch-info">Brand: {barcode.brand || 'N/A'} | Category: {barcode.category || 'N/A'}</div>
              <img src={image} alt={`Barcode ${barcode.barcode}`} style={{ width: '100%', height: 'auto', margin: '10px 0' }} />
              <div className="mrp">MRP: ₹{barcode.mrp?.toFixed(2)}</div>
              <div className="batch-info">SKU: {barcode.sku}</div>
            </div>
          ));
        })}
      </div>

      {/* Generate Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Barcode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={genProductId || "none"}
                onValueChange={(v) => {
                  setGenProductId(v === "none" ? "" : v);
                  setGenBatchId("");
                  setGenBatchNo("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select product</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch (optional)</Label>
              <Select
                value={genBatchId || "manual"}
                onValueChange={(v) => {
                  if (v === "manual") {
                    setGenBatchId("");
                  } else {
                    setGenBatchId(v);
                    setGenBatchNo("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={genProductId ? "Select batch" : "Select product first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter batch manually</SelectItem>
                  {genProductId && batchesForProduct.map((b) => (
                    <SelectItem key={b.id || (b.batch_no || b.batch_number || "")} value={(b.id || "") as string}>
                      {b.batch_no || b.batch_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!genBatchId) && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter batch number"
                    value={genBatchNo}
                    onChange={(e) => setGenBatchNo(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!genProductId) {
                  toast({ title: "Select product", description: "Please select a product", variant: "destructive" });
                  return;
                }
                const payload: any = { product_id: genProductId };
                if (genBatchId) payload.batch_id = genBatchId;
                if (!genBatchId && genBatchNo) payload.batch_no = genBatchNo;
                if (!payload.batch_id && !payload.batch_no) {
                  toast({ title: "Batch required", description: "Select a batch or enter batch number", variant: "destructive" });
                  return;
                }
                generateMutation.mutate(payload);
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Barcode Labels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label Size</Label>
              <Select value={labelSize} onValueChange={setLabelSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (150px)</SelectItem>
                  <SelectItem value="medium">Medium (200px)</SelectItem>
                  <SelectItem value="large">Large (250px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Copies per Barcode</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Total labels: {selectedBarcodes.length} × {copies} = {selectedBarcodes.length * copies}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
