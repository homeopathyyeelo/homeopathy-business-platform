
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db-client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice, InvoiceItem, Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, MinusCircle, Check, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SalesReturnDialog = ({ open, onOpenChange, onSuccess }: SalesReturnDialogProps) => {
  const { toast } = useToast();
  const { getAll, create, updateInventory } = useDatabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<{ itemId: string; quantity: number; reason: string }[]>([]);
  const [returnReason, setReturnReason] = useState<string>("damaged");
  const [returnNotes, setReturnNotes] = useState<string>("");

  // Fetch invoices and customer data
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  // Search for invoice when invoice number changes
  useEffect(() => {
    if (invoiceNumber) {
      const invoice = invoices.find((inv: Invoice) => 
        inv.invoiceNumber.toLowerCase().includes(invoiceNumber.toLowerCase())
      );
      
      if (invoice) {
        setSelectedInvoice(invoice);
        // Initialize return items with zero quantities
        setReturnItems(
          invoice.items.map(item => ({
            itemId: item.id,
            quantity: 0,
            reason: returnReason
          }))
        );
      } else {
        setSelectedInvoice(null);
        setReturnItems([]);
      }
    } else {
      setSelectedInvoice(null);
      setReturnItems([]);
    }
  }, [invoiceNumber, invoices, returnReason]);

  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Handle quantity change for return items
  const handleQuantityChange = (itemId: string, quantity: number) => {
    const invoiceItem = selectedInvoice?.items.find(item => item.id === itemId);
    
    if (invoiceItem && quantity > invoiceItem.quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Return quantity cannot exceed the original quantity (${invoiceItem.quantity}).`,
        variant: "destructive"
      });
      
      // Set to max allowed quantity
      quantity = invoiceItem.quantity;
    }
    
    setReturnItems(prev => 
      prev.map(item => 
        item.itemId === itemId ? { ...item, quantity, reason: returnReason } : item
      )
    );
  };

  // Calculate totals for return
  const calculateReturnTotal = () => {
    if (!selectedInvoice) return { subtotal: 0, gstAmount: 0, total: 0 };
    
    let subtotal = 0;
    let gstAmount = 0;
    
    returnItems.forEach(returnItem => {
      const originalItem = selectedInvoice.items.find(item => item.id === returnItem.itemId);
      if (originalItem && returnItem.quantity > 0) {
        const itemSubtotal = (originalItem.unitPrice * returnItem.quantity);
        subtotal += itemSubtotal;
        
        // Calculate GST amount proportionately
        const itemGstAmount = (originalItem.gstAmount / originalItem.quantity) * returnItem.quantity;
        gstAmount += itemGstAmount;
      }
    });
    
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  };

  const totals = calculateReturnTotal();

  // Handle return submission
  const handleSubmitReturn = async () => {
    if (!selectedInvoice) {
      toast({
        title: "No Invoice Selected",
        description: "Please select a valid invoice to process the return.",
        variant: "destructive"
      });
      return;
    }

    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast({
        title: "No Items to Return",
        description: "Please specify at least one item to return.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare return data
      const originalInvoice = selectedInvoice;
      const returnDate = new Date();
      
      // Create a return invoice (credit note)
      const returnInvoice = {
        invoiceNumber: `RET-${originalInvoice.invoiceNumber}`,
        customerId: originalInvoice.customerId,
        date: returnDate,
        items: itemsToReturn.map(returnItem => {
          const originalItem = originalInvoice.items.find(item => item.id === returnItem.itemId);
          if (!originalItem) throw new Error("Original item not found");
          
          return {
            productId: originalItem.productId,
            batchNumber: originalItem.batchNumber,
            quantity: returnItem.quantity,
            unitPrice: originalItem.unitPrice,
            gstPercentage: originalItem.gstPercentage,
            gstAmount: (originalItem.gstAmount / originalItem.quantity) * returnItem.quantity,
            total: (originalItem.total / originalItem.quantity) * returnItem.quantity
          };
        }),
        originalInvoiceId: originalInvoice.id,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        total: totals.total,
        paymentStatus: 'processed',
        type: `return_${originalInvoice.type}`,
        reason: returnReason,
        notes: returnNotes,
        createdBy: "admin"  // In a real app, use the logged-in user
      };
      
      // Create the return record
      await create('returns', returnInvoice);
      
      // Update inventory (add back the returned quantities)
      for (const returnItem of itemsToReturn) {
        const originalItem = originalInvoice.items.find(item => item.id === returnItem.itemId);
        if (originalItem && returnItem.quantity > 0) {
          await updateInventory(
            originalItem.productId, 
            originalItem.batchNumber, 
            returnItem.quantity // Adding back to inventory (positive quantity)
          );
        }
      }
      
      toast({
        title: "Return Processed Successfully",
        description: `Return for invoice ${originalInvoice.invoiceNumber} has been processed.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: "Failed to process the return. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Sales Return</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Invoice Search */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number to search"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Selected Invoice Details */}
          {selectedInvoice ? (
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">Invoice: {selectedInvoice.invoiceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    Date: {formatDate(new Date(selectedInvoice.date))} | 
                    Customer: {getCustomerName(selectedInvoice.customerId)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Total: {formatCurrency(selectedInvoice.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{selectedInvoice.paymentStatus}</span>
                  </p>
                </div>
              </div>
              
              {/* Return Reason */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnReason">Return Reason</Label>
                  <Select value={returnReason} onValueChange={setReturnReason}>
                    <SelectTrigger id="returnReason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged Product</SelectItem>
                      <SelectItem value="expired">Expired Product</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item</SelectItem>
                      <SelectItem value="quality_issue">Quality Issue</SelectItem>
                      <SelectItem value="customer_dissatisfied">Customer Dissatisfied</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="space-y-2">
                  <Label htmlFor="returnNotes">Additional Notes</Label>
                  <Textarea
                    id="returnNotes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Any additional notes about this return"
                    rows={2}
                  />
                </div>
              </div>
              
              {/* Items to Return */}
              <div>
                <h4 className="font-medium mb-2">Select Items to Return</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Original Qty</TableHead>
                      <TableHead className="text-center">Return Qty</TableHead>
                      <TableHead className="text-right">Return Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => {
                      const returnItem = returnItems.find(ri => ri.itemId === item.id);
                      const returnQty = returnItem?.quantity || 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.productId}</TableCell>
                          <TableCell>{item.batchNumber}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={returnQty}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto text-center"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice * returnQty)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <tfoot>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-medium">
                        Subtotal:
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.subtotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-medium">
                        GST Amount:
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.gstAmount)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-bold">
                        Total Return Amount:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totals.total)}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <h3 className="font-medium">No Invoice Selected</h3>
              <p className="text-sm">Enter an invoice number to process a return</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitReturn} 
            disabled={isSubmitting || !selectedInvoice || calculateReturnTotal().total <= 0}
          >
            {isSubmitting ? "Processing..." : "Process Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesReturnDialog;
