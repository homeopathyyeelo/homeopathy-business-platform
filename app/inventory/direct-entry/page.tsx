"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAddManualStock } from "@/lib/hooks/inventory";
import { useProducts } from "@/lib/hooks/products";
import { Loader2, Package, Plus } from "lucide-react";

export default function DirectEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: productsData } = useProducts();
  const products = productsData || [];

  // Simple warehouse fallback
  const warehouses = [
    { id: 1, name: "Main Store" },
    { id: 2, name: "Branch 1" },
    { id: 3, name: "Cold Storage" }
  ];

  const addManualStock = useAddManualStock();

  const [formData, setFormData] = useState({
    product_id: "",
    batch_no: "",
    quantity: 0,
    purchase_rate: 0,
    mrp: 0,
    mfg_date: "",
    exp_date: "",
    warehouse_id: "",
    reason: "",
    notes: "",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.batch_no || !formData.quantity || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await addManualStock.mutateAsync({
        product_id: parseInt(formData.product_id),
        batch_no: formData.batch_no,
        quantity: formData.quantity,
        purchase_rate: formData.purchase_rate || undefined,
        mrp: formData.mrp || undefined,
        mfg_date: formData.mfg_date || undefined,
        exp_date: formData.exp_date || undefined,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : undefined,
        reason: formData.reason,
        notes: formData.notes || undefined,
      });

      toast({
        title: "Success",
        description: "Stock added successfully",
      });

      // Reset form
      setFormData({
        product_id: "",
        batch_no: "",
        quantity: 0,
        purchase_rate: 0,
        mrp: 0,
        mfg_date: "",
        exp_date: "",
        warehouse_id: "",
        reason: "",
        notes: "",
      });

      // Redirect to stock list
      router.push('/inventory/stock');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to add stock",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBatchNo = () => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const batchNo = `MAN-${timestamp}-${random}`;
    setFormData(prev => ({ ...prev, batch_no: batchNo }));
  };

  const reasons = [
    "Opening Stock",
    "Manual Bill",
    "Adjustment",
    "Free Sample",
    "Return",
    "Correction",
    "Damage Recovery",
    "Transfer In",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add Manual Stock</h1>
          <p className="text-muted-foreground">
            Add stock directly without purchase order (batch-wise tracking)
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Entry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => handleInputChange('product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch_no">Batch No *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="batch_no"
                        value={formData.batch_no}
                        onChange={(e) => handleInputChange('batch_no', e.target.value)}
                        placeholder="Enter batch number"
                      />
                      <Button type="button" variant="outline" onClick={generateBatchNo}>
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_rate">Purchase Rate</Label>
                    <Input
                      id="purchase_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_rate}
                      onChange={(e) => handleInputChange('purchase_rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mrp">MRP</Label>
                    <Input
                      id="mrp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => handleInputChange('mrp', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mfg_date">Manufacturing Date</Label>
                    <Input
                      id="mfg_date"
                      type="date"
                      value={formData.mfg_date}
                      onChange={(e) => handleInputChange('mfg_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exp_date">Expiry Date</Label>
                    <Input
                      id="exp_date"
                      type="date"
                      value={formData.exp_date}
                      onChange={(e) => handleInputChange('exp_date', e.target.value)}
                    />
                  </div>
                </div>

                {/* Warehouse and Reason */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_id">Warehouse</Label>
                    <Select
                      value={formData.warehouse_id}
                      onValueChange={(value) => handleInputChange('warehouse_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Main Store</SelectItem>
                        {warehouses.map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => handleInputChange('reason', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || addManualStock.isPending}
                    className="flex-1"
                  >
                    {isLoading || addManualStock.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Stock...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stock
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/inventory/stock')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Entry Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-green-700">✅ Required Fields</h4>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Product selection</li>
                    <li>Batch number</li>
                    <li>Quantity</li>
                    <li>Reason for entry</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-700">📋 Optional Fields</h4>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Purchase rate & MRP</li>
                    <li>Manufacturing & expiry dates</li>
                    <li>Warehouse selection</li>
                    <li>Additional notes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-purple-700">🔄 What Happens</h4>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Stock added to inventory_stock table</li>
                    <li>Transaction recorded in stock_transactions</li>
                    <li>Real-time balance updated</li>
                    <li>Alerts generated if needed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/inventory/stock')}
              >
                <Package className="h-4 w-4 mr-2" />
                View Stock List
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/inventory/transactions')}
              >
                View Transactions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/inventory/alerts/low-stock')}
              >
                Check Low Stock
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
