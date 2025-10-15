import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scan, Plus, Trash2, Receipt, User, CreditCard, Percent, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BarcodeScanner from './BarcodeScanner';

interface BillingItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
  total: number;
}

const EnhancedBilling = () => {
  const { getAll, create, updateInventory } = useDatabase();
  const { toast } = useToast();
  
  const [customerId, setCustomerId] = useState('');
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const [items, setItems] = useState<BillingItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);

  // Fetch data
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  // Get selected customer details
  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  // Apply customer default discount when customer changes
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.default_discount_percentage) {
      setBillDiscountPercent(selectedCustomer.default_discount_percentage);
    } else {
      setBillDiscountPercent(0);
    }
  }, [selectedCustomer]);

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find((p: any) => 
      p.barcode === barcode || p.product_code === barcode
    );

    if (!product) {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive"
      });
      return;
    }

    // Find available inventory
    const availableStock = inventory.find((inv: any) => 
      inv.product_id === product.id && inv.quantity_in_stock > 0
    );

    if (!availableStock) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      });
      return;
    }

    // Check if item already exists in bill
    const existingItemIndex = items.findIndex(item => 
      item.productId === product.id && item.batchNumber === availableStock.batch_number
    );

    if (existingItemIndex >= 0) {
      // Increase quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = calculateItemTotal(updatedItems[existingItemIndex]);
      setItems(updatedItems);
    } else {
      // Add new item
      const price = customerType === 'retail' 
        ? availableStock.selling_price_retail 
        : availableStock.selling_price_wholesale;

      const newItem: BillingItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        batchNumber: availableStock.batch_number,
        quantity: 1,
        unitPrice: price,
        discountPercent: 0,
        gstPercent: product.gst_percentage || 12,
        total: price
      };

      setItems([...items, newItem]);
    }
  };

  const calculateItemTotal = (item: BillingItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = afterDiscount * (item.gstPercent / 100);
    return afterDiscount + gstAmount;
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, quantity, total: calculateItemTotal({ ...item, quantity }) }
        : item
    );
    setItems(updatedItems);
  };

  const updateItemDiscount = (itemId: string, discountPercent: number) => {
    const updatedItems = items.map(item => 
      item.id === itemId 
        ? { ...item, discountPercent, total: calculateItemTotal({ ...item, discountPercent }) }
        : item
    );
    setItems(updatedItems);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + itemSubtotal;
    }, 0);

    const itemDiscounts = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discountPercent / 100);
      return sum + discountAmount;
    }, 0);

    const afterItemDiscounts = subtotal - itemDiscounts;
    const billDiscountAmount = afterItemDiscounts * (billDiscountPercent / 100);
    const loyaltyDiscount = Math.min(loyaltyPointsUsed, selectedCustomer?.loyalty_points || 0);
    
    const taxableAmount = afterItemDiscounts - billDiscountAmount - loyaltyDiscount;
    
    const gstAmount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscountAmount = itemSubtotal * (item.discountPercent / 100);
      const afterItemDiscount = itemSubtotal - itemDiscountAmount;
      const itemShare = afterItemDiscount / (subtotal - itemDiscounts);
      const allocatedTaxable = taxableAmount * itemShare;
      const itemGst = allocatedTaxable * (item.gstPercent / 100);
      return sum + itemGst;
    }, 0);

    const total = taxableAmount + gstAmount;

    return {
      subtotal: subtotal.toFixed(2),
      itemDiscounts: itemDiscounts.toFixed(2),
      billDiscountAmount: billDiscountAmount.toFixed(2),
      loyaltyDiscount: loyaltyDiscount.toFixed(2),
      totalDiscounts: (itemDiscounts + billDiscountAmount + loyaltyDiscount).toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const processPayment = async () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to the bill",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const totals = calculateTotals();
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice with enhanced data
      const invoice = await create('invoices', {
        invoice_number: invoiceNumber,
        customer_id: customerId || null,
        invoice_date: new Date(),
        subtotal: parseFloat(totals.subtotal),
        discount_amount: parseFloat(totals.totalDiscounts),
        tax_amount: parseFloat(totals.gstAmount),
        total: parseFloat(totals.total),
        payment_status: 'paid',
        payment_method: paymentMethod,
        status: 'completed'
      });

      // Create invoice items
      for (const item of items) {
        await create('invoice_items', {
          invoice_id: invoice.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_percentage: item.discountPercent,
          tax_rate: item.gstPercent,
          total: item.total
        });

        // Update inventory
        await updateInventory(item.productId, item.batchNumber, -item.quantity);
      }

      // Record customer discount usage if applied
      if (selectedCustomer && parseFloat(totals.totalDiscounts) > 0) {
        await create('customer_discount_history', {
          customer_id: selectedCustomer.id,
          invoice_id: invoice.id,
          discount_type: 'bill_discount',
          discount_value: billDiscountPercent,
          discount_amount: parseFloat(totals.billDiscountAmount)
        });
      }

      // Update loyalty points if used
      if (loyaltyPointsUsed > 0 && selectedCustomer) {
        await create('customers', {
          ...selectedCustomer,
          loyalty_points: (selectedCustomer.loyalty_points || 0) - loyaltyPointsUsed
        });
      }

      toast({
        title: "Payment Processed",
        description: `Invoice ${invoiceNumber} created successfully`,
      });

      // Reset form
      setItems([]);
      setCustomerId('');
      setBillDiscountPercent(0);
      setLoyaltyPointsUsed(0);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer Selection */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer & Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customer" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="customer">Select Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Walk-in Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Walk-in Customer</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name} - {customer.phone}
                          {customer.default_discount_percentage > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {customer.default_discount_percentage}% discount
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="customerType">Customer Type</Label>
                  <Select value={customerType} onValueChange={(value: 'retail' | 'wholesale') => setCustomerType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'upi') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-4">
                {selectedCustomer && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-sm text-muted-foreground">Credit Days</Label>
                      <p className="font-medium">{selectedCustomer.credit_days || 0} days</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Credit Limit</Label>
                      <p className="font-medium">₹{selectedCustomer.max_credit_limit || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Outstanding</Label>
                      <p className="font-medium">₹{selectedCustomer.outstanding_balance || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Loyalty Points</Label>
                      <p className="font-medium">{selectedCustomer.loyalty_points || 0} points</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discounts" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="billDiscount">Bill Discount %</Label>
                  <Input
                    id="billDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={billDiscountPercent}
                    onChange={(e) => setBillDiscountPercent(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
                  <div>
                    <Label htmlFor="loyaltyPoints">Use Loyalty Points</Label>
                    <Input
                      id="loyaltyPoints"
                      type="number"
                      min="0"
                      max={selectedCustomer.loyalty_points}
                      value={loyaltyPointsUsed}
                      onChange={(e) => setLoyaltyPointsUsed(Math.min(parseInt(e.target.value) || 0, selectedCustomer.loyalty_points))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: {selectedCustomer.loyalty_points} points
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bill Items</CardTitle>
            <Button onClick={() => setScannerOpen(true)} className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Scan Barcode
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Scan barcode or search products to add items</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Disc%</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.batchNumber}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>₹{item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Summary */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-orange-600">
                <span>Item Discounts:</span>
                <span>-₹{totals.itemDiscounts}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600">
                <span>Bill Discount ({billDiscountPercent}%):</span>
                <span>-₹{totals.billDiscountAmount}</span>
              </div>
              {loyaltyPointsUsed > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Loyalty Points ({loyaltyPointsUsed}):</span>
                  <span>-₹{totals.loyaltyDiscount}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total Discounts:</span>
                <span>-₹{totals.totalDiscounts}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span>₹{totals.taxableAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{totals.gstAmount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{totals.total}</span>
              </div>
            </div>

            <Button 
              onClick={processPayment}
              disabled={items.length === 0 || isProcessing}
              className="w-full"
              size="lg"
            >
              <Receipt className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Process Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </div>
  );
};

export default EnhancedBilling;