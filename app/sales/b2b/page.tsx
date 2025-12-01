'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart, Printer, Save, Trash2, Plus, Minus, Search, User, CreditCard,
  Banknote, Receipt, X, Clock, DollarSign, Package, AlertCircle, CheckCircle,
  Scan, Calculator, Percent, IndianRupee, FileText, Users, Home, Building,
  Calendar, MapPin, Phone, Mail, FileCheck, Truck, Stamp
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
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
}

interface BusinessCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  company_name?: string;
  credit_limit?: number;
  payment_terms?: string;
}

export default function B2BBillingPage() {
  const router = useRouter();
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
  
  // Business Customer
  const [selectedCustomer, setSelectedCustomer] = useState<BusinessCustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  
  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET 30');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Subject to [City] jurisdiction.');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEWayBillDialog, setShowEWayBillDialog] = useState(false);
  const [eWayBillData, setEWayBillData] = useState({ transportMode: '1', vehicleNumber: '', distance: '' });


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
  const totalTax = cart.reduce((sum, item) => {
    const itemTaxable = (item.unit_price * item.quantity) - item.discount_amount;
    return sum + (itemTaxable * item.tax_percent / 100);
  }, 0);
  
  const grandTotal = taxableAmount + totalTax;

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Generate invoice number
  useEffect(() => {
    const generateInvoiceNo = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setInvoiceNumber(`B2B-${year}${month}-${random}`);
    };
    generateInvoiceNo();
  }, []);

  // Set due date based on payment terms
  useEffect(() => {
    const days = parseInt(paymentTerms.replace('NET ', '')) || 30;
    const due = new Date();
    due.setDate(due.getDate() + days);
    setDueDate(due.toISOString().split('T')[0]);
  }, [paymentTerms]);

  // Search products with debounce
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

  // Search products
  const searchProducts = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await golangAPI.get(`/api/erp/products`, {
        params: {
          search: query,
          limit: 20,
          is_active: true,
        }
      });
      
      const products = res.data?.data?.items || [];
      setSearchResults(products);
    } catch (error) {
      console.error('Product search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Search business customers
  const searchBusinessCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const res = await golangAPI.get(`/api/erp/customers?type=business&search=${encodeURIComponent(query)}&limit=10`);
      setCustomers(res.data?.data?.items || []);
    } catch (error) {
      console.error('Customer search failed:', error);
    }
  };

  // Add product to cart
  const addToCart = (product: any) => {
    if (product.currentStock <= 0) {
      toast({
        title: 'Out of Stock',
        description: `${product.name} is currently out of stock`,
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.currentStock) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${product.currentStock} units available`,
          variant: 'destructive',
        });
        return;
      }
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const unitPrice = product.sellingPrice || product.mrp || 0;
      const taxPercent = product.taxPercent || 0;
      
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random()}`,
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        batch_no: product.batch_no,
        quantity: 1,
        unit_price: unitPrice,
        mrp: product.mrp || 0,
        discount_percent: 0,
        discount_amount: 0,
        tax_percent: taxPercent,
        taxable_amount: unitPrice,
        tax_amount: (unitPrice * taxPercent) / 100,
        total: unitPrice + ((unitPrice * taxPercent) / 100),
        stock: product.currentStock || 0,
        hsn_code: product.hsnCode || '',
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();

    toast({
      title: 'Added to cart',
      description: product.name,
    });
  };

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    const item = cart.find(i => i.id === itemId);
    
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (newQuantity > item.stock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${item.stock} units available`,
        variant: 'destructive',
      });
      return;
    }

    setCart(cart.map(cartItem => {
      if (cartItem.id === itemId) {
        const taxableAmount = (cartItem.unit_price * newQuantity) - cartItem.discount_amount;
        const taxAmount = (taxableAmount * cartItem.tax_percent) / 100;
        const total = taxableAmount + taxAmount;
        
        return {
          ...cartItem,
          quantity: newQuantity,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          total,
        };
      }
      return cartItem;
    }));
  };

  // Update item discount
  const updateItemDiscount = (itemId: string, discountPercent: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = (item.unit_price * item.quantity * discountPercent) / 100;
        const taxableAmount = (item.unit_price * item.quantity) - discountAmount;
        const taxAmount = (taxableAmount * item.tax_percent) / 100;
        const total = taxableAmount + taxAmount;
        
        return {
          ...item,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          total,
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
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([]);
      setSelectedCustomer(null);
      setBillDiscount(0);
      setNotes('');
    }
  };

  // Process B2B invoice
  const processB2BInvoice = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await golangAPI.post('/api/erp/pos/create-invoice', {
        invoiceType: 'B2B',
        customerName: selectedCustomer?.name || '',
        customerPhone: selectedCustomer?.phone || '',
        customerGstNumber: selectedCustomer?.gstin || '',
        items: cart.map(item => ({
          productId: item.product_id,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          mrp: item.mrp,
          discountPercent: item.discount_percent,
          hsnCode: item.hsn_code || '',
          gstRate: item.tax_percent,
        })),
        billDiscount: billDiscount,
        billDiscountType: 'AMOUNT',
        paymentMethod: 'CREDIT',
        amountPaid: 0,
        notes: notes,
        counterId: 'COUNTER-1',
      });
      
      if (res.data?.success) {
        toast({ title: '✅ B2B Invoice created' });
        setCart([]);
      }
    } catch (error: any) {
      toast({ title: 'Failed', description: error.response?.data?.error, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Print A4 Invoice
  const printA4Invoice = (invoice: any) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>B2B Invoice - ${invoiceNumber}</title>
        <style>
          @media print {
            @page { margin: 20mm; size: A4; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            color: #2563eb;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .detail-box {
            flex: 1;
          }
          .detail-box h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .detail-row {
            margin-bottom: 5px;
          }
          .detail-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .totals {
            margin-left: auto;
            width: 300px;
          }
          .totals table {
            border: 2px solid #333;
          }
          .totals td {
            border: 1px solid #ddd;
          }
          .grand-total {
            font-size: 16px;
            font-weight: bold;
            background-color: #f8f9fa;
          }
          .terms {
            margin-top: 30px;
            font-size: 10px;
            color: #666;
          }
          .terms h4 {
            font-size: 12px;
            margin-bottom: 10px;
          }
          .terms ol {
            margin: 0;
            padding-left: 20px;
          }
          .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 200px;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">YEELO HOMEOPATHY</div>
          <div>Dhunela, Sohna Road, Gurugram</div>
          <div>Phone: +91 8478019973</div>
          <div>Email: medicine@yeelohomeopathy.com</div>
          <div>GSTIN: 06BUAPG3815Q1ZH</div>
        </div>

        <div class="invoice-title text-center">TAX INVOICE</div>

        <div class="invoice-details">
          <div class="detail-box">
            <h3>Invoice Details</h3>
            <div class="detail-row">
              <span class="detail-label">Invoice No:</span>
              ${invoiceNumber}
            </div>
            <div class="detail-row">
              <span class="detail-label">Invoice Date:</span>
              ${invoiceDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              ${dueDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Terms:</span>
              ${paymentTerms}
            </div>
          </div>
          
          <div class="detail-box">
            <h3>Billing To</h3>
            <div class="detail-row">
              <strong>${selectedCustomer?.company_name || selectedCustomer?.name}</strong>
            </div>
            <div class="detail-row">${selectedCustomer?.name}</div>
            <div class="detail-row">${selectedCustomer?.address}</div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span> ${selectedCustomer?.phone}
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span> ${selectedCustomer?.email || 'N/A'}
            </div>
            <div class="detail-row">
              <span class="detail-label">GSTIN:</span> ${selectedCustomer?.gstin || 'N/A'}
            </div>
          </div>
        </div>

        ${shippingAddress ? `
        <div class="detail-box" style="margin-bottom: 20px;">
          <h3>Shipping Address</h3>
          <div>${shippingAddress}</div>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Description</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Taxable Amt</th>
              <th class="text-right">GST</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${item.name}</strong><br>
                  <small>SKU: ${item.sku}</small>
                  ${item.batch_no ? `<br><small>Batch: ${item.batch_no}</small>` : ''}
                </td>
                <td class="text-center">${item.hsn_code || '30049014'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
                <td class="text-right">${item.discount_percent}%</td>
                <td class="text-right">₹${item.taxable_amount.toFixed(2)}</td>
                <td class="text-right">${item.tax_percent}%</td>
                <td class="text-right">₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td><strong>Subtotal:</strong></td>
              <td class="text-right">₹${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Discount:</strong></td>
              <td class="text-right">-₹${totalDiscount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Taxable Amount:</strong></td>
              <td class="text-right">₹${taxableAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Total GST:</strong></td>
              <td class="text-right">₹${totalTax.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <td><strong>GRAND TOTAL:</strong></td>
              <td class="text-right">₹${grandTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${notes ? `
        <div style="margin: 20px 0;">
          <strong>Notes:</strong><br>
          ${notes}
        </div>
        ` : ''}

        <div class="terms">
          <h4>Terms and Conditions</h4>
          <ol>
            ${termsAndConditions.split('\n').map(term => `<li>${term}</li>`).join('')}
          </ol>
        </div>

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Authorized Signatory</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Customer Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">B2B Billing</h1>
              <p className="text-sm text-purple-100">Business Invoice Generation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/pos')}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              POS Billing
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/sales/invoices')}>
              <Receipt className="w-4 h-4 mr-1" />
              Invoices
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Search & Cart */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-auto">
          {/* Invoice Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Invoice Number</Label>
                  <Input value={invoiceNumber} disabled className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Invoice Date</Label>
                  <Input 
                    type="date" 
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NET 15">NET 15</SelectItem>
                      <SelectItem value="NET 30">NET 30</SelectItem>
                      <SelectItem value="NET 45">NET 45</SelectItem>
                      <SelectItem value="NET 60">NET 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Business Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{selectedCustomer.company_name || selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {selectedCustomer.address}
                      </div>
                      <div className="text-sm text-gray-600">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {selectedCustomer.phone}
                      </div>
                      {selectedCustomer.gstin && (
                        <div className="text-sm text-gray-600">
                          <Stamp className="w-3 h-3 inline mr-1" />
                          GSTIN: {selectedCustomer.gstin}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="Search business customer by name/company..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      searchBusinessCustomers(e.target.value);
                    }}
                  />
                  {customers.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-60 overflow-auto">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                            setCustomers([]);
                          }}
                          className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-semibold">{customer.company_name || customer.name}</div>
                          <div className="text-sm text-gray-600">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone} | {customer.gstin || 'No GSTIN'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="🔍 Scan barcode or search product name, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base h-11"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-72 overflow-auto bg-white shadow-lg">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{product.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
                            <Badge variant={product.currentStock > 10 ? 'default' : 'destructive'} className="text-xs ml-2">
                              Stock: {product.currentStock || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-bold text-green-600 text-base">₹{product.sellingPrice || product.mrp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Cart Items ({cart.length})</CardTitle>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="h-8">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-3 pt-0">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Cart is Empty</p>
                  <p className="text-sm mt-1">Add products to create B2B invoice</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="inline-block w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mr-2">
                                {index + 1}
                              </span>
                              <span className="font-semibold text-sm">{item.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">SKU: {item.sku}</span>
                            <span className="ml-2 text-gray-500">Stock: {item.stock}</span>
                            {item.hsn_code && <span className="ml-2 text-gray-500">HSN: {item.hsn_code}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Label className="text-xs text-gray-600">Qty</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="h-7 w-12 text-center p-0 font-semibold"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs text-gray-600">Rate</Label>
                          <div className="text-sm font-semibold mt-1">₹{item.unit_price.toFixed(2)}</div>
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs text-gray-600">Disc %</Label>
                          <Input
                            type="number"
                            value={item.discount_percent}
                            onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="h-7 text-sm mt-1"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="col-span-3 text-right">
                          <Label className="text-xs text-gray-600">Total</Label>
                          <div className="text-base font-bold text-green-600 mt-1">
                            ₹{(item.unit_price * item.quantity - item.discount_amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Invoice Summary */}
        <div className="w-96 bg-white border-l p-4 flex flex-col space-y-4 overflow-auto">
          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea
                placeholder="Enter shipping address (if different from billing)..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="text-sm"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card className="flex-1">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                {itemsDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Item Discounts:</span>
                    <span>-₹{itemsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Bill Discount:</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={billDiscount}
                      onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 h-7 text-right text-sm"
                      placeholder="0"
                    />
                    <Select value={billDiscountType} onValueChange={(v: any) => setBillDiscountType(v)}>
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">₹</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {billDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600 text-xs pl-4">
                    <span>Bill Discount Amount:</span>
                    <span>-₹{billDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Taxable Amount:</span>
                  <span className="font-semibold">₹{taxableAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-blue-600">
                  <span>Total GST:</span>
                  <span className="font-semibold">₹{totalTax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 pt-2 flex justify-between text-lg font-bold">
                <span>GRAND TOTAL:</span>
                <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Credit (B2B)
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Card / UPI
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea
                placeholder="Add invoice notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="text-xs"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-semibold"
              onClick={processB2BInvoice}
              disabled={cart.length === 0 || !selectedCustomer || isProcessing}
            >
              <Printer className="w-5 h-5 mr-2" />
              {isProcessing ? 'Creating Invoice...' : 'Create B2B Invoice'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="h-10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/sales/pos')}
                className="h-10"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                POS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
