'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductBatches, useProducts, useBatchMutations } from "@/lib/hooks/products";

interface Batch {
  id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  available_quantity: number;
  remaining_quantity?: number;
  unit_cost: number;
  cost_price?: number;
  selling_price: number;
  mrp: number;
  is_active: boolean;
  is_expired: boolean;
  days_to_expiry: number;
  status?: 'active' | 'expired' | 'low_stock' | 'out_of_stock';
  location?: string;
}

// Helper function to calculate batch status
function getBatchStatus(batch: Batch): string {
  if (batch.status) return batch.status; // Use existing status if available
  
  if (batch.is_expired || batch.days_to_expiry < 0) return 'expired';
  if (!batch.is_active) return 'out_of_stock';
  if (batch.available_quantity === 0) return 'out_of_stock';
  if (batch.available_quantity < 10) return 'low_stock';
  return 'active';
}

export default function BatchesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    product_id: "",
    batch_number: "",
    manufacturing_date: "",
    expiry_date: "",
    quantity: 0,
    cost_price: 0,
    selling_price: 0,
    location: "",
  });

  // Use React Query hooks
  const { data: batches = [], isLoading } = useProductBatches();
  const { data: products = [] } = useProducts();
  const productList: any[] = Array.isArray(products)
    ? products as any[]
    : (Array.isArray((products as any)?.items) ? (products as any).items
      : (Array.isArray((products as any)?.data) ? (products as any).data : []));
  const { create, update } = useBatchMutations();

  // Filter batches based on search term and filters
  const filteredBatches = batches.filter((batch: Batch) => {
    const matchesSearch =
      batch.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProduct = selectedProduct === "all" || batch.product_id === selectedProduct;
    const batchStatus = getBatchStatus(batch);
    const matchesStatus = selectedStatus === "all" || batchStatus === selectedStatus;

    return matchesSearch && matchesProduct && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      batch_number: "",
      manufacturing_date: "",
      expiry_date: "",
      quantity: 0,
      cost_price: 0,
      selling_price: 0,
      location: "",
    });
  };

  const handleAddBatch = async () => {
    if (!formData.product_id || !formData.batch_number || !formData.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast({
        title: "Batch Added",
        description: "Batch has been created successfully"
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive"
      });
    }
  };

  // Calculate stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b: Batch) => getBatchStatus(b) === 'active').length;
  const expiredBatches = batches.filter((b: Batch) => getBatchStatus(b) === 'expired').length;
  const lowStockBatches = batches.filter((b: Batch) => getBatchStatus(b) === 'low_stock').length;
  const totalValue = batches.reduce((sum: number, b: Batch) => {
    const qty = b.available_quantity ?? b.remaining_quantity ?? 0;
    const cost = b.unit_cost ?? b.cost_price ?? 0;
    return sum + (qty * cost);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Batch Management</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Batch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {productList.map((product: any) => (
              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Mfg Date</TableHead>
                <TableHead>Exp Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    Loading batches...
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    No batches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch: Batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.product_name}</TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>
                      {batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'No Expiry'}
                    </TableCell>
                    <TableCell>{batch.quantity}</TableCell>
                    <TableCell>{batch.available_quantity ?? batch.remaining_quantity ?? 0}</TableCell>
                    <TableCell>₹{batch.unit_cost ?? batch.cost_price ?? 0}</TableCell>
                    <TableCell>₹{batch.selling_price}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = getBatchStatus(batch);
                        return (
                          <Badge variant={
                            status === 'active' ? 'default' :
                            status === 'low_stock' ? 'secondary' :
                            status === 'expired' ? 'destructive' : 'outline'
                          }>
                            {status.replace('_', ' ')}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{batch.location || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select value={formData.product_id} onValueChange={(value) => handleSelectChange('product_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productList.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturing_date">Manufacturing Date *</Label>
              <Input
                id="manufacturing_date"
                name="manufacturing_date"
                type="date"
                value={formData.manufacturing_date}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date *</Label>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleNumberChange('quantity', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price</Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => handleNumberChange('cost_price', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => handleNumberChange('selling_price', e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Storage location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBatch}>Add Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
