
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface DiscountSectionProps {
  subtotal: number;
  discountMode: 'none' | 'percentage' | 'amount';
  setDiscountMode: (mode: 'none' | 'percentage' | 'amount') => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  discountAmount: number;
}

const DiscountSection = ({
  subtotal,
  discountMode,
  setDiscountMode,
  discountValue,
  setDiscountValue,
  discountAmount
}: DiscountSectionProps) => {
  return (
    <div className="space-y-3 mt-4 p-3 border rounded-md">
      <h3 className="font-medium">Bill Discount</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="discountType">Discount Type</Label>
          <Select 
            value={discountMode} 
            onValueChange={(value: 'none' | 'percentage' | 'amount') => {
              setDiscountMode(value);
              if (value === 'none') {
                setDiscountValue(0);
              }
            }}
          >
            <SelectTrigger id="discountType">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Discount</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="amount">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {discountMode !== 'none' && (
          <div className="space-y-1">
            <Label htmlFor="discountValue">
              {discountMode === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
            </Label>
            <Input
              id="discountValue"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              min={0}
              max={discountMode === 'percentage' ? 100 : subtotal}
              step={discountMode === 'percentage' ? 0.5 : 1}
            />
          </div>
        )}
        
        {discountMode !== 'none' && (
          <div className="space-y-1">
            <Label>Discount Amount</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
              {formatCurrency(discountAmount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountSection;
