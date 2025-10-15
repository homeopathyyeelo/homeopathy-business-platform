import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db-client";
import { formatCurrency } from "@/lib/utils";

interface ReturnCreditNoteProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  onSuccess?: () => void;
}

const ReturnCreditNote = ({ isOpen, onClose, invoice, onSuccess }: ReturnCreditNoteProps) => {
  const { create, update } = useDatabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [returnData, setReturnData] = useState({
    returnNumber: `RET-${Date.now()}`,
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    refundMethod: 'cash',
    notes: '',
    items: invoice?.items?.map((item: any) => ({
      ...item,
      returnQuantity: 0,
      returnAmount: 0
    })) || []
  });

  const handleItemUpdate = (index: number, field: string, value: any) => {
    const updatedItems = [...returnData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate return amount when quantity changes
    if (field === 'returnQuantity') {
      const unitPrice = updatedItems[index].unitPrice || 0;
      updatedItems[index].returnAmount = value * unitPrice;
    }
    
    setReturnData({ ...returnData, items: updatedItems });
  };

  const totalReturnAmount = returnData.items.reduce((sum: number, item: any) => 
    sum + (item.returnAmount || 0), 0
  );

  const handleSubmit = async () => {
    const returnItems = returnData.items.filter((item: any) => (item.returnQuantity || 0) > 0);
    
    if (returnItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to return",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create return record
      const returnRecord = {
        id: `return-${Date.now()}`,
        returnNumber: returnData.returnNumber,
        originalInvoiceId: invoice.id,
        originalInvoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        returnDate: new Date(returnData.returnDate),
        reason: returnData.reason,
        refundMethod: returnData.refundMethod,
        notes: returnData.notes,
        totalReturnAmount,
        status: 'completed',
        items: returnItems,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await create('sales_returns', returnRecord);

      // Update inventory - add back returned quantities
      for (const item of returnItems) {
        // Find the inventory batch and update stock
        // This is a simplified version - in production you'd want more robust inventory management
        
        // Create stock movement record
        await create('stock_movements', {
          id: `movement-${Date.now()}-${Math.random()}`,
          movementNumber: `MOV-${Date.now()}`,
          date: new Date(),
          type: 'return',
          referenceId: returnRecord.id,
          referenceNumber: returnRecord.returnNumber,
          productId: item.productId,
          batchNumber: item.batchNumber,
          quantityIn: item.returnQuantity,
          quantityOut: 0,
          warehouseId: 'default',
          createdBy: 'system',
          notes: `Product return from invoice ${invoice.invoiceNumber}`,
          createdAt: new Date()
        });
      }

      // Create credit note if applicable
      if (returnData.refundMethod === 'credit') {
        const creditNote = {
          id: `credit-${Date.now()}`,
          creditNoteNumber: `CN-${Date.now()}`,
          customerId: invoice.customerId,
          originalInvoiceId: invoice.id,
          returnId: returnRecord.id,
          date: new Date(),
          amount: totalReturnAmount,
          status: 'active',
          notes: `Credit note for return ${returnData.returnNumber}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await create('credit_notes', creditNote);
      }

      toast({
        title: "Return Processed",
        description: `Return ${returnData.returnNumber} has been processed successfully`
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to process return: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Product Return & Credit Note</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="returnNumber">Return Number</Label>
            <Input
              id="returnNumber"
              value={returnData.returnNumber}
              onChange={(e) => setReturnData({ ...returnData, returnNumber: e.target.value })}
              disabled
            />
          </div>
          
          <div>
            <Label htmlFor="returnDate">Return Date</Label>
            <Input
              id="returnDate"
              type="date"
              value={returnData.returnDate}
              onChange={(e) => setReturnData({ ...returnData, returnDate: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="refundMethod">Refund Method</Label>
            <Select
              value={returnData.refundMethod}
              onValueChange={(value) => setReturnData({ ...returnData, refundMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash Refund</SelectItem>
                <SelectItem value="credit">Store Credit</SelectItem>
                <SelectItem value="exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="reason">Return Reason</Label>
            <Select
              value={returnData.reason}
              onValueChange={(value) => setReturnData({ ...returnData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damaged">Damaged Product</SelectItem>
                <SelectItem value="expired">Expired Product</SelectItem>
                <SelectItem value="wrong-item">Wrong Item</SelectItem>
                <SelectItem value="customer-request">Customer Request</SelectItem>
                <SelectItem value="quality-issue">Quality Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={returnData.notes}
              onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="h-10"
            />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-4">Return Items</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Sold Qty</TableHead>
                <TableHead>Return Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Return Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnData.items.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.productName || item.description}</TableCell>
                  <TableCell>{item.batchNumber || 'N/A'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={item.returnQuantity || 0}
                      onChange={(e) => handleItemUpdate(index, 'returnQuantity', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.returnAmount || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end mt-4">
            <div className="text-lg font-semibold">
              Total Return Amount: {formatCurrency(totalReturnAmount)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || totalReturnAmount === 0}
          >
            {isSubmitting ? "Processing..." : "Process Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnCreditNote;