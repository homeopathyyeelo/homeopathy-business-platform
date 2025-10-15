
import { useMemo } from 'react';
import { InvoiceItem } from "@/types";

type DiscountMode = 'none' | 'percentage' | 'amount';

/**
 * Custom hook to handle discount calculations for both item and bill level
 */
export const useDiscountCalculator = (
  items: Partial<InvoiceItem>[],
  billDiscountMode: DiscountMode = 'none',
  billDiscountValue: number = 0
) => {

  // Calculate item-level totals including discounts
  const itemTotals = useMemo(() => {
    return items.map(item => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const subtotal = quantity * unitPrice;
      
      // Calculate item discount if present
      const itemDiscountAmount = 
        item.discountPercentage ? 
          subtotal * (item.discountPercentage / 100) : 
          (item.discountAmount || 0);
      
      // Apply GST on discounted price
      const afterDiscount = subtotal - itemDiscountAmount;
      const gstAmount = afterDiscount * ((item.gstPercentage || 0) / 100);
      
      return {
        subtotal,
        discountAmount: itemDiscountAmount,
        afterDiscount,
        gstAmount,
        total: afterDiscount + gstAmount
      };
    });
  }, [items]);
  
  // Calculate bill totals
  const billTotals = useMemo(() => {
    const subtotal = itemTotals.reduce((sum, item) => sum + item.subtotal, 0);
    const itemDiscounts = itemTotals.reduce((sum, item) => sum + item.discountAmount, 0);
    const afterItemDiscounts = subtotal - itemDiscounts;
    
    // Calculate bill-level discount
    let billDiscountAmount = 0;
    if (billDiscountMode === 'percentage') {
      billDiscountAmount = afterItemDiscounts * (billDiscountValue / 100);
    } else if (billDiscountMode === 'amount') {
      billDiscountAmount = Math.min(billDiscountValue, afterItemDiscounts); // Can't discount more than total
    }
    
    const afterAllDiscounts = afterItemDiscounts - billDiscountAmount;
    const gstAmount = itemTotals.reduce((sum, item) => sum + item.gstAmount, 0);
    
    // Apply rounding if needed (to nearest rupee)
    const totalBeforeRounding = afterAllDiscounts + gstAmount;
    const roundedTotal = Math.round(totalBeforeRounding);
    const roundOff = roundedTotal - totalBeforeRounding;
    
    return {
      subtotal,
      itemDiscounts,
      billDiscountAmount,
      totalDiscounts: itemDiscounts + billDiscountAmount,
      discountedSubtotal: afterAllDiscounts,
      gstAmount,
      roundOff,
      total: roundedTotal
    };
  }, [itemTotals, billDiscountMode, billDiscountValue]);
  
  return {
    itemTotals,
    billTotals,
    hasItemDiscounts: itemTotals.some(item => item.discountAmount > 0),
    hasBillDiscount: billTotals.billDiscountAmount > 0,
    hasAnyDiscount: billTotals.totalDiscounts > 0
  };
};
