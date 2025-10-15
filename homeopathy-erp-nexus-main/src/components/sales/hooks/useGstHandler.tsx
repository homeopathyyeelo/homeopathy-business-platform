
import { useMemo } from 'react';
import { InvoiceItem, Customer } from "@/types";

/**
 * Custom hook to handle GST calculations based on customer type
 */
export const useGstHandler = (
  items: Partial<InvoiceItem>[],
  selectedCustomer?: Customer | null,
  saleType: 'retail' | 'wholesale' = 'retail'
) => {
  
  // Determine if GST should be applied based on customer type and GST number
  const shouldApplyGst = useMemo(() => {
    if (saleType === 'wholesale') {
      return true; // Always apply GST for wholesale
    } else if (selectedCustomer?.gstNumber) {
      return true; // Apply GST if retail customer has GST number
    }
    return false; // Don't apply GST for retail without GST number
  }, [selectedCustomer, saleType]);
  
  // Determine if we should split CGST/SGST or use IGST
  const useIgst = useMemo(() => {
    if (!selectedCustomer) return false;
    
    // Check if customer is in a different state
    // This is a simplified implementation; in a real app, you'd compare states
    return selectedCustomer.state !== 'Karnataka'; // Example: Assuming business is in Karnataka
  }, [selectedCustomer]);
  
  // Calculate GST for each item
  const itemsWithGst = useMemo(() => {
    return items.map(item => {
      if (!item.productId || !shouldApplyGst) return item;
      
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const subtotal = quantity * unitPrice;
      
      // Apply discount if available
      const discountAmount = 
        item.discountPercentage ? 
          subtotal * (item.discountPercentage / 100) : 
          (item.discountAmount || 0);
      
      const afterDiscount = subtotal - discountAmount;
      
      // Calculate GST
      const gstPercentage = item.gstPercentage || 0;
      const gstAmount = afterDiscount * (gstPercentage / 100);
      
      // Split GST if not IGST
      const updatedItem = { ...item, gstAmount };
      
      if (useIgst) {
        updatedItem.igstPercentage = gstPercentage;
        updatedItem.igstAmount = gstAmount;
      } else {
        // Split GST equally into CGST and SGST
        updatedItem.cgstPercentage = gstPercentage / 2;
        updatedItem.cgstAmount = gstAmount / 2;
        updatedItem.sgstPercentage = gstPercentage / 2;
        updatedItem.sgstAmount = gstAmount / 2;
      }
      
      return updatedItem;
    });
  }, [items, shouldApplyGst, useIgst]);
  
  // Calculate total GST values
  const gstTotals = useMemo(() => {
    return itemsWithGst.reduce((totals, item) => {
      return {
        cgstAmount: totals.cgstAmount + (item.cgstAmount || 0),
        sgstAmount: totals.sgstAmount + (item.sgstAmount || 0),
        igstAmount: totals.igstAmount + (item.igstAmount || 0),
        gstAmount: totals.gstAmount + (item.gstAmount || 0)
      };
    }, { cgstAmount: 0, sgstAmount: 0, igstAmount: 0, gstAmount: 0 });
  }, [itemsWithGst]);
  
  return {
    shouldApplyGst,
    useIgst,
    itemsWithGst,
    gstTotals
  };
};
