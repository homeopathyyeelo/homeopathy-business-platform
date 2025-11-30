'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShoppingCart, Printer, Save, Trash2, Plus, Minus, Search, User, CreditCard,
  Banknote, Receipt, X, Clock, Package, AlertCircle, CheckCircle,
  Scan, Calculator, Percent, IndianRupee, FileText, Sparkles, FileCheck, Truck, List
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  batch_id?: string;
  batch_no?: string;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  taxable_amount: number;
  tax_amount: number;
  total: number;
  stock: number;
  hsn_code?: string;
  gst_rate?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export default function POSPage() {
  const { toast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Cart & Billing
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'amount'>('amount');
  
  // Product Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Batch Selection
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  
  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Invoice
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  // Hold Bills
  const [showHeldBillsDialog, setShowHeldBillsDialog] = useState(false);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  
  // E-Invoice
  const [showEInvoiceDialog, setShowEInvoiceDialog] = useState(false);
  const [eInvoiceData, setEInvoiceData] = useState<any>(null);
  
  // AI Assistant
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
  
  let billDiscountAmount = 0;
  if (billDiscountType === 'percent') {
    billDiscountAmount = (subtotal - itemsDiscount) * (billDiscount / 100);
  } else {
    billDiscountAmount = billDiscount;
  }
  
  const totalDiscount = itemsDiscount + billDiscountAmount;
  const taxableAmount = subtotal - totalDiscount;
  
  // Calculate GST by rate
  const gst5Items = cart.filter(item => (item.gst_rate || item.tax_percent) === 5);
  const gst18Items = cart.filter(item => (item.gst_rate || item.tax_percent) === 18);
  
  const gst5Taxable = gst5Items.reduce((sum, item) => {
    const itemTaxable = (item.unit_price * item.quantity) - item.discount_amount;
    return sum + itemTaxable;
  }, 0);
  
  const gst18Taxable = gst18Items.reduce((sum, item) => {
    const itemTaxable = (item.unit_price * item.quantity) - item.discount_amount;
    return sum + itemTaxable;
  }, 0);
  
  const gst5Amount = gst5Taxable * 0.05;
  const gst18Amount = gst18Taxable * 0.18;
  const totalTax = gst5Amount + gst18Amount;
  
  const grandTotal = taxableAmount + totalTax;
  const changeAmount = parseFloat(amountPaid || '0') - grandTotal;

  // Search products
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchProducts = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await golangAPI.get(`/api/erp/pos/search-products`, {
        params: { q: query },
      });
      setSearchResults(res.data?.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select product (show batch dialog)
  const selectProduct = async (product: any) => {
    if (product.batches && product.batches.length > 0) {
      setSelectedProduct(product);
      setAvailableBatches(product.batches);
      setShowBatchDialog(true);
    } else {
      // No batches, add directly
      addToCart(product, null);
    }
  };

  // Add to cart
  const addToCart = (product: any, batch: any) => {
    const gstRate = product.gstRate || product.tax_percent || 5;
    const unitPrice = batch?.sellingPrice || product.mrp || 0;
    
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      product_id: product.id,
      name: product.name,
      sku: product.sku || '',
      batch_id: batch?.id,
      batch_no: batch?.batchNumber || '',
      quantity: 1,
      unit_price: unitPrice,
      mrp: product.mrp || 0,
      discount_percent: 0,
      discount_amount: 0,
      tax_percent: gstRate,
      taxable_amount: unitPrice,
      tax_amount: unitPrice * (gstRate / 100),
      total: unitPrice * (1 + gstRate / 100),
      stock: batch?.availableQuantity || product.stock || 0,
      hsn_code: product.hsnCode || '',
      gst_rate: gstRate,
    };
    
    setCart([...cart, newItem]);
    setShowBatchDialog(false);
    setSearchQuery('');
    setSearchResults([]);
    
    toast({
      title: 'Added to cart',
      description: `${product.name} x1`,
    });
  };

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const taxableAmount = (item.unit_price * newQuantity) - item.discount_amount;
        const taxAmount = taxableAmount * (item.tax_percent / 100);
        return {
          ...item,
          quantity: newQuantity,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          total: taxableAmount + taxAmount,
        };
      }
      return item;
    }));
  };

  // Update discount
  const updateItemDiscount = (itemId: string, discountPercent: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = (item.unit_price * item.quantity) * (discountPercent / 100);
        const taxableAmount = (item.unit_price * item.quantity) - discountAmount;
        const taxAmount = taxableAmount * (item.tax_percent / 100);
        return {
          ...item,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          total: taxableAmount + taxAmount,
        };
      }
      return item;
    }));
  };

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear all items?')) {
      setCart([]);
      setBillDiscount(0);
      setNotes('');
    }
  };

  // Hold bill
  const holdBill = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    
    try {
      await golangAPI.post('/api/erp/pos/hold-bill', {
        customerName: selectedCustomer?.name || 'Walk-in',
        billData: { cart, billDiscount, billDiscountType, notes },
        totalAmount: grandTotal,
        itemsCount: cart.length,
        counterId: 'COUNTER-1',
      });
      
      toast({ title: '✅ Bill held successfully' });
      setCart([]);
    } catch (error) {
      toast({ title: 'Failed to hold bill', variant: 'destructive' });
    }
  };

  // Get held bills
  const fetchHeldBills = async () => {
    try {
      const res = await golangAPI.get('/api/erp/pos/held-bills');
      setHeldBills(res.data?.data || []);
      setShowHeldBillsDialog(true);
    } catch (error) {
      toast({ title: 'Failed to fetch held bills', variant: 'destructive' });
    }
  };

  // Resume bill
  const resumeBill = (bill: any) => {
    const billData = typeof bill.billData === 'string' ? JSON.parse(bill.billData) : bill.billData;
    setCart(billData.cart || []);
    setBillDiscount(billData.billDiscount || 0);
    setNotes(billData.notes || '');
    setShowHeldBillsDialog(false);
    toast({ title: 'Bill resumed' });
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await golangAPI.post('/api/erp/pos/create-invoice', {
        invoiceType: 'RETAIL',
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || '',
        items: cart.map(item => ({
          productId: item.product_id,
          productName: item.name,
          sku: item.sku,
          batchId: item.batch_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          mrp: item.mrp,
          discountPercent: item.discount_percent,
          hsnCode: item.hsn_code || '',
          gstRate: item.gst_rate || item.tax_percent,
        })),
        billDiscount: billDiscount,
        billDiscountType: billDiscountType === 'percent' ? 'PERCENT' : 'AMOUNT',
        paymentMethod: paymentMethod.toUpperCase(),
        amountPaid: parseFloat(amountPaid || '0'),
        notes: notes,
        counterId: 'COUNTER-1',
        counterName: 'Main Counter',
      });
      
      if (res.data?.success) {
        const invoice = res.data.data.invoice;
        setLastCreatedInvoice(invoice);
        
        toast({
          title: '✅ Invoice Created',
          description: `Invoice No: ${invoice.invoiceNo}`,
        });
        
        setCart([]);
        setShowPaymentDialog(false);
        setShowInvoiceDialog(true);
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.response?.data?.error || 'Invoice creation failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate E-Invoice
  const generateEInvoice = async (invoiceId: string) => {
    try {
      const res = await golangAPI.post('/api/erp/einvoice/generate', {
        invoiceId: invoiceId,
      });
      
      if (res.data?.success) {
        setEInvoiceData(res.data.data);
        setShowEInvoiceDialog(true);
      }
    } catch (error) {
      toast({ title: 'E-Invoice generation failed', variant: 'destructive' });
    }
  };

  // AI Assistant
  const askAI = async () => {
    if (!aiQuery) return;
    
    setAiLoading(true);
    try {
      const res = await golangAPI.post('/api/ai/billing-assistant', {
        query: aiQuery,
        context: {
          cart: cart,
          total: grandTotal,
          customer: selectedCustomer,
        },
      });
      
      setAiResponse(res.data?.response || 'No response');
    } catch (error) {
      setAiResponse('AI assistant is currently unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Point of Sale</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchHeldBills}>
                  <List className="h-4 w-4 mr-2" />
                  Held Bills
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAIDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products (name, SKU, barcode)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-[400px] overflow-y-auto border rounded-md">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => selectProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sku} • {product.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{product.mrp}</p>
                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart & Checkout */}
      <Card className="w-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.batch_no && `Batch: ${item.batch_no} • `}
                            GST: {item.gst_rate || item.tax_percent}%
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium">₹{item.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
              <span className="text-red-600">-₹{totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST 5%:</span>
              <span>₹{gst5Amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST 18%:</span>
              <span>₹{gst18Amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setShowPaymentDialog(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={cart.length === 0}
              onClick={holdBill}
            >
              <Clock className="mr-2 h-4 w-4" />
              Hold Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Selection Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Batch - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {availableBatches.map((batch) => (
              <Card
                key={batch.id}
                className="p-3 cursor-pointer hover:bg-accent"
                onClick={() => addToCart(selectedProduct, batch)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Batch: {batch.batchNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {batch.availableQuantity} • MRP: ₹{batch.mrp}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {batch.daysToExpiry > 180 ? 'Fresh' : 'Expiring Soon'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment - ₹{grandTotal.toFixed(2)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            <div>
              <Label>Amount Paid</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
              {changeAmount > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ₹{changeAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={processPayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✅ Invoice Created Successfully</DialogTitle>
          </DialogHeader>
          {lastCreatedInvoice && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-600">
                  {lastCreatedInvoice.invoiceNo}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Amount: ₹{lastCreatedInvoice.grandTotal?.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => generateEInvoice(lastCreatedInvoice.id)}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Generate E-Invoice
                </Button>
                <Button className="flex-1" variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Billing Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ask anything... (e.g., What is the margin? Should I apply discount?)"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <Button onClick={askAI} disabled={aiLoading} className="w-full">
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </Button>
            {aiResponse && (
              <Card className="p-4">
                <p className="text-sm">{aiResponse}</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* E-Invoice Dialog */}
      <Dialog open={showEInvoiceDialog} onOpenChange={setShowEInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Invoice Generated</DialogTitle>
          </DialogHeader>
          {eInvoiceData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-sm font-medium">IRN:</p>
                <p className="text-xs break-all">{eInvoiceData.irn}</p>
                <p className="text-sm font-medium mt-2">Ack No:</p>
                <p className="text-xs">{eInvoiceData.ackNo}</p>
              </div>
              {eInvoiceData.qrCode && (
                <div className="flex justify-center">
                  <img src={eInvoiceData.qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Held Bills Dialog */}
      <Dialog open={showHeldBillsDialog} onOpenChange={setShowHeldBillsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Held Bills</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {heldBills.map((bill) => (
              <Card key={bill.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{bill.holdNo}</p>
                    <p className="text-sm text-muted-foreground">
                      {bill.customerName} • {bill.itemsCount} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{bill.totalAmount?.toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeBill(bill)}
                      className="mt-2"
                    >
                      Resume
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
