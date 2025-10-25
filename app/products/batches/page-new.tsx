'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { 
  Plus, Search, Edit, Trash2, Package, AlertTriangle, 
  Calendar, TrendingUp, Warehouse, FileText 
} from "lucide-react";
import { golangAPI } from "@/lib/api";

interface Batch {
  id: string;
  product_id: string;
  product_name?: string;
  batch_no: string;
  mfg_date?: string;
  exp_date?: string;
  mrp?: number;
  purchase_rate?: number;
  sale_rate?: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  warehouse_id?: string;
  warehouse_name?: string;
  rack_location?: string;
  supplier_id?: string;
  purchase_invoice_no?: string;
  purchase_date?: string;
  notes?: string;
  is_active: boolean;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
}

export default function BatchesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    batch_no: "",
    mfg_date: "",
    exp_date: "",
    mrp: "",
    purchase_rate: "",
    sale_rate: "",
    quantity: "",
    warehouse_id: "",
    rack_location: "",
    supplier_id: "",
    purchase_invoice_no: "",
    purchase_date: "",
    notes: "",
  });

  // Fetch batches
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/batches');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/products');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/warehouses');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/batches', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast({ title: "Batch Created", description: "Batch has been created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/batches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast({ title: "Batch Updated", description: "Batch has been updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/batches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast({ title: "Batch Deleted", description: "Batch has been deleted successfully" });
    },
  });

  // Filter batches
  const filteredBatches = batches.filter((batch: Batch) => {
    const matchesSearch =
      batch.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batch_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === "all" || batch.warehouse_id === selectedWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  // Calculate stats
  const getStockStatus = (batch: Batch) => {
    const today = new Date();
    const expDate = batch.exp_date ? new Date(batch.exp_date) : null;
    
    if (expDate && expDate < today) return 'EXPIRED';
    if (expDate && expDate < new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)) return 'EXPIRING_SOON';
    if (batch.available_quantity <= 0) return 'OUT_OF_STOCK';
    if (batch.available_quantity < 10) return 'LOW_STOCK';
    return 'NORMAL';
  };

  const stats = {
    total: batches.length,
    active: batches.filter((b: Batch) => b.is_active).length,
    expired: batches.filter((b: Batch) => getStockStatus(b) === 'EXPIRED').length,
    expiring: batches.filter((b: Batch) => getStockStatus(b) === 'EXPIRING_SOON').length,
    lowStock: batches.filter((b: Batch) => getStockStatus(b) === 'LOW_STOCK').length,
    totalValue: batches.reduce((sum: number, b: Batch) => 
      sum + (b.available_quantity * (b.purchase_rate || 0)), 0
    ),
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      product_id: "", batch_no: "", mfg_date: "", exp_date: "",
      mrp: "", purchase_rate: "", sale_rate: "", quantity: "",
      warehouse_id: "", rack_location: "", supplier_id: "",
      purchase_invoice_no: "", purchase_date: "", notes: "",
    });
    setEditingBatchId(null);
  };

  const handleAdd = async () => {
    if (!formData.product_id || !formData.batch_no || !formData.quantity) {
      toast({
        title: "Missing Information",
        description: "Please provide product, batch number, and quantity",
        variant: "destructive"
      });
      return;
    }

    await createMutation.mutateAsync({
      ...formData,
      mrp: parseFloat(formData.mrp) || 0,
      purchase_rate: parseFloat(formData.purchase_rate) || 0,
      sale_rate: parseFloat(formData.sale_rate) || 0,
      quantity: parseInt(formData.quantity) || 0,
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (batch: Batch) => {
    setFormData({
      product_id: batch.product_id,
      batch_no: batch.batch_no,
      mfg_date: batch.mfg_date || "",
      exp_date: batch.exp_date || "",
      mrp: batch.mrp?.toString() || "",
      purchase_rate: batch.purchase_rate?.toString() || "",
      sale_rate: batch.sale_rate?.toString() || "",
      quantity: batch.quantity.toString(),
      warehouse_id: batch.warehouse_id || "",
      rack_location: batch.rack_location || "",
      supplier_id: batch.supplier_id || "",
      purchase_invoice_no: batch.purchase_invoice_no || "",
      purchase_date: batch.purchase_date || "",
      notes: batch.notes || "",
    });
    setEditingBatchId(batch.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingBatchId) return;

    await updateMutation.mutateAsync({
      id: editingBatchId,
      data: {
        ...formData,
        mrp: parseFloat(formData.mrp) || 0,
        purchase_rate: parseFloat(formData.purchase_rate) || 0,
        sale_rate: parseFloat(formData.sale_rate) || 0,
        quantity: parseInt(formData.quantity) || 0,
      }
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string, batchNo: string) => {
    if (!confirm(`Are you sure you want to delete batch "${batchNo}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground">Track inventory batches with expiry & stock levels</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((wh: Warehouse) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches ({filteredBatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No batches found matching your search" : "No batches yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch No</TableHead>
                  <TableHead>Mfg Date</TableHead>
                  <TableHead>Exp Date</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch: Batch) => {
                  const status = getStockStatus(batch);
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.product_name || 'N/A'}</TableCell>
                      <TableCell className="font-mono">{batch.batch_no}</TableCell>
                      <TableCell>{batch.mfg_date ? new Date(batch.mfg_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{batch.exp_date ? new Date(batch.exp_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{batch.quantity}</TableCell>
                      <TableCell className="text-orange-600">{batch.reserved_quantity}</TableCell>
                      <TableCell className="font-bold">{batch.available_quantity}</TableCell>
                      <TableCell>₹{batch.mrp?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>₹{batch.purchase_rate?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.warehouse_name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          status === 'NORMAL' ? 'default' :
                          status === 'LOW_STOCK' ? 'secondary' :
                          status === 'EXPIRING_SOON' ? 'outline' :
                          'destructive'
                        }>
                          {status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(batch.id, batch.batch_no)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_no">Batch Number *</Label>
              <Input id="batch_no" name="batch_no" value={formData.batch_no} onChange={handleInputChange} placeholder="e.g., BATCH-2025-001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mfg_date">Manufacturing Date</Label>
              <Input id="mfg_date" name="mfg_date" type="date" value={formData.mfg_date} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp_date">Expiry Date</Label>
              <Input id="exp_date" name="exp_date" type="date" value={formData.exp_date} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrp">MRP</Label>
              <Input id="mrp" name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_rate">Purchase Rate</Label>
              <Input id="purchase_rate" name="purchase_rate" type="number" step="0.01" value={formData.purchase_rate} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_rate">Sale Rate</Label>
              <Input id="sale_rate" name="sale_rate" type="number" step="0.01" value={formData.sale_rate} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_id">Warehouse</Label>
              <Select value={formData.warehouse_id || "none"} onValueChange={(value) => handleSelectChange('warehouse_id', value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {warehouses.map((wh: Warehouse) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rack_location">Rack Location</Label>
              <Input id="rack_location" name="rack_location" value={formData.rack_location} onChange={handleInputChange} placeholder="e.g., A-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_invoice_no">Purchase Invoice No</Label>
              <Input id="purchase_invoice_no" name="purchase_invoice_no" value={formData.purchase_invoice_no} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input id="purchase_date" name="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          {/* Same form fields as Add Dialog */}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
