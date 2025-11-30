# 🚀 POS & B2B Billing Pages - Production-Ready Enhancement Guide

## Overview
This guide provides step-by-step instructions to upgrade both POS and B2B pages to production-ready level with E-invoice, E-way bill, OpenAI assistance, and all advanced features requested.

---

## ✅ Backend APIs Created & Ready

### 1. **POS APIs** (`/api/erp/pos/`)
- ✅ `GET /search-products` - Product search with FEFO batches
- ✅ `POST /create-invoice` - Create invoice with multi-rate GST
- ✅ `GET /invoices` - List invoices
- ✅ `POST /hold-bill` - Hold bill for later
- ✅ `GET /held-bills` - Get all held bills
- ✅ `POST /resume-bill/:id` - Resume held bill
- ✅ `POST /create-return` - Process returns
- ✅ `GET /dashboard-stats` - Dashboard statistics

### 2. **GST Compliance APIs** (`/api/erp/gst/`)
- ✅ `GET /summary` - GST summary
- ✅ `GET /gstr1` - GSTR-1 report
- ✅ `GET /gstr3b` - GSTR-3B report
- ✅ `GET /itc-ledger` - ITC ledger
- ✅ `GET /hsn-wise-sales` - HSN-wise sales

### 3. **E-Invoice APIs** (`/api/erp/einvoice/`)
- ✅ `POST /generate` - Generate E-Invoice (IRN, QR)
- ✅ `GET /:invoiceId` - Get E-Invoice details
- ✅ `POST /cancel` - Cancel E-Invoice

### 4. **E-Way Bill APIs** (`/api/erp/ewaybill/`)
- ✅ `POST /generate` - Generate E-Way Bill
- ✅ `POST /extend` - Extend E-Way Bill validity
- ✅ `POST /cancel` - Cancel E-Way Bill

---

## 🎯 Key Features to Add

### **POS Page** (`/sales/pos`)

#### 1. **Batch Selection Dialog (FEFO)**
Replace the simple product add with batch selection:

```tsx
// Add state
const [batchDialogOpen, setBatchDialogOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<any>(null);
const [availableBatches, setAvailableBatches] = useState<any[]>([]);

// Fetch batches when product selected
const selectProduct = async (product: any) => {
  setSelectedProduct(product);
  
  try {
    const res = await golangAPI.get(`/api/erp/pos/product/${product.id}/batches`);
    const batches = res.data?.data || [];
    setAvailableBatches(batches);
    setBatchDialogOpen(true);
  } catch (error) {
    toast({ title: 'Failed to fetch batches', variant: 'destructive' });
  }
};

// Add batch to cart
const addBatchToCart = (batch: any) => {
  const item = {
    id: `cart-${Date.now()}`,
    product_id: selectedProduct.id,
    productName: selectedProduct.name,
    sku: selectedProduct.sku,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantity: 1,
    unitPrice: batch.sellingPrice,
    mrp: batch.mrp,
    discountPercent: 0,
    gstRate: selectedProduct.gstRate,
    hsnCode: selectedProduct.hsnCode,
    // ... calculate taxable, gst, total
  };
  
  setCart([...cart, item]);
  setBatchDialogOpen(false);
  toast({ title: 'Added to cart', description: selectedProduct.name });
};
```

**Batch Selection Dialog UI:**
```tsx
<Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Select Batch - {selectedProduct?.name}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-2">
      {availableBatches.map((batch, idx) => (
        <Card 
          key={batch.id}
          className={`cursor-pointer hover:bg-gray-50 ${idx === 0 ? 'border-green-500 border-2' : ''}`}
          onClick={() => addBatchToCart(batch)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="font-semibold">{batch.batchNumber}</div>
                <div className="text-sm text-gray-600">
                  Expiry: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                  {batch.daysToExpiry < 90 && (
                    <Badge variant="destructive" className="ml-2">
                      Expires in {batch.daysToExpiry} days
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">Location: {batch.location}</div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold">₹{batch.sellingPrice}</div>
                <div className="text-sm text-gray-600">Stock: {batch.availableQuantity}</div>
                <div className="text-xs text-gray-500">MRP: ₹{batch.mrp}</div>
              </div>
              
              {idx === 0 && (
                <Badge className="ml-4 bg-green-500">FEFO - Best Pick</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

#### 2. **Multi-Rate GST Calculation**
Update the invoice creation to use the new API:

```tsx
const createInvoice = async () => {
  if (cart.length === 0) {
    toast({ title: 'Cart is empty', variant: 'destructive' });
    return;
  }

  setIsProcessing(true);

  try {
    const invoiceData = {
      invoiceType: 'RETAIL',
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      customerEmail: selectedCustomer?.email || '',
      customerAddress: selectedCustomer?.address || '',
      customerGstNumber: '',
      items: cart.map(item => ({
        productId: item.product_id,
        productName: item.name,
        sku: item.sku,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        mrp: item.mrp,
        discountPercent: item.discount_percent,
        hsnCode: item.hsn_code,
        gstRate: item.tax_percent,
        category: item.category || '',
        brand: item.brand || '',
      })),
      billDiscount: billDiscount,
      billDiscountType: billDiscountType === 'percent' ? 'PERCENT' : 'AMOUNT',
      paymentMethod: paymentMethod.toUpperCase(),
      amountPaid: parseFloat(amountPaid || '0'),
      notes: notes,
      counterId: 'COUNTER-1',
      counterName: 'Main Counter',
    };

    const res = await golangAPI.post('/api/erp/pos/create-invoice', invoiceData);
    
    if (res.data?.success) {
      const invoice = res.data.data;
      setLastCreatedInvoice(invoice);
      
      toast({
        title: 'Invoice Created Successfully',
        description: `Invoice No: ${invoice.invoiceNo}`,
      });

      // Clear cart
      setCart([]);
      setBillDiscount(0);
      setNotes('');
      setAmountPaid('');
      
      // Show print options
      setShowPaymentDialog(false);
      setShowA4Print(true);
    }
  } catch (error: any) {
    toast({
      title: 'Invoice Creation Failed',
      description: error.response?.data?.error || 'An error occurred',
      variant: 'destructive',
    });
  } finally {
    setIsProcessing(false);
  }
};
```

#### 3. **Hold/Resume Bills**
```tsx
const holdBill = async () => {
  if (cart.length === 0) return;

  try {
    const res = await golangAPI.post('/api/erp/pos/hold-bill', {
      customerName: selectedCustomer?.name || 'Walk-in',
      customerId: selectedCustomer?.id || '',
      billData: {
        cart,
        billDiscount,
        billDiscountType,
        notes,
      },
      totalAmount: grandTotal,
      itemsCount: cart.length,
      counterId: 'COUNTER-1',
      notes: notes || 'Held for customer',
    });

    if (res.data?.success) {
      toast({ title: 'Bill Held Successfully', description: res.data.data.holdNo });
      setCart([]);
      setBillDiscount(0);
      setNotes('');
    }
  } catch (error) {
    toast({ title: 'Failed to hold bill', variant: 'destructive' });
  }
};

const showHeldBills = async () => {
  try {
    const res = await golangAPI.get('/api/erp/pos/held-bills');
    const bills = res.data?.data || [];
    
    // Show dialog with list of held bills
    setHeldBillsList(bills);
    setHeldBillsDialog(true);
  } catch (error) {
    toast({ title: 'Failed to fetch held bills', variant: 'destructive' });
  }
};

const resumeBill = async (billId: string) => {
  try {
    const res = await golangAPI.post(`/api/erp/pos/resume-bill/${billId}`);
    
    if (res.data?.success) {
      const billData = res.data.data;
      
      // Restore cart state
      setCart(billData.cart || []);
      setBillDiscount(billData.billDiscount || 0);
      setBillDiscountType(billData.billDiscountType || 'amount');
      setNotes(billData.notes || '');
      
      setHeldBillsDialog(false);
      toast({ title: 'Bill Resumed Successfully' });
    }
  } catch (error) {
    toast({ title: 'Failed to resume bill', variant: 'destructive' });
  }
};
```

#### 4. **E-Invoice Generation**
Add after successful invoice creation:

```tsx
const generateEInvoice = async (invoiceId: string) => {
  try {
    const res = await golangAPI.post('/api/erp/einvoice/generate', {
      invoiceId: invoiceId,
    });

    if (res.data?.success) {
      const { irn, ackNo, signedQr } = res.data.data;
      
      toast({
        title: 'E-Invoice Generated',
        description: `IRN: ${irn.substring(0, 20)}...`,
      });

      // Update invoice display with IRN and QR code
      setEInvoiceData({ irn, ackNo, signedQr });
      setShowEInvoiceDialog(true);
    }
  } catch (error: any) {
    toast({
      title: 'E-Invoice Generation Failed',
      description: error.response?.data?.error || 'An error occurred',
      variant: 'destructive',
    });
  }
};
```

**E-Invoice Dialog:**
```tsx
<Dialog open={showEInvoiceDialog} onOpenChange={setShowEInvoiceDialog}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>E-Invoice Generated Successfully</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>IRN (Invoice Reference Number)</Label>
        <div className="p-3 bg-gray-100 rounded text-xs font-mono break-all">
          {eInvoiceData?.irn}
        </div>
      </div>
      
      <div>
        <Label>Acknowledgement Number</Label>
        <div className="p-3 bg-gray-100 rounded font-mono">
          {eInvoiceData?.ackNo}
        </div>
      </div>
      
      <div>
        <Label>QR Code</Label>
        <div className="p-4 bg-white border rounded flex justify-center">
          {/* Add QR code library and display: qrcode.react */}
          <div className="text-center text-gray-500">
            Scan this QR code for invoice verification
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => downloadEInvoiceJSON()}>
          Download JSON
        </Button>
        <Button variant="outline" onClick={() => printEInvoice()}>
          Print with IRN
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

#### 5. **OpenAI Billing Assistant**
Add AI-powered smart suggestions:

```tsx
const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
const [aiQuery, setAiQuery] = useState('');
const [aiResponse, setAiResponse] = useState('');

const askAIAssistant = async (query: string) => {
  try {
    const res = await fetch('/api/ai/billing-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        context: {
          cart: cart,
          customer: selectedCustomer,
          total: grandTotal,
        },
      }),
    });

    const data = await res.json();
    setAiResponse(data.response);
  } catch (error) {
    setAiResponse('AI Assistant is currently unavailable');
  }
};
```

**AI Assistant Dialog:**
```tsx
<Dialog open={aiAssistantOpen} onOpenChange={setAiAssistantOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" />
        AI Billing Assistant
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => askAIAssistant('What is the best margin for this sale?')}
          >
            Check Margin
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => askAIAssistant('Suggest alternative products')}
          >
            Product Alternatives
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => askAIAssistant('Verify GST calculations')}
          >
            Verify GST
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => askAIAssistant('Is E-Invoice required?')}
          >
            E-Invoice Check
          </Button>
        </div>
      </div>
      
      <div>
        <Label>Ask a Question</Label>
        <Input
          placeholder="e.g., What discount can I offer?"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              askAIAssistant(aiQuery);
            }
          }}
        />
      </div>
      
      {aiResponse && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">AI Response:</h4>
          <p className="text-gray-700">{aiResponse}</p>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

### **B2B Page** (`/sales/b2b`)

#### 1. **E-Way Bill Generation**
Add after invoice creation for B2B orders:

```tsx
const generateEWayBill = async (invoiceId: string) => {
  // E-Way Bill required if invoice > ₹50,000
  if (grandTotal < 50000) {
    toast({ title: 'E-Way Bill not required for orders below ₹50,000' });
    return;
  }

  setEWayBillDialogOpen(true);
};

const submitEWayBill = async (data: EWayBillData) => {
  try {
    const res = await golangAPI.post('/api/erp/ewaybill/generate', {
      invoiceId: lastInvoiceId,
      transportMode: data.transportMode,
      transportId: data.vehicleNumber,
      transporterName: data.transporterName,
      distance: data.distance,
      fromPlace: 'Mumbai',
      toPlace: data.toPlace,
    });

    if (res.data?.success) {
      const { eWayBillNo, validUpto } = res.data.data;
      
      toast({
        title: 'E-Way Bill Generated',
        description: `E-Way Bill No: ${eWayBillNo}`,
      });

      setEWayBillDetails({ eWayBillNo, validUpto });
    }
  } catch (error: any) {
    toast({
      title: 'E-Way Bill Generation Failed',
      description: error.response?.data?.error,
      variant: 'destructive',
    });
  }
};
```

**E-Way Bill Dialog:**
```tsx
<Dialog open={eWayBillDialogOpen} onOpenChange={setEWayBillDialogOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Generate E-Way Bill</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Transport Mode</Label>
        <Select value={transportMode} onValueChange={setTransportMode}>
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
        <Label>Vehicle Number / LR Number</Label>
        <Input
          placeholder="MH01AB1234 or LR123456"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
        />
      </div>
      
      <div>
        <Label>Transporter Name</Label>
        <Input
          placeholder="XYZ Transport"
          value={transporterName}
          onChange={(e) => setTransporterName(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Distance (KM)</Label>
          <Input
            type="number"
            placeholder="100"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        
        <div>
          <Label>To Place</Label>
          <Input
            placeholder="Destination city"
            value={toPlace}
            onChange={(e) => setToPlace(e.target.value)}
          />
        </div>
      </div>
      
      <Alert>
        <Truck className="w-4 h-4" />
        <AlertDescription>
          E-Way Bill is mandatory for consignments worth more than ₹50,000
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2">
        <Button onClick={() => submitEWayBill({
          transportMode,
          vehicleNumber,
          transporterName,
          distance: parseInt(distance),
          toPlace,
        })}>
          Generate E-Way Bill
        </Button>
        <Button variant="outline" onClick={() => setEWayBillDialogOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

#### 2. **Credit Terms & Payment Tracking**
```tsx
// Add to B2B invoice data
const invoiceData = {
  // ... existing fields
  paymentTerms: paymentTerms, // NET 30, NET 45, etc.
  dueDate: dueDate,
  creditLimit: selectedCustomer?.creditLimit || 0,
  outstandingBalance: selectedCustomer?.outstandingBalance || 0,
  // Check credit limit
  exceedsCreditLimit: (selectedCustomer?.outstandingBalance || 0) + grandTotal > (selectedCustomer?.creditLimit || 0),
};

// Show warning if exceeds credit limit
{invoiceData.exceedsCreditLimit && (
  <Alert variant="destructive">
    <AlertCircle className="w-4 h-4" />
    <AlertDescription>
      This invoice will exceed customer's credit limit of ₹{selectedCustomer?.creditLimit}
    </AlertDescription>
  </Alert>
)}
```

---

## 🔧 Implementation Steps

### Step 1: Update Product Search
Replace the current search with:
```tsx
const searchProducts = async (query: string) => {
  try {
    const res = await golangAPI.get('/api/erp/pos/search-products', {
      params: { q: query }
    });
    setSearchResults(res.data?.data || []);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Step 2: Update Invoice Creation
Replace `processPayment()` / `processB2BInvoice()` with the new API calls shown above.

### Step 3: Add E-Invoice Button
After successful invoice:
```tsx
{lastCreatedInvoice && (
  <div className="flex gap-2">
    <Button onClick={() => generateEInvoice(lastCreatedInvoice.id)}>
      <FileCheck className="w-4 h-4 mr-2" />
      Generate E-Invoice
    </Button>
    
    {grandTotal >= 50000 && (
      <Button onClick={() => generateEWayBill(lastCreatedInvoice.id)}>
        <Truck className="w-4 h-4 mr-2" />
        Generate E-Way Bill
      </Button>
    )}
  </div>
)}
```

### Step 4: Add Hold Bill Button (POS only)
```tsx
<Button variant="outline" onClick={holdBill}>
  <Clock className="w-4 h-4 mr-2" />
  Hold Bill
</Button>

<Button variant="outline" onClick={showHeldBills}>
  View Held Bills ({heldBillsCount})
</Button>
```

### Step 5: Add AI Assistant Button
```tsx
<Button 
  variant="outline"
  className="bg-blue-50"
  onClick={() => setAiAssistantOpen(true)}
>
  <Sparkles className="w-4 h-4 mr-2" />
  AI Assistant
</Button>
```

---

## 📊 Dashboard Integration

Add to POS page header:
```tsx
useEffect(() => {
  fetchDashboardStats();
}, []);

const fetchDashboardStats = async () => {
  try {
    const res = await golangAPI.get('/api/erp/pos/dashboard-stats');
    setDashboardStats(res.data?.data || {});
  } catch (error) {
    console.error('Failed to fetch stats');
  }
};

// Display stats
{dashboardStats && (
  <div className="grid grid-cols-4 gap-4 mb-4">
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500">Today's Sales</div>
        <div className="text-2xl font-bold">₹{dashboardStats.today?.sales || 0}</div>
        <div className="text-xs text-gray-500">{dashboardStats.today?.invoices || 0} invoices</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500">GST Collected</div>
        <div className="text-2xl font-bold">₹{dashboardStats.today?.gst || 0}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500">Held Bills</div>
        <div className="text-2xl font-bold">{dashboardStats.heldBills || 0}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500">Pending Commissions</div>
        <div className="text-2xl font-bold">₹{dashboardStats.pendingCommissions || 0}</div>
      </CardContent>
    </Card>
  </div>
)}
```

---

## 🚀 Final Deployment Checklist

- [ ] Run database migration: `./scripts/setup_pos_system.sh`
- [ ] Register routes in `cmd/server/main.go`
- [ ] Update POS page with batch selection
- [ ] Update POS page with new invoice API
- [ ] Add E-Invoice generation
- [ ] Add E-Way Bill generation (B2B)
- [ ] Add Hold/Resume bills (POS)
- [ ] Add AI Assistant integration
- [ ] Add dashboard stats display
- [ ] Test complete flow: Search → Add → Invoice → E-Invoice
- [ ] Test hold/resume flow
- [ ] Test returns flow
- [ ] Configure OpenAI API key for AI assistant
- [ ] Set company GSTIN for E-Invoice
- [ ] Train staff on new features

---

## 📞 Support

All backend APIs are ready. Frontend needs to be updated with the code samples provided above.

**Key Files:**
- Backend: `services/api-golang-master/internal/handlers/pos_enhanced_handler.go`
- Routes: `services/api-golang-master/internal/routes/pos_routes.go`
- Frontend: `app/sales/pos/page.tsx` and `app/sales/b2b/page.tsx`

**API Documentation:** `POS-API-DOCUMENTATION.txt`
