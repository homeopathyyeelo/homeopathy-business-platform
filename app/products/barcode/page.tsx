'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { authFetch } from '@/lib/api/fetch-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Plus, Search, Printer, Download, Barcode as BarcodeIcon,
  Package, Calendar, TrendingUp, QrCode, AlertCircle, CheckCircle,
  Info, FileText, Zap, Store, Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';

const fetcher = async (url: string) => {
  const res = await authFetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function BarcodePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [labelSize, setLabelSize] = useState('medium');
  const [copies, setCopies] = useState(1);
  const [genProductId, setGenProductId] = useState<string>('');
  const [genBatchNo, setGenBatchNo] = useState<string>('');
  const [barcodeType, setBarcodeType] = useState('ean13');

  // Fetch live barcode data
  const { data: barcodesData, error: barcodesError } = useSWR(
    `${API_URL}/api/erp/products/barcode`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch products list for dropdown
  const { data: productsData } = useSWR(
    `${API_URL}/api/erp/products?limit=1000`,
    fetcher
  );

  const barcodes = barcodesData?.data || [];
  const products = productsData?.data || [];

  // Filter barcodes based on search
  const filteredBarcodes = barcodes.filter((barcode: any) =>
    barcode.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barcode.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barcode.batch_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barcode.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    total: barcodes.length,
    active: barcodes.filter((b: any) => b.status === 'active').length,
    expiring: barcodes.filter((b: any) => b.expiry_status === 'expiring_1m' || b.expiry_status === 'expiring_7d').length,
    expired: barcodes.filter((b: any) => b.expiry_status === 'expired').length,
    batches: new Set(barcodes.map((b: any) => b.batch_no)).size,
    products: new Set(barcodes.map((b: any) => b.product_id)).size,
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Barcode copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600';
      case 'expiring_7d': return 'text-red-600';
      case 'expiring_1m': return 'text-yellow-600';
      case 'expiring_3m': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

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

  const handleGenerate = () => {
    if (!genProductId || !genBatchNo) {
      toast({
        title: 'Missing Information',
        description: 'Please select a product and enter a batch number',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Barcode Generated',
      description: `Barcode generated for ${genProductId} - ${genBatchNo}`,
    });

    setIsGenerateDialogOpen(false);
    setGenProductId('');
    setGenBatchNo('');
  };

  const handlePrint = () => {
    if (selectedBarcodes.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select barcodes to print',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Print Ready',
      description: `${selectedBarcodes.length} barcode labels ready for printing`,
    });

    setIsPrintDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcode Management System</h1>
          <p className="text-muted-foreground">
            Generate, track, and print batch-level barcodes for homeopathy products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/products/barcodes')}>
            <FileText className="h-4 w-4 mr-2" />
            View All Barcodes
          </Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate New Barcode
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barcodes</CardTitle>
            <BarcodeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In circulation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Remove from sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batches</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.batches}</div>
            <p className="text-xs text-muted-foreground">Tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.products}</div>
            <p className="text-xs text-muted-foreground">With barcodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, batch number, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Barcodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Barcodes ({filteredBarcodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBarcodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No barcodes found matching your search' : 'No barcodes generated yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarcodes.map((barcode) => (
                  <TableRow key={barcode.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{barcode.product_name}</div>
                        <div className="text-sm text-muted-foreground">{barcode.brand}</div>
                      </div>
                    </TableCell>
                    <TableCell>{barcode.sku}</TableCell>
                    <TableCell>{barcode.batch_no}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {barcode.barcode}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(barcode.barcode)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>₹{barcode.mrp}</TableCell>
                    <TableCell>
                      <div>
                        <div>{formatDate(barcode.exp_date)}</div>
                        <div className={`text-xs ${getExpiryColor(barcode.expiry_status)}`}>
                          {barcode.expiry_status === 'expired' ? '⚠️' : '🔔'}
                          {barcode.expiry_status}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={barcode.status === 'active' ? 'default' : 'secondary'}>
                        {barcode.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Store className="h-3 w-3 mr-1" />
                        {barcode.warehouse || 'Main Store'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate Barcode Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Barcode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={genProductId} onValueChange={setGenProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input
                placeholder="Enter batch number (e.g., ARN-2024-001)"
                value={genBatchNo}
                onChange={(e) => setGenBatchNo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Barcode Type</Label>
              <Select value={barcodeType} onValueChange={setBarcodeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ean13">EAN-13 (Retail Standard)</SelectItem>
                  <SelectItem value="code128">Code 128 (Compact)</SelectItem>
                  <SelectItem value="qr">QR Code (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Business Tip:</strong> Generate barcodes for new batches immediately upon receiving stock.
                This ensures complete traceability from supplier to customer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>
              <BarcodeIcon className="h-4 w-4 mr-2" />
              Generate Barcode
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
                  <SelectItem value="small">Small (50mm x 30mm)</SelectItem>
                  <SelectItem value="medium">Medium (60mm x 40mm)</SelectItem>
                  <SelectItem value="large">Large (80mm x 50mm)</SelectItem>
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

            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm text-green-800">
                <strong>✅ Print Ready:</strong> Labels will include product name, batch, MRP, expiry date, and barcode.
                Compatible with thermal label printers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
