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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingCart, Printer, Save, Trash2, Plus, Minus, Search, User, CreditCard,
  Banknote, Receipt, X, Clock, Package, AlertCircle, CheckCircle,
  Scan, Calculator, Percent, IndianRupee, FileText, Sparkles, FileCheck, 
  Truck, List, Building, UserCircle, Store, Stethoscope, RotateCcw, Send,
  Download, Eye, Edit, Copy
} from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import SmartInsights from '@/components/smart-insights/SmartInsights';

// Billing Types
type BillingType = 
  | 'RETAIL' 
  | 'WHOLESALE' 
  | 'DISTRIBUTOR' 
  | 'DOCTOR' 
  | 'RETURN'
  | 'COSMETIC'      // 18% GST items
  | 'NON_GST'       // Zero-rated medicines
  | 'ONLINE_ORDER'  // Online/phone orders
  | 'QUOTATION'     // Estimate only
  | 'HOME_DELIVERY' // Delivery orders
  | 'TOKEN_SALE';   // Quick counter sale

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
  composition?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  customer_type?: string;
  credit_limit?: number;
  outstanding?: number;
}

export default function UniversalPOSPage() {
  const { toast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // BILLING TYPE - Main selector
  const [billingType, setBillingType] = useState<BillingType>('RETAIL');
  
  // Cart & Billing (with localStorage persistence)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'amount'>('amount');
  
  // Customer Outstanding & Credit
  const [customerOutstanding, setCustomerOutstanding] = useState<any[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);
  
  // Load cart from localStorage on mount and set default customer
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    const savedDiscount = localStorage.getItem('pos_discount');
    const savedBillingType = localStorage.getItem('pos_billing_type');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedDiscount) setBillDiscount(parseFloat(savedDiscount));
    if (savedBillingType) setBillingType(savedBillingType as BillingType);
    
    // Auto-select Walk-in Customer for RETAIL billing
    if (!selectedCustomer && (billingType === 'RETAIL' || billingType === 'TOKEN_SALE')) {
      setSelectedCustomer(WALK_IN_CUSTOMER);
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    localStorage.setItem('pos_discount', billDiscount.toString());
    localStorage.setItem('pos_billing_type', billingType);
  }, [cart, billDiscount, billingType]);
  
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
  
  // Walk-in Customer (Default)
  const WALK_IN_CUSTOMER: Customer = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Walk-in Customer',
    phone: '0000000000',
    email: 'walkin@pos.local',
    customer_type: 'RETAIL',
    gstin: undefined,
    address: undefined
  };
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Order/Invoice
  const [orderMode, setOrderMode] = useState<'DIRECT' | 'ORDER_FIRST'>('DIRECT');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  // Hold Bills
  const [showHeldBillsDialog, setShowHeldBillsDialog] = useState(false);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  
  // E-Invoice
  const [showEInvoiceDialog, setShowEInvoiceDialog] = useState(false);
  const [eInvoiceData, setEInvoiceData] = useState<any>(null);
  
  // E-Way Bill
  const [showEWayBillDialog, setShowEWayBillDialog] = useState(false);
  const [eWayBillData, setEWayBillData] = useState({
    transportMode: '1',
    vehicleNumber: '',
    distance: '',
  });
  
  // AI Assistant
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Returns
  const [returnInvoiceNo, setReturnInvoiceNo] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);

  // Dynamic Pricing based on Billing Type
  const getPriceForType = (product: any) => {
    switch (billingType) {
      case 'WHOLESALE':
        return product.wholesalePrice || product.mrp * 0.85;
      case 'DISTRIBUTOR':
        return product.distributorPrice || product.mrp * 0.75;
      case 'DOCTOR':
        return product.doctorPrice || product.mrp * 0.80;
      case 'COSMETIC':
      case 'NON_GST':
      case 'ONLINE_ORDER':
      case 'HOME_DELIVERY':
      case 'QUOTATION':
      case 'TOKEN_SALE':
      default:
        return product.mrp;
    }
  };

  // Dynamic GST based on Billing Type
  const getGSTRateForType = (product: any, type: BillingType) => {
    if (type === 'NON_GST') return 0;
    if (type === 'COSMETIC') return 18;
    return product.gstRate || product.tax_percent || 5;
  };

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
  const gst12Items = cart.filter(item => (item.gst_rate || item.tax_percent) === 12);
  const gst18Items = cart.filter(item => (item.gst_rate || item.tax_percent) === 18);
  
  const calculateGSTForItems = (items: CartItem[], rate: number) => {
    return items.reduce((sum, item) => {
      const itemTaxable = (item.unit_price * item.quantity) - item.discount_amount;
      return sum + itemTaxable;
    }, 0) * (rate / 100);
  };
  
  const gst5Amount = calculateGSTForItems(gst5Items, 5);
  const gst12Amount = calculateGSTForItems(gst12Items, 12);
  const gst18Amount = calculateGSTForItems(gst18Items, 18);
  const totalTax = gst5Amount + gst12Amount + gst18Amount;
  
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

  // Search customers
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const res = await golangAPI.get(`/api/erp/customers`, {
        params: { search: query, limit: 10 },
      });
      setCustomers(res.data?.data?.items || []);
    } catch (error) {
      console.error('Customer search failed:', error);
    }
  };

  // Fetch customer outstanding bills with interest calculation
  const fetchCustomerOutstanding = async (customerId: string) => {
    try {
      const res = await golangAPI.get(`/api/v1/customers/${customerId}/bills`, {
        params: { status: 'pending' },
      });
      
      const pendingBills = res.data?.data || [];
      setCustomerOutstanding(pendingBills);
      
      // Calculate totals and interest
      const CREDIT_DAYS = 7; // Default credit period
      const MONTHLY_INTEREST_RATE = 0.24; // 24% per month
      const DAILY_INTEREST_RATE = MONTHLY_INTEREST_RATE / 30;
      
      let totalDue = 0;
      let overdue = 0;
      let totalInterest = 0;
      
      pendingBills.forEach((bill: any) => {
        const amount = bill.grandTotal || bill.grand_total || 0;
        totalDue += amount;
        
        // Calculate days overdue
        const invoiceDate = new Date(bill.invoiceDate || bill.invoice_date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + CREDIT_DAYS);
        
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue > 0) {
          overdue += amount;
          // Calculate interest: Principal × Daily Rate × Days Overdue
          const interest = amount * DAILY_INTEREST_RATE * daysOverdue;
          totalInterest += interest;
        }
      });
      
      setTotalOutstanding(totalDue);
      setOverdueAmount(overdue);
      setInterestAmount(totalInterest);
      
    } catch (error) {
      console.error('Failed to fetch customer outstanding:', error);
    }
  };
  
  // When customer is selected, fetch their outstanding
  useEffect(() => {
    if (selectedCustomer?.id) {
      fetchCustomerOutstanding(selectedCustomer.id);
    } else {
      setCustomerOutstanding([]);
      setTotalOutstanding(0);
      setOverdueAmount(0);
      setInterestAmount(0);
    }
  }, [selectedCustomer]);

  // Select product (show batch dialog)
  const selectProduct = async (product: any) => {
    if (product.batches && product.batches.length > 0) {
      setSelectedProduct(product);
      setAvailableBatches(product.batches);
      setShowBatchDialog(true);
    } else {
      addToCart(product, null);
    }
  };

  // Add to cart
  const addToCart = (product: any, batch: any) => {
    const gstRate = getGSTRateForType(product, billingType);
    const unitPrice = batch?.sellingPrice || getPriceForType(product);
    
    // Check if EXACT same product+batch+price already in cart
    // Different sizes/batches should be separate items
    const existingItemIndex = cart.findIndex(
      item => item.product_id === product.id && 
               item.batch_id === batch?.id &&
               item.unit_price === unitPrice
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += (billingType === 'RETURN' ? -1 : 1);
      const item = updatedCart[existingItemIndex];
      const qty = item.quantity;
      const taxableAmount = (item.unit_price * Math.abs(qty)) - item.discount_amount;
      const taxAmount = Math.abs(taxableAmount) * (item.tax_percent / 100);
      item.taxable_amount = taxableAmount;
      item.tax_amount = qty < 0 ? -taxAmount : taxAmount;
      item.total = taxableAmount + (qty < 0 ? -taxAmount : taxAmount);
      setCart(updatedCart);
      
      toast({
        title: 'Quantity updated',
        description: `${product.name} x${Math.abs(qty)}`,
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart-${product.id}-${batch?.id || 'nobatch'}-${Date.now()}`,
        product_id: product.id,
        name: product.name,
        sku: product.sku || '',
        batch_id: batch?.id,
        batch_no: batch?.batchNumber || '',
        quantity: billingType === 'RETURN' ? -1 : 1,
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
        composition: product.composition || '',
      };
      
      setCart([...cart, newItem]);
      
      toast({
        title: 'Added to cart',
        description: `${product.name} x${Math.abs(newItem.quantity)}`,
      });
    }
    
    setShowBatchDialog(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const qty = billingType === 'RETURN' ? -Math.abs(newQuantity) : Math.abs(newQuantity);
        const taxableAmount = (item.unit_price * qty) - item.discount_amount;
        const taxAmount = Math.abs(taxableAmount) * (item.tax_percent / 100);
        return {
          ...item,
          quantity: qty,
          taxable_amount: taxableAmount,
          tax_amount: billingType === 'RETURN' ? -taxAmount : taxAmount,
          total: taxableAmount + (billingType === 'RETURN' ? -taxAmount : taxAmount),
        };
      }
      return item;
    }));
  };

  // Update discount
  const updateItemDiscount = (itemId: string, discountPercent: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = (item.unit_price * Math.abs(item.quantity)) * (discountPercent / 100);
        const taxableAmount = (item.unit_price * item.quantity) - (item.quantity < 0 ? -discountAmount : discountAmount);
        const taxAmount = Math.abs(taxableAmount) * (item.tax_percent / 100);
        return {
          ...item,
          discount_percent: discountPercent,
          discount_amount: item.quantity < 0 ? -discountAmount : discountAmount,
          taxable_amount: taxableAmount,
          tax_amount: item.quantity < 0 ? -taxAmount : taxAmount,
          total: taxableAmount + (item.quantity < 0 ? -taxAmount : taxAmount),
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
      // Clear localStorage
      localStorage.removeItem('pos_cart');
      localStorage.removeItem('pos_discount');
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
        billData: { cart, billDiscount, billDiscountType, notes, billingType },
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
    if (billData.billingType) setBillingType(billData.billingType);
    setShowHeldBillsDialog(false);
    toast({ title: 'Bill resumed' });
  };

  // Create Order First (Order → Invoice workflow) - Simplified
  const createOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    
    // For now, just open payment dialog (order created with invoice)
    setShowPaymentDialog(true);
  };

  // Direct Invoice (or Convert Order to Invoice)
  const processPayment = async () => {
    if (cart.length === 0 && !lastCreatedOrder) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    
    // Validate all items have batch_id
    const invalidItems = cart.filter(item => !item.batch_id);
    if (invalidItems.length > 0) {
      toast({ 
        title: 'Invalid Items', 
        description: `${invalidItems.length} items missing batch information`,
        variant: 'destructive' 
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Use Walk-in Customer if no customer selected for retail/token billing
      const effectiveCustomer = selectedCustomer || 
        (['RETAIL', 'TOKEN_SALE'].includes(billingType) ? WALK_IN_CUSTOMER : null);
      
      if (!effectiveCustomer && ['WHOLESALE', 'DISTRIBUTOR', 'DOCTOR'].includes(billingType)) {
        toast({
          title: 'Customer Required',
          description: `Please select a customer for ${billingType} billing`,
          variant: 'destructive'
        });
        return;
      }
      
      const invoiceData: any = {
        invoiceType: billingType,
        customerName: effectiveCustomer?.name || 'Walk-in Customer',
        customerPhone: effectiveCustomer?.phone || '',
        customerId: effectiveCustomer?.id,
        customerGSTIN: effectiveCustomer?.gstin,
        items: cart.map(item => ({
          productId: item.product_id,
          productName: item.name,
          sku: item.sku,
          batchId: item.batch_id,
          quantity: Math.abs(item.quantity),
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
      };
      
      // If order exists, link it
      if (lastCreatedOrder) {
        invoiceData.orderId = lastCreatedOrder.id;
      }
      
      const res = await golangAPI.post('/api/erp/pos/create-invoice', invoiceData);
      
      if (res.data?.success) {
        const invoice = res.data.data.invoice;
        setLastCreatedInvoice(invoice);
        
        toast({
          title: '✅ Invoice Created',
          description: `Invoice No: ${invoice.invoiceNo}`,
        });
        
        setCart([]);
        setBillDiscount(0);
        setNotes('');
        // Clear localStorage
        localStorage.removeItem('pos_cart');
        localStorage.removeItem('pos_discount');
        
        setShowPaymentDialog(false);
        setShowInvoiceDialog(true);
        
        // Auto-generate E-Invoice for B2B (Wholesale/Distributor)
        if (['WHOLESALE', 'DISTRIBUTOR'].includes(billingType) && selectedCustomer?.gstin) {
          setTimeout(() => generateEInvoice(invoice.id), 1000);
        }
        
        // Auto-check E-Way Bill requirement
        if (grandTotal >= 50000) {
          setShowEWayBillDialog(true);
        }
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
        toast({ title: '✅ E-Invoice Generated' });
      }
    } catch (error) {
      toast({ title: 'E-Invoice generation failed', variant: 'destructive' });
    }
  };

  // Generate E-Way Bill
  const generateEWayBill = async () => {
    if (!lastCreatedInvoice) return;
    
    try {
      const res = await golangAPI.post('/api/erp/ewaybill/generate', {
        invoiceId: lastCreatedInvoice.id,
        transportMode: eWayBillData.transportMode,
        vehicleNumber: eWayBillData.vehicleNumber,
        distance: parseFloat(eWayBillData.distance),
      });
      
      if (res.data?.success) {
        toast({ title: '✅ E-Way Bill Generated', description: `EWB No: ${res.data.data.ewaybillNo}` });
        setShowEWayBillDialog(false);
      }
    } catch (error) {
      toast({ title: 'E-Way Bill generation failed', variant: 'destructive' });
    }
  };

  // Process Return
  const processReturn = async () => {
    if (!originalInvoice || cart.length === 0) {
      toast({ title: 'Select items to return', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await golangAPI.post('/api/erp/pos/create-return', {
        originalInvoiceId: originalInvoice.id,
        originalInvoiceNo: originalInvoice.invoiceNo,
        items: cart.map(item => ({
          productId: item.product_id,
          productName: item.name,
          quantity: Math.abs(item.quantity),
          unitPrice: item.unit_price,
          hsnCode: item.hsn_code,
          gstRate: item.gst_rate,
        })),
        reason: notes,
        refundMethod: paymentMethod,
      });
      
      if (res.data?.success) {
        toast({ title: '✅ Return Processed', description: 'Credit note generated' });
        setCart([]);
        setOriginalInvoice(null);
        setReturnInvoiceNo('');
      }
    } catch (error) {
      toast({ title: 'Return failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
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
          billingType: billingType,
        },
      });
      
      setAiResponse(res.data?.response || 'No response');
    } catch (error) {
      setAiResponse('AI assistant is currently unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  // Share via WhatsApp (placeholder)
  const shareViaWhatsApp = () => {
    if (!lastCreatedInvoice) return;
    const phone = selectedCustomer?.phone || '';
    const message = `Your invoice ${lastCreatedInvoice.invoiceNo} for ₹${grandTotal.toFixed(2)} is ready. Thank you for your business!`;
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Left: Product Search & Billing Type */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Billing Type Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Billing Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={billingType} onValueChange={(v) => setBillingType(v as BillingType)}>
              <div className="space-y-2">
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="RETAIL" className="flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    Retail
                  </TabsTrigger>
                  <TabsTrigger value="WHOLESALE" className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Wholesale
                  </TabsTrigger>
                  <TabsTrigger value="DISTRIBUTOR" className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Distributor
                  </TabsTrigger>
                  <TabsTrigger value="DOCTOR" className="flex items-center gap-1">
                    <Stethoscope className="h-4 w-4" />
                    Doctor
                  </TabsTrigger>
                  <TabsTrigger value="COSMETIC" className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Cosmetic
                  </TabsTrigger>
                  <TabsTrigger value="NON_GST" className="flex items-center gap-1">
                    <FileCheck className="h-4 w-4" />
                    Non-GST
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="ONLINE_ORDER" className="flex items-center gap-1">
                    <Send className="h-4 w-4" />
                    Online
                  </TabsTrigger>
                  <TabsTrigger value="HOME_DELIVERY" className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Delivery
                  </TabsTrigger>
                  <TabsTrigger value="QUOTATION" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Quotation
                  </TabsTrigger>
                  <TabsTrigger value="TOKEN_SALE" className="flex items-center gap-1">
                    <Receipt className="h-4 w-4" />
                    Token
                  </TabsTrigger>
                  <TabsTrigger value="RETURN" className="flex items-center gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Return
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
            
            {/* Customer Search */}
            <div className="mt-4 space-y-2">
              <Label>Customer (Optional for Retail)</Label>
              <div className="relative flex gap-2">
                <Input
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setShowCustomerDialog(true)}>
                  <UserCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Customer Suggestions Dropdown */}
              {customers.length > 0 && !selectedCustomer && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch('');
                        setCustomers([]);
                      }}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {customer.phone} {customer.gstin && `• GSTIN: ${customer.gstin}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedCustomer && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedCustomer.name} • {selectedCustomer.phone}
                    {selectedCustomer.gstin && ` • GSTIN: ${selectedCustomer.gstin}`}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Products</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchHeldBills}>
                  <List className="h-4 w-4 mr-2" />
                  Held Bills
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAIDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Help
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products (name, SKU, barcode)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="flex-1 overflow-y-auto border rounded-md">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => selectProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sku} • {product.category}
                        </p>
                        {product.composition && (
                          <p className="text-xs text-muted-foreground mt-1">{product.composition}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">₹{getPriceForType(product).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">MRP: ₹{product.mrp}</p>
                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="mt-1">
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
      <Card className="w-[500px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
              {billingType === 'RETURN' && <Badge variant="destructive">RETURN</Badge>}
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
                            {item.hsn_code && ` • HSN: ${item.hsn_code}`}
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
                            onClick={() => updateQuantity(item.id, Math.abs(item.quantity) - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={Math.abs(item.quantity)}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.abs(item.quantity) + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Disc %"
                            value={item.discount_percent}
                            onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="text-right min-w-[80px]">
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
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span className="text-red-600">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Taxable:</span>
              <span>₹{taxableAmount.toFixed(2)}</span>
            </div>
            {gst5Amount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST 5% (CGST 2.5% + SGST 2.5%):</span>
                <span>₹{gst5Amount.toFixed(2)}</span>
              </div>
            )}
            {gst12Amount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST 12% (CGST 6% + SGST 6%):</span>
                <span>₹{gst12Amount.toFixed(2)}</span>
              </div>
            )}
            {gst18Amount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>GST 18% (CGST 9% + SGST 9%):</span>
                <span>₹{gst18Amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Customer Outstanding Section */}
          {selectedCustomer && totalOutstanding > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Customer Outstanding
                </h3>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Pending:</span>
                  <span className="font-semibold">₹{totalOutstanding.toFixed(2)}</span>
                </div>
                
                {overdueAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Overdue ({">"} 7 days):</span>
                      <span className="font-semibold">₹{overdueAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-red-700">
                      <span>Interest @ 24%/month:</span>
                      <span className="font-semibold">₹{interestAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm font-bold text-red-800 border-t border-red-200 pt-2">
                      <span>Total Due (with interest):</span>
                      <span>₹{(totalOutstanding + interestAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Pending Bills List */}
              {customerOutstanding.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium mb-2">Pending Invoices:</p>
                  <div className="space-y-1">
                    {customerOutstanding.map((bill: any, idx: number) => {
                      const invoiceDate = new Date(bill.invoiceDate || bill.invoice_date);
                      const dueDate = new Date(invoiceDate);
                      dueDate.setDate(dueDate.getDate() + 7);
                      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <div key={idx} className="text-xs bg-white border rounded p-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{bill.invoiceNo || bill.invoice_no}</span>
                            <span className="font-semibold">₹{(bill.grandTotal || bill.grand_total || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground mt-1">
                            <span>Date: {invoiceDate.toLocaleDateString()}</span>
                            {daysOverdue > 0 && (
                              <span className="text-red-600 font-medium">{daysOverdue} days overdue</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bill Discount */}
          <div className="flex gap-2">
            <Select value={billDiscountType} onValueChange={(v: any) => setBillDiscountType(v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">₹</SelectItem>
                <SelectItem value="percent">%</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Bill discount"
              value={billDiscount}
              onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {billingType === 'RETURN' ? (
              <Button
                className="w-full"
                size="lg"
                variant="destructive"
                disabled={cart.length === 0 || isProcessing}
                onClick={processReturn}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Process Return
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    disabled={cart.length === 0 || isProcessing}
                    onClick={createOrder}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                  <Button
                    disabled={cart.length === 0 || isProcessing}
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={cart.length === 0}
                  onClick={holdBill}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Hold Bill
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Selection Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Batch - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableBatches.map((batch) => (
              <Card
                key={batch.id}
                className="p-3 cursor-pointer hover:bg-accent"
                onClick={() => addToCart(selectedProduct, batch)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Batch: {batch.batchNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {batch.availableQuantity} • MRP: ₹{batch.mrp}
                    </p>
                    {batch.expiryDate && (
                      <p className="text-xs text-muted-foreground">
                        Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={batch.daysToExpiry > 180 ? 'default' : 'destructive'}>
                    {batch.daysToExpiry > 365 ? 'Fresh' : `${batch.daysToExpiry}d left`}
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
                  <SelectItem value="credit">Credit</SelectItem>
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
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={processPayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment & Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Success Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Invoice Created Successfully
            </DialogTitle>
          </DialogHeader>
          {lastCreatedInvoice && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-md">
                <p className="text-3xl font-bold text-green-600">
                  {lastCreatedInvoice.invoiceNo}
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  ₹{lastCreatedInvoice.grandTotal?.toFixed(2)}
                </p>
                <Badge className="mt-2">{billingType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => generateEInvoice(lastCreatedInvoice.id)}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  E-Invoice
                </Button>
                <Button variant="outline" onClick={shareViaWhatsApp}>
                  <Send className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Invoice Dialog */}
      <Dialog open={showEInvoiceDialog} onOpenChange={setShowEInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Invoice Generated ✅</DialogTitle>
          </DialogHeader>
          {eInvoiceData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-md space-y-2">
                <div>
                  <p className="text-sm font-medium">IRN:</p>
                  <p className="text-xs break-all font-mono">{eInvoiceData.irn}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ack No:</p>
                  <p className="text-xs">{eInvoiceData.ackNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ack Date:</p>
                  <p className="text-xs">{eInvoiceData.ackDate}</p>
                </div>
              </div>
              {eInvoiceData.qrCode && (
                <div className="flex justify-center">
                  <img src={eInvoiceData.qrCode} alt="QR Code" className="w-48 h-48 border" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Way Bill Dialog */}
      <Dialog open={showEWayBillDialog} onOpenChange={setShowEWayBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate E-Way Bill (&gt;₹50,000)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Transport Mode</Label>
              <Select
                value={eWayBillData.transportMode}
                onValueChange={(v) => setEWayBillData({ ...eWayBillData, transportMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Road</SelectItem>
                  <SelectItem value="2">Rail</SelectItem>
                  <SelectItem value="3">Air</SelectItem>
                  <SelectItem value="4">Ship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Number</Label>
              <Input
                value={eWayBillData.vehicleNumber}
                onChange={(e) => setEWayBillData({ ...eWayBillData, vehicleNumber: e.target.value })}
                placeholder="HR01AB1234"
              />
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={eWayBillData.distance}
                onChange={(e) => setEWayBillData({ ...eWayBillData, distance: e.target.value })}
                placeholder="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={generateEWayBill} className="w-full">
              Generate E-Way Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Held Bills Dialog */}
      <Dialog open={showHeldBillsDialog} onOpenChange={setShowHeldBillsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Held Bills</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {heldBills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No held bills</p>
            ) : (
              heldBills.map((bill) => (
                <Card key={bill.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{bill.holdNo}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.customerName} • {bill.itemsCount} items
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bill.heldAt).toLocaleString()}
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
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input placeholder="Customer name" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input placeholder="Phone number" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="Email" />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input placeholder="GST Number (optional)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: 'Customer created successfully' });
              setShowCustomerDialog(false);
            }}>
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Billing Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ask anything... 
              
Examples:
- What is my profit margin?
- Should I apply discount?
- Check stock levels
- GST calculation help"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              rows={4}
            />
            <Button onClick={askAI} disabled={aiLoading} className="w-full">
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </Button>
            {aiResponse && (
              <Card className="p-4 bg-blue-50">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
