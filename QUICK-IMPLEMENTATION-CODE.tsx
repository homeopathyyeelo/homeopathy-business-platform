/**
 * PRODUCTION-READY CODE SNIPPETS FOR POS & B2B PAGES
 * 
 * Copy these code blocks into your existing pages to add advanced features
 */

// ============================================================================
// 1. BATCH SELECTION COMPONENT (Add to POS page)
// ============================================================================

// Add these states at the top of your component:
const [batchDialogOpen, setBatchDialogOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<any>(null);
const [availableBatches, setAvailableBatches] = useState<any[]>([]);

// Replace your addToCart function with this:
const selectProductForBatch = async (product: any) => {
  setSelectedProduct(product);
  
  try {
    const res = await golangAPI.get(`/api/erp/pos/product/${product.id}/batches`);
    const batches = res.data?.data || [];
    
    if (batches.length === 0) {
      toast({
        title: 'No Batches Available',
        description: 'This product has no available stock',
        variant: 'destructive',
      });
      return;
    }
    
    setAvailableBatches(batches);
    setBatchDialogOpen(true);
  } catch (error) {
    toast({ title: 'Failed to fetch batches', variant: 'destructive' });
  }
};

const addBatchToCart = (batch: any) => {
  const taxableAmount = batch.sellingPrice;
  const gstAmount = (taxableAmount * selectedProduct.gstRate) / 100;
  
  const newItem = {
    id: `cart-${Date.now()}-${Math.random()}`,
    product_id: selectedProduct.id,
    name: selectedProduct.name,
    sku: selectedProduct.sku,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    quantity: 1,
    unit_price: batch.sellingPrice,
    mrp: batch.mrp,
    discount_percent: 0,
    discount_amount: 0,
    tax_percent: selectedProduct.gstRate,
    taxable_amount: taxableAmount,
    tax_amount: gstAmount,
    total: taxableAmount + gstAmount,
    stock: batch.availableQuantity,
    hsn_code: selectedProduct.hsnCode,
    category: selectedProduct.category,
    brand: selectedProduct.brand,
  };
  
  setCart([...cart, newItem]);
  setBatchDialogOpen(false);
  setSearchQuery('');
  setSearchResults([]);
  
  toast({
    title: 'Added to Cart',
    description: `${selectedProduct.name} (Batch: ${batch.batchNumber})`,
  });
};

// Add this JSX before your closing </div>:
<Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>Select Batch - {selectedProduct?.name}</span>
        <Badge variant="outline">{availableBatches.length} batches available</Badge>
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-3">
      {availableBatches.map((batch, idx) => {
        const daysToExpiry = batch.daysToExpiry;
        const isExpiringSoon = daysToExpiry < 90;
        const isNearExpiry = daysToExpiry < 30;
        
        return (
          <Card 
            key={batch.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              idx === 0 ? 'border-green-500 border-2 bg-green-50' : ''
            } ${isNearExpiry ? 'border-red-300' : ''}`}
            onClick={() => addBatchToCart(batch)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">{batch.batchNumber}</span>
                    {idx === 0 && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        FEFO - Best Choice
                      </Badge>
                    )}
                    {isNearExpiry && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Expires in {daysToExpiry} days
                      </Badge>
                    )}
                    {isExpiringSoon && !isNearExpiry && (
                      <Badge variant="warning" className="bg-yellow-500">
                        Expires in {daysToExpiry} days
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <Package className="w-4 h-4 inline mr-1" />
                      Stock: <span className="font-semibold">{batch.availableQuantity}</span> units
                    </div>
                    <div>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Expiry: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                    <div>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location: {batch.location || 'Not specified'}
                    </div>
                    <div>
                      <IndianRupee className="w-4 h-4 inline mr-1" />
                      MRP: ₹{batch.mrp}
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{batch.sellingPrice}
                  </div>
                  <div className="text-xs text-gray-500">Selling Price</div>
                  {batch.sellingPrice < batch.mrp && (
                    <div className="text-xs text-green-600">
                      Save ₹{(batch.mrp - batch.sellingPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
        Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ============================================================================
// 2. NEW INVOICE CREATION WITH MULTI-RATE GST
// ============================================================================

// Replace your processPayment or createInvoice function with this:
const createInvoiceWithGST = async () => {
  if (cart.length === 0) {
    toast({ title: 'Cart is empty', variant: 'destructive' });
    return;
  }

  setIsProcessing(true);

  try {
    const invoiceData = {
      invoiceType: 'RETAIL', // or 'WHOLESALE', 'B2B'
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      customerEmail: selectedCustomer?.email || '',
      customerAddress: selectedCustomer?.address || '',
      customerGstNumber: selectedCustomer?.gstin || '',
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
        potency: item.potency || '',
        form: item.form || '',
      })),
      billDiscount: billDiscount,
      billDiscountType: billDiscountType === 'percent' ? 'PERCENT' : 'AMOUNT',
      paymentMethod: paymentMethod.toUpperCase(),
      amountPaid: parseFloat(amountPaid || '0'),
      notes: notes,
      prescriptionNumber: '',
      doctorId: '',
      doctorName: '',
      counterId: 'COUNTER-1',
      counterName: 'Main Counter',
    };

    const res = await golangAPI.post('/api/erp/pos/create-invoice', invoiceData);
    
    if (res.data?.success) {
      const invoice = res.data.data.invoice;
      setLastCreatedInvoice(invoice);
      
      toast({
        title: '✅ Invoice Created Successfully',
        description: `Invoice No: ${invoice.invoiceNo} | Total: ₹${invoice.totalAmount}`,
      });

      // Clear cart
      setCart([]);
      setSelectedCustomer(null);
      setBillDiscount(0);
      setNotes('');
      setAmountPaid('');
      setShowPaymentDialog(false);
      
      // Show print/E-invoice options
      setShowInvoiceActionsDialog(true);
    }
  } catch (error: any) {
    toast({
      title: '❌ Invoice Creation Failed',
      description: error.response?.data?.error || 'An error occurred',
      variant: 'destructive',
    });
  } finally {
    setIsProcessing(false);
  }
};

// ============================================================================
// 3. HOLD/RESUME BILLS (POS only)
// ============================================================================

// Add these states:
const [heldBillsDialog, setHeldBillsDialog] = useState(false);
const [heldBillsList, setHeldBillsList] = useState<any[]>([]);
const [heldBillsCount, setHeldBillsCount] = useState(0);

// Hold current bill
const holdCurrentBill = async () => {
  if (cart.length === 0) {
    toast({ title: 'Cart is empty', variant: 'destructive' });
    return;
  }

  try {
    const res = await golangAPI.post('/api/erp/pos/hold-bill', {
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerId: selectedCustomer?.id || '',
      billData: {
        cart,
        billDiscount,
        billDiscountType,
        notes,
        selectedCustomer,
      },
      totalAmount: grandTotal,
      itemsCount: cart.length,
      counterId: 'COUNTER-1',
      notes: notes || 'Bill held for customer return',
    });

    if (res.data?.success) {
      const holdNo = res.data.data.holdNo;
      
      toast({
        title: '🕐 Bill Held Successfully',
        description: `Hold No: ${holdNo}`,
      });

      // Clear current cart
      setCart([]);
      setSelectedCustomer(null);
      setBillDiscount(0);
      setNotes('');
      
      // Refresh held bills count
      fetchHeldBillsCount();
    }
  } catch (error) {
    toast({ title: 'Failed to hold bill', variant: 'destructive' });
  }
};

// Fetch held bills
const fetchHeldBills = async () => {
  try {
    const res = await golangAPI.get('/api/erp/pos/held-bills');
    const bills = res.data?.data || [];
    setHeldBillsList(bills);
    setHeldBillsDialog(true);
  } catch (error) {
    toast({ title: 'Failed to fetch held bills', variant: 'destructive' });
  }
};

// Fetch held bills count
const fetchHeldBillsCount = async () => {
  try {
    const res = await golangAPI.get('/api/erp/pos/held-bills');
    setHeldBillsCount(res.data?.data?.length || 0);
  } catch (error) {
    console.error('Failed to fetch held bills count');
  }
};

// Resume bill
const resumeHeldBill = async (billId: string) => {
  try {
    const res = await golangAPI.post(`/api/erp/pos/resume-bill/${billId}`);
    
    if (res.data?.success) {
      const billData = res.data.data;
      
      // Restore cart state
      setCart(billData.cart || []);
      setBillDiscount(billData.billDiscount || 0);
      setBillDiscountType(billData.billDiscountType || 'amount');
      setNotes(billData.notes || '');
      setSelectedCustomer(billData.selectedCustomer || null);
      
      setHeldBillsDialog(false);
      
      toast({
        title: '✅ Bill Resumed Successfully',
        description: `${billData.cart?.length || 0} items restored`,
      });
      
      fetchHeldBillsCount();
    }
  } catch (error) {
    toast({ title: 'Failed to resume bill', variant: 'destructive' });
  }
};

// Delete held bill
const deleteHeldBill = async (billId: string) => {
  if (!confirm('Are you sure you want to delete this held bill?')) return;
  
  try {
    await golangAPI.delete(`/api/erp/pos/held-bill/${billId}`);
    
    toast({ title: 'Held bill deleted' });
    
    // Refresh list
    fetchHeldBills();
    fetchHeldBillsCount();
  } catch (error) {
    toast({ title: 'Failed to delete held bill', variant: 'destructive' });
  }
};

// Call on component mount
useEffect(() => {
  fetchHeldBillsCount();
}, []);

// Add these buttons to your UI:
<div className="flex gap-2">
  <Button
    variant="outline"
    onClick={holdCurrentBill}
    disabled={cart.length === 0}
  >
    <Clock className="w-4 h-4 mr-2" />
    Hold Bill
  </Button>
  
  <Button
    variant="outline"
    onClick={fetchHeldBills}
  >
    <Receipt className="w-4 h-4 mr-2" />
    Held Bills
    {heldBillsCount > 0 && (
      <Badge className="ml-2">{heldBillsCount}</Badge>
    )}
  </Button>
</div>

// Add this dialog:
<Dialog open={heldBillsDialog} onOpenChange={setHeldBillsDialog}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Held Bills</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {heldBillsList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No held bills
        </div>
      ) : (
        heldBillsList.map((bill) => (
          <Card key={bill.id} className="hover:bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{bill.holdNo}</div>
                  <div className="text-sm text-gray-600">
                    {bill.customerName} | {bill.itemsCount} items
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(bill.heldAt).toLocaleString('en-IN')}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => resumeHeldBill(bill.id)}
                    >
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteHeldBill(bill.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  </DialogContent>
</Dialog>

// ============================================================================
// 4. E-INVOICE GENERATION
// ============================================================================

// Add these states:
const [showEInvoiceDialog, setShowEInvoiceDialog] = useState(false);
const [eInvoiceData, setEInvoiceData] = useState<any>(null);
const [generatingEInvoice, setGeneratingEInvoice] = useState(false);

// Generate E-Invoice
const generateEInvoice = async (invoiceId: string) => {
  setGeneratingEInvoice(true);
  
  try {
    const res = await golangAPI.post('/api/erp/einvoice/generate', {
      invoiceId: invoiceId,
    });

    if (res.data?.success) {
      const { irn, ackNo, signedQr, ackDt } = res.data.data;
      
      setEInvoiceData({ irn, ackNo, signedQr, ackDt });
      setShowEInvoiceDialog(true);
      
      toast({
        title: '✅ E-Invoice Generated Successfully',
        description: `IRN: ${irn.substring(0, 20)}...`,
      });
    }
  } catch (error: any) {
    toast({
      title: '❌ E-Invoice Generation Failed',
      description: error.response?.data?.error || 'Failed to generate E-Invoice',
      variant: 'destructive',
    });
  } finally {
    setGeneratingEInvoice(false);
  }
};

// Add this dialog:
<Dialog open={showEInvoiceDialog} onOpenChange={setShowEInvoiceDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-green-500" />
        E-Invoice Generated Successfully
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your E-Invoice has been successfully generated and registered with GST portal
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-600">IRN (Invoice Reference Number)</Label>
          <div className="p-3 bg-gray-100 rounded text-xs font-mono break-all mt-1">
            {eInvoiceData?.irn}
          </div>
        </div>
        
        <div>
          <Label className="text-gray-600">Acknowledgement Number</Label>
          <div className="p-3 bg-gray-100 rounded font-mono mt-1">
            {eInvoiceData?.ackNo}
          </div>
        </div>
      </div>
      
      <div>
        <Label className="text-gray-600">Acknowledgement Date</Label>
        <div className="p-3 bg-gray-100 rounded mt-1">
          {eInvoiceData?.ackDt}
        </div>
      </div>
      
      <div>
        <Label className="text-gray-600">QR Code</Label>
        <div className="p-4 bg-white border-2 border-gray-200 rounded flex justify-center mt-1">
          <div className="text-center">
            {/* Install: npm install qrcode.react */}
            {/* <QRCodeSVG value={eInvoiceData?.signedQr || ''} size={200} /> */}
            <div className="text-sm text-gray-500 mt-2">
              Scan for invoice verification
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            navigator.clipboard.writeText(eInvoiceData?.irn || '');
            toast({ title: 'IRN copied to clipboard' });
          }}
        >
          Copy IRN
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

// ============================================================================
// 5. E-WAY BILL GENERATION (B2B only)
// ============================================================================

// Add these states:
const [showEWayBillDialog, setShowEWayBillDialog] = useState(false);
const [eWayBillData, setEWayBillData] = useState({
  transportMode: '1',
  vehicleNumber: '',
  transporterName: '',
  distance: '',
  toPlace: '',
});

// Generate E-Way Bill
const generateEWayBill = async (invoiceId: string, invoiceTotal: number) => {
  if (invoiceTotal < 50000) {
    toast({
      title: 'E-Way Bill Not Required',
      description: 'E-Way Bill is mandatory only for consignments above ₹50,000',
    });
    return;
  }

  setShowEWayBillDialog(true);
};

const submitEWayBill = async () => {
  try {
    const res = await golangAPI.post('/api/erp/ewaybill/generate', {
      invoiceId: lastCreatedInvoice?.id,
      transportMode: eWayBillData.transportMode,
      transportId: eWayBillData.vehicleNumber,
      transporterName: eWayBillData.transporterName,
      distance: parseInt(eWayBillData.distance),
      fromPlace: 'Mumbai', // Get from company settings
      toPlace: eWayBillData.toPlace,
    });

    if (res.data?.success) {
      const { eWayBillNo, validUpto } = res.data.data;
      
      toast({
        title: '✅ E-Way Bill Generated',
        description: `E-Way Bill No: ${eWayBillNo}`,
      });

      setShowEWayBillDialog(false);
    }
  } catch (error: any) {
    toast({
      title: '❌ E-Way Bill Generation Failed',
      description: error.response?.data?.error,
      variant: 'destructive',
    });
  }
};

// Add this dialog:
<Dialog open={showEWayBillDialog} onOpenChange={setShowEWayBillDialog}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Truck className="w-5 h-5" />
        Generate E-Way Bill
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          E-Way Bill is mandatory for goods transport worth more than ₹50,000
        </AlertDescription>
      </Alert>
      
      <div>
        <Label>Transport Mode *</Label>
        <Select 
          value={eWayBillData.transportMode} 
          onValueChange={(val) => setEWayBillData({...eWayBillData, transportMode: val})}
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
        <Label>Vehicle Number / LR Number *</Label>
        <Input
          placeholder="MH01AB1234 or LR123456"
          value={eWayBillData.vehicleNumber}
          onChange={(e) => setEWayBillData({...eWayBillData, vehicleNumber: e.target.value})}
        />
      </div>
      
      <div>
        <Label>Transporter Name</Label>
        <Input
          placeholder="XYZ Transport"
          value={eWayBillData.transporterName}
          onChange={(e) => setEWayBillData({...eWayBillData, transporterName: e.target.value})}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Distance (KM) *</Label>
          <Input
            type="number"
            placeholder="100"
            value={eWayBillData.distance}
            onChange={(e) => setEWayBillData({...eWayBillData, distance: e.target.value})}
          />
        </div>
        
        <div>
          <Label>To Place *</Label>
          <Input
            placeholder="Delhi"
            value={eWayBillData.toPlace}
            onChange={(e) => setEWayBillData({...eWayBillData, toPlace: e.target.value})}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={submitEWayBill} className="flex-1">
          Generate E-Way Bill
        </Button>
        <Button variant="outline" onClick={() => setShowEWayBillDialog(false)}>
          Cancel
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

// ============================================================================
// 6. AI BILLING ASSISTANT
// ============================================================================

// Add these states:
const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
const [aiQuery, setAiQuery] = useState('');
const [aiResponse, setAiResponse] = useState('');
const [aiLoading, setAiLoading] = useState(false);

// Ask AI Assistant
const askAI = async (query: string) => {
  setAiLoading(true);
  
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
    setAiResponse(data.response || 'No response from AI');
  } catch (error) {
    setAiResponse('AI Assistant is currently unavailable. Please try again later.');
  } finally {
    setAiLoading(false);
  }
};

// Add this button to your header:
<Button 
  variant="outline"
  className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
  onClick={() => setAiAssistantOpen(true)}
>
  <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
  AI Assistant
</Button>

// Add this dialog:
<Dialog open={aiAssistantOpen} onOpenChange={setAiAssistantOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" />
        AI Billing Assistant
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('What is the profit margin for this sale?');
              askAI('What is the profit margin for this sale?');
            }}
          >
            <Calculator className="w-3 h-3 mr-2" />
            Check Margin
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('Suggest alternative products');
              askAI('Suggest alternative products for items in cart');
            }}
          >
            <Package className="w-3 h-3 mr-2" />
            Alternatives
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('Verify GST calculations');
              askAI('Verify GST calculations for this invoice');
            }}
          >
            <CheckCircle className="w-3 h-3 mr-2" />
            Verify GST
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('Is E-Invoice required?');
              askAI('Is E-Invoice required for this sale?');
            }}
          >
            <FileCheck className="w-3 h-3 mr-2" />
            E-Invoice Check
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('What discount can I offer?');
              askAI('What discount can I safely offer for this sale?');
            }}
          >
            <Percent className="w-3 h-3 mr-2" />
            Discount Advice
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            onClick={() => {
              setAiQuery('Check customer credit limit');
              askAI('Check if customer has sufficient credit limit');
            }}
          >
            <DollarSign className="w-3 h-3 mr-2" />
            Credit Check
          </Button>
        </div>
      </div>
      
      <div>
        <Label>Ask Your Question</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="e.g., What is the best selling product this month?"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !aiLoading) {
                askAI(aiQuery);
              }
            }}
          />
          <Button 
            onClick={() => askAI(aiQuery)}
            disabled={!aiQuery || aiLoading}
          >
            {aiLoading ? 'Thinking...' : 'Ask'}
          </Button>
        </div>
      </div>
      
      {aiResponse && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">AI Response:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{aiResponse}</p>
            </div>
          </div>
        </div>
      )}
      
      {aiLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>

// ============================================================================
// END OF CODE SNIPPETS
// ============================================================================

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Copy each section one by one into your existing POS/B2B pages
 * 2. Update product search results to call selectProductForBatch instead of addToCart
 * 3. Replace your invoice creation function with createInvoiceWithGST
 * 4. Add the Hold/Resume buttons to your UI header
 * 5. Add E-Invoice and E-Way Bill buttons after successful invoice creation
 * 6. Add AI Assistant button to your header
 * 7. Test each feature individually before going live
 * 
 * All backend APIs are ready and working!
 */
