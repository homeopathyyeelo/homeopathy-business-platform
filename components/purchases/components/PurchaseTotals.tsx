
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PurchaseTotalsProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  totalDiscountApplied?: number;
}

const PurchaseTotals = ({ subtotal, taxAmount, total, totalDiscountApplied = 0 }: PurchaseTotalsProps) => {
  const originalSubtotal = subtotal + totalDiscountApplied;
  
  return (
    <Card className="w-full max-w-md ml-auto">
      <CardHeader>
        <CardTitle className="text-lg">Purchase Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalDiscountApplied > 0 && (
          <>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Original Subtotal:</span>
              <span>₹{originalSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Total Discount:</span>
              <span>-₹{totalDiscountApplied.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span>Discounted Subtotal:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {((totalDiscountApplied / originalSubtotal) * 100).toFixed(1)}% off
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
        
        {totalDiscountApplied === 0 && (
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Tax (18% GST):</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-2">
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
        
        {totalDiscountApplied > 0 && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-sm text-green-800 font-medium">
              🎉 You saved ₹{totalDiscountApplied.toFixed(2)} with supplier discounts!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseTotals;
