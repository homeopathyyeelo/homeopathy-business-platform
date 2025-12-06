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
import { useThermalPrinter, PrinterConfig } from '@/lib/thermal-printer';
import ThermalPrinterConfig from '@/components/thermal-printer-config';

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
  const { isConfigured, print, showPreview, printViaDialog, configurePrinter } = useThermalPrinter();

  // BILLING TYPE - Main selector
  const [billingType, setBillingType] = useState<BillingType>('RETAIL');

  // Printer configuration
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    name: 'TSE_TE244',
    type: 'USB',
  });

  // Cart & Billing (with localStorage persistence)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'amount'>('amount');

  // Customer Outstanding & Credit
  const [customerOutstanding, setCustomerOutstanding] = useState<any[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);

  // Barcode scanner auto-detection
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [debugBuffer, setDebugBuffer] = useState(''); // Just for UI display

  // Track if component has loaded from storage (prevents overwriting on mount)
  const hasLoadedFromStorage = useRef(false);

  // Auto-detect barcode scanner (fast typing = scanner)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      console.log('🔑 Key:', e.key, 'TimeDiff:', timeDiff, 'Buffer:', barcodeBufferRef.current);

      // CRITICAL: Always prevent Enter to avoid page refresh/form submission
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        if (barcodeBufferRef.current.length > 0) {
          const fullBarcode = barcodeBufferRef.current;
          console.log('✅ FULL BARCODE CAPTURED:', fullBarcode, 'Length:', fullBarcode.length);

          setIsScanning(true);
          searchByBarcode(fullBarcode);

          // Reset
          barcodeBufferRef.current = '';
          setDebugBuffer('');
          lastKeyTimeRef.current = 0;

          setTimeout(() => setIsScanning(false), 500);
        }
        return;
      }

      // Detect rapid typing (< 150ms between keys = scanner)
      // Increased to 150ms for more reliability
      if (timeDiff < 150 && timeDiff > 0 && e.key.length === 1) {
        // CRITICAL: Prevent key from going to input fields
        e.preventDefault();
        e.stopPropagation();
        barcodeBufferRef.current += e.key;
        setDebugBuffer(barcodeBufferRef.current);
        lastKeyTimeRef.current = currentTime;
        console.log('📦 Building barcode:', barcodeBufferRef.current);
      } else if ((timeDiff >= 150 || timeDiff === 0) && e.key.length === 1) {
        // Reset buffer if typing is slow (human) or first key
        barcodeBufferRef.current = e.key;
        setDebugBuffer(e.key);
        lastKeyTimeRef.current = currentTime;
        console.log('🔄 Buffer reset, new scan starting:', e.key);
      }
    };

    // Use keydown instead of keypress (keypress is deprecated)
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Empty deps = stable event listener (no re-binding)

  // Search product by barcode
  const searchByBarcode = async (barcode: string) => {
    console.log('🔍 Searching for barcode:', barcode);
    try {
      const res = await golangAPI.get(`/api/erp/pos/search-products`, {
        params: { q: barcode, limit: 1 }
      });

      console.log('📦 API Response:', res.data);

      if (res.data?.data?.length > 0) {
        const product = res.data.data[0];

        console.log('✅ Product found:', product.name, 'Batches:', product.batches?.length || 0);

        // Auto-add to cart with first batch (FEFO)
        if (product.batches && product.batches.length > 0) {
          addToCart(product, product.batches[0]);
        } else {
          addToCart(product, null);
        }

        toast({
          title: '✅ Added to Cart',
          description: `${product.name}`,
          duration: 1000,
        });
      } else {
        toast({
          title: '❌ Product Not Found',
          description: `Barcode: ${barcode}`,
          variant: 'destructive',
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('❌ Barcode search error:', error);
      toast({
        title: '⚠️ Search Failed',
        description: error.response?.data?.error || 'Failed to search product',
        variant: 'destructive',
        duration: 3000
      });
    }
  };

  // Manual barcode entry
  const handleBarcodeInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      searchByBarcode(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  // Load cart from sessionStorage on mount and set default customer
  // Using sessionStorage instead of localStorage for better crash recovery
  useEffect(() => {
    console.log('🔄 Loading cart from sessionStorage...');
    const savedCart = sessionStorage.getItem('pos_cart');
    const savedDiscount = sessionStorage.getItem('pos_discount');
    const savedBillingType = sessionStorage.getItem('pos_billing_type');

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log('✅ Cart loaded from sessionStorage:', parsedCart.length, 'items');
      } catch (error) {
        console.error('❌ Error parsing saved cart:', error);
        sessionStorage.removeItem('pos_cart');
      }
    } else {
      console.log('📦 No saved cart found in sessionStorage (starting fresh)');
    }

    if (savedDiscount) setBillDiscount(parseFloat(savedDiscount));
    if (savedBillingType) setBillingType(savedBillingType as BillingType);

    // Auto-select Walk-in Customer for RETAIL billing
    if (!selectedCustomer && (billingType === 'RETAIL' || billingType === 'TOKEN_SALE')) {
      setSelectedCustomer(WALK_IN_CUSTOMER);
    }

    // Check if we need to resume a held bill
    const resumeHoldBillId = sessionStorage.getItem('resume_hold_bill_id');
    if (resumeHoldBillId) {
      console.log('📦 Auto-resuming held bill:', resumeHoldBillId);
      // Clear the flag
      sessionStorage.removeItem('resume_hold_bill_id');
      // Load the bill
      resumeBill(resumeHoldBillId);
    }

    // Mark as loaded to allow saves
    hasLoadedFromStorage.current = true;
    console.log('✅ Storage load complete, saves now enabled');
  }, []);

  // Save cart to sessionStorage whenever it changes
  // sessionStorage survives page refresh but clears on browser close
  useEffect(() => {
    // CRITICAL: Don't save on initial mount (before load completes)
    // This prevents overwriting saved cart with empty initial state
    if (!hasLoadedFromStorage.current) {
      console.log('⏭️ Skipping save (not loaded yet)');
      return;
    }

    sessionStorage.setItem('pos_cart', JSON.stringify(cart));
    sessionStorage.setItem('pos_discount', billDiscount.toString());
    sessionStorage.setItem('pos_billing_type', billingType);
    console.log('💾 Cart saved to sessionStorage:', cart.length, 'items');
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
      setCustomers(res.data?.data || []);
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
    if (product.batches && product.batches.length > 1) {
      setSelectedProduct(product);
      setAvailableBatches(product.batches);
      setShowBatchDialog(true);
    } else if (product.batches && product.batches.length === 1) {
      addToCart(product, product.batches[0]);
    } else {
      addToCart(product, null);
    }
  };

  // Add to cart
  const addToCart = (product: any, batch: any) => {
    const gstRate = getGSTRateForType(product, billingType);
    const unitPrice = batch?.sellingPrice || getPriceForType(product);

    // CRITICAL: Use functional setState to avoid stale closure issues
    // The scanner event listener captures initial cart state, so we must use prevCart
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.product_id === product.id &&
          item.batch_id === batch?.id &&
          item.unit_price === unitPrice
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += (billingType === 'RETURN' ? -1 : 1);
        const item = updatedCart[existingItemIndex];
        const qty = item.quantity;
        const taxableAmount = (item.unit_price * Math.abs(qty)) - item.discount_amount;
        const taxAmount = Math.abs(taxableAmount) * (item.tax_percent / 100);
        item.taxable_amount = taxableAmount;
        item.tax_amount = qty < 0 ? -taxAmount : taxAmount;
        item.total = taxableAmount + (qty < 0 ? -taxAmount : taxAmount);

        console.log('✅ Quantity updated:', product.name, 'New qty:', Math.abs(qty));
        toast({
          title: '✅ Quantity Updated',
          description: `${product.name} x${Math.abs(qty)}`,
          duration: 1000,
        });

        return updatedCart;
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

        console.log('✅ New item added:', product.name);
        toast({
          title: '✅ Added to Cart',
          description: `${product.name} x${Math.abs(newItem.quantity)}`,
          duration: 1000,
        });

        return [...prevCart, newItem];
      }
    });

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

    setCart(prevCart => prevCart.map(item => {
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
    setCart(prevCart => prevCart.map(item => {
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
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    console.log('🗑️ Item removed from cart');
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear all items?')) {
      setCart([]);
      setBillDiscount(0);
      setNotes('');
      // Clear sessionStorage
      sessionStorage.removeItem('pos_cart');
      sessionStorage.removeItem('pos_discount');
      console.log('🗑️ Cart cleared and sessionStorage removed');
      toast({
        title: '🗑️ Cart Cleared',
        description: 'All items removed',
        duration: 1500,
      });
    }
  };

  // Hold bill
  const holdBill = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }

    try {
      const response = await golangAPI.post('/api/erp/pos/hold-bill', {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        customer_phone: selectedCustomer?.phone || '',
        items: cart,
        sub_total: subtotal,
        discount_amount: billDiscountType === 'amount' ? billDiscount : (subtotal * billDiscount / 100),
        discount_percent: billDiscountType === 'percent' ? billDiscount : 0,
        tax_amount: totalTax,
        total_amount: grandTotal,
        billing_type: billingType,
        notes: notes,
        held_by_name: 'Current User', // TODO: Get from auth
      });

      console.log('✅ Bill held:', response.data);

      toast({
        title: '✅ Bill Held Successfully',
        description: `Bill ${response.data?.data?.bill_number || ''} saved`,
        duration: 2000,
      });

      // Clear cart after successful hold
      setCart([]);
      setBillDiscount(0);
      setNotes('');
      sessionStorage.removeItem('pos_cart');
      sessionStorage.removeItem('pos_discount');
    } catch (error: any) {
      console.error('❌ Failed to hold bill:', error);
      toast({
        title: 'Failed to hold bill',
        description: error?.response?.data?.error || 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  // Get held bills
  const fetchHeldBills = async () => {
    try {
      const res = await golangAPI.get('/api/erp/pos/hold-bills');
      console.log('📋 Held bills fetched:', res.data);
      setHeldBills(res.data?.data || []);
      setShowHeldBillsDialog(true);
    } catch (error: any) {
      console.error('❌ Failed to fetch held bills:', error);
      toast({
        title: 'Failed to fetch held bills',
        description: error?.response?.data?.error || 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  // Resume bill
  const resumeBill = async (billId: string) => {
    try {
      const res = await golangAPI.get(`/api/erp/pos/hold-bills/${billId}`);
      const billData = res.data?.data;

      console.log('📦 Resuming bill:', billData);

      // Load cart items
      const items = billData.items || [];
      setCart(items);

      // Load other data
      setBillDiscount(billData.discount_amount || 0);
      setBillDiscountType('amount');
      setNotes(billData.notes || '');
      setBillingType(billData.billing_type || 'RETAIL');

      // Load customer if available
      if (billData.customer_id) {
        // You can optionally fetch and set the customer
        // For now, we'll just show the name
        setSelectedCustomer({
          id: billData.customer_id,
          name: billData.customer_name,
          phone: billData.customer_phone,
        } as any);
      }

      setShowHeldBillsDialog(false);

      toast({
        title: '✅ Bill Resumed',
        description: `Loaded ${items.length} items from ${billData.bill_number}`,
        duration: 2000,
      });
    } catch (error: any) {
      console.error('❌ Failed to resume bill:', error);
      toast({
        title: 'Failed to resume bill',
        description: error?.response?.data?.error || 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  // Delete held bill
  const deleteHeldBill = async (billId: string) => {
    if (!confirm('Delete this held bill? This action cannot be undone.')) {
      return;
    }

    try {
      await golangAPI.delete(`/api/erp/pos/hold-bills/${billId}`);

      toast({
        title: '✅ Held Bill Deleted',
        description: 'Bill removed successfully',
        duration: 2000,
      });

      // Refresh the list
      fetchHeldBills();
    } catch (error: any) {
      console.error('❌ Failed to delete held bill:', error);
      toast({
        title: 'Failed to delete bill',
        description: error?.response?.data?.error || 'Unknown error',
        variant: 'destructive'
      });
    }
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
    console.log('🔵 processPayment called', { cartLength: cart.length, lastCreatedOrder });

    if (cart.length === 0 && !lastCreatedOrder) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }

    // Validate all items have batch_id
    // Backend will auto-assign batch if missing (FEFO)
    // const invalidItems = cart.filter(item => !item.batch_id);
    // if (invalidItems.length > 0) {
    //   toast({
    //     title: 'Invalid Items',
    //     description: `${invalidItems.length} items missing batch information`,
    //     variant: 'destructive'
    //   });
    //   return;
    // }

    setIsProcessing(true);
    console.log('🟢 Starting invoice creation...');
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
          batchId: item.batch_id || '', // Empty string triggers auto-batch selection (FEFO)
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

      console.log('🧾 Creating invoice with data:', invoiceData);
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
        // Clear sessionStorage
        sessionStorage.removeItem('pos_cart');
        sessionStorage.removeItem('pos_discount');

        setShowPaymentDialog(false);
        setShowInvoiceDialog(true);

        // Auto-print thermal invoice (if printer configured)
        if (isConfigured) {
          setTimeout(() => printThermalInvoice(invoice.invoiceNo), 500);
        }

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
      console.error('❌ Invoice creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Invoice creation failed';
      toast({
        title: '❌ Invoice Creation Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
      alert(`ERROR: ${errorMessage}\n\nCheck browser console for details.`);
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

  // Print thermal invoice
  const printThermalInvoice = async (invoiceNo: string) => {
    try {
      const res = await golangAPI.post(`/api/erp/invoices/${invoiceNo}/print`);
      if (res.data?.success) {
        const printData = {
          escposData: res.data.escposData,
          previewText: res.data.previewText,
          invoiceNumber: invoiceNo,
        };

        // Auto-print to configured printer
        const result = await print(printData);
        if (result.success) {
          toast({ title: '🖨️ Invoice Printed', description: `Printed to thermal printer` });
        } else {
          // Fallback to system dialog
          await printViaDialog(printData);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
      // Silent fail - don't block invoice creation
    }
  };

  // Manual print invoice
  const manualPrintInvoice = async () => {
    if (!lastCreatedInvoice) return;
    try {
      const res = await golangAPI.post(`/api/erp/invoices/${lastCreatedInvoice.invoiceNo}/print`);
      if (res.data?.success) {
        const printData = {
          escposData: res.data.escposData,
          previewText: res.data.previewText,
          invoiceNumber: lastCreatedInvoice.invoiceNo,
        };
        showPreview(printData);
      }
    } catch (error) {
      toast({ title: 'Print preview failed', variant: 'destructive' });
    }
  };

  // Configure printer
  const savePrinterConfig = () => {
    configurePrinter(printerConfig);
    setShowPrinterConfig(false);
    toast({ title: '✅ Printer Configured', description: `${printerConfig.name} ready` });
  };

  // Download A4 PDF
  const downloadA4PDF = async () => {
    if (!lastCreatedInvoice) return;
    try {
      const response = await golangAPI.get(`/api/erp/invoices/${lastCreatedInvoice.invoiceNo}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${lastCreatedInvoice.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: '✅ PDF Downloaded', description: `Invoice ${lastCreatedInvoice.invoiceNo}` });
    } catch (error) {
      toast({ title: 'PDF download failed', variant: 'destructive' });
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setShowCustomerDialog(true)}>
                  <UserCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Customer Suggestions Dropdown */}
              {customers.length > 0 && (
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
            {/* Barcode Scanner Input */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Scan className={`h-4 w-4 ${isScanning ? 'text-blue-600 animate-pulse' : 'text-green-600'}`} />
                  Barcode Scanner
                  {isScanning && <span className="text-xs text-blue-600 animate-pulse">Scanning...</span>}
                </Label>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open('/products/barcode', '_blank')}
                  className="h-auto p-0 text-xs"
                >
                  Manage Barcodes →
                </Button>
              </div>
              <div className="relative">
                <Scan className={`absolute left-3 top-3 h-4 w-4 ${isScanning ? 'text-blue-600 animate-pulse' : 'text-green-600'}`} />
                <Input
                  id="barcode-scanner-input"
                  ref={barcodeInputRef}
                  placeholder="Scan or enter barcode... (Press Enter)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleBarcodeInputKeyPress}
                  className={`pl-10 ${isScanning ? 'border-blue-500 ring-2 ring-blue-300' : 'border-green-300 focus:border-green-500'}`}
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {debugBuffer && !isScanning ? `📝 Buffer: ${debugBuffer}` : '✓ Auto-detects barcode scanner | Manual entry supported'}
              </p>
            </div>

            {/* Product Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products (name, SKU)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
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
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrinterConfig(true)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {isConfigured ? 'Printer Settings' : 'Configure Printer'}
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
                {['WHOLESALE', 'DISTRIBUTOR'].includes(billingType) && selectedCustomer?.gstin && (
                  <Button variant="outline" onClick={() => generateEInvoice(lastCreatedInvoice.id)}>
                    <FileCheck className="mr-2 h-4 w-4" />
                    E-Invoice
                  </Button>
                )}
                <Button variant="outline" onClick={shareViaWhatsApp}>
                  <Send className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={manualPrintInvoice}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Thermal
                </Button>
                <Button variant="outline" onClick={downloadA4PDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              {!isConfigured && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-orange-700">
                    Thermal printer not configured.
                    <button
                      onClick={() => setShowPrinterConfig(true)}
                      className="underline ml-1 font-medium"
                    >
                      Configure now
                    </button>
                  </p>
                </div>
              )}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Held Bills ({heldBills.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {heldBills.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No held bills</p>
                <p className="text-sm text-muted-foreground">Bills you hold will appear here</p>
              </div>
            ) : (
              heldBills.map((bill) => (
                <Card key={bill.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">
                          {bill.bill_number}
                        </Badge>
                        <Badge variant="secondary">
                          {bill.billing_type || 'RETAIL'}
                        </Badge>
                      </div>
                      <p className="font-medium text-lg mb-1">
                        {bill.customer_name || 'Walk-in Customer'}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {bill.total_items} items
                        </span>
                        {bill.customer_phone && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {bill.customer_phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Held: {new Date(bill.created_at).toLocaleString()}
                        {bill.held_by_name && ` • By ${bill.held_by_name}`}
                      </p>
                      {bill.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Note: {bill.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-2xl text-primary">
                          ₹{bill.total_amount?.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => resumeBill(bill.id)}
                          className="gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteHeldBill(bill.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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

      {/* Thermal Printer Configuration */}
      <ThermalPrinterConfig
        open={showPrinterConfig}
        onOpenChange={setShowPrinterConfig}
      />
    </div>
  );
}
