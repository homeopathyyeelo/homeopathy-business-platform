
import { useState } from "react";
import { useDatabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: any | null;
  products: any[];
  onAdjustmentComplete?: () => void;
}

const StockAdjustmentDialog = ({
  isOpen,
  onClose,
  inventoryItem,
  products,
  onAdjustmentComplete
}: StockAdjustmentDialogProps) => {
  const { updateBatch } = useDatabase();
  const { toast } = useToast();
  
  const [adjustment, setAdjustment] = useState({
    quantity: 0,
    reason: "adjustment",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const product = products.find(p => p.id === inventoryItem?.productId);
  const currentQuantity = inventoryItem?.quantityInStock || 0;
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustment({
      ...adjustment,
      quantity: Number(e.target.value)
    });
  };
  
  const handleReasonChange = (value: string) => {
    setAdjustment({
      ...adjustment,
      reason: value
    });
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdjustment({
      ...adjustment,
      notes: e.target.value
    });
  };
  
  const handleSubmit = async () => {
    if (!inventoryItem) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the batch with the new quantity
      await updateBatch(inventoryItem.id, {
        quantityInStock: adjustment.quantity
      });
      
      toast({
        title: "Stock Updated",
        description: `Stock quantity updated successfully for ${product?.name}`
      });
      
      if (onAdjustmentComplete) {
        onAdjustmentComplete();
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update stock: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!inventoryItem) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Product</Label>
            <Input 
              value={product?.name || 'Unknown Product'} 
              disabled 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Batch Number</Label>
            <Input 
              value={inventoryItem.batchNumber || 'N/A'} 
              disabled 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Current Quantity</Label>
            <Input 
              value={currentQuantity} 
              disabled 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="quantity">New Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={adjustment.quantity}
              onChange={handleQuantityChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={adjustment.reason}
              onValueChange={handleReasonChange}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">Stock Count Adjustment</SelectItem>
                <SelectItem value="damaged">Damaged Goods</SelectItem>
                <SelectItem value="expired">Expired Products</SelectItem>
                <SelectItem value="returned">Customer Return</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={adjustment.notes}
              onChange={handleNotesChange}
              placeholder="Enter additional details"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
