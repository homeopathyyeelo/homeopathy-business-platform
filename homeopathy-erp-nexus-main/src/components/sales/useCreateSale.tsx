
import { useState } from "react";
import { useCustomerSelector } from "./hooks/useCustomerSelector";
import { useDiscountCalculator } from "./hooks/useDiscountCalculator";
import { useGstHandler } from "./hooks/useGstHandler";
import { useInventoryItemManager } from "./hooks/useInventoryItemManager";
import { useSaleSubmission } from "./hooks/useSaleSubmission";

export const useCreateSale = (saleType: 'retail' | 'wholesale', onSuccess?: () => void) => {
  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState<string>("");
  const [pricingLevel, setPricingLevel] = useState<string>("standard");
  const [billDiscountMode, setBillDiscountMode] = useState<'none' | 'percentage' | 'amount'>('none');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);

  // Use customer selector hook
  const { 
    selectedCustomerId, 
    setSelectedCustomerId, 
    filteredCustomers,
    selectedCustomer
  } = useCustomerSelector(saleType);
  
  // Use inventory item manager hook
  const {
    items,
    setItems,
    products,
    inventoryItems,
    addItem,
    removeItem,
    updateItem,
    validateInventoryLevels
  } = useInventoryItemManager(saleType, selectedCustomerId, pricingLevel);
  
  // Use GST handler hook
  const { itemsWithGst, gstTotals } = useGstHandler(items, selectedCustomer, saleType);
  
  // Use discount calculator hook
  const { billTotals } = useDiscountCalculator(itemsWithGst, billDiscountMode, billDiscountValue);

  // Use sale submission hook
  const { isSubmitting, handleSave } = useSaleSubmission(
    saleType,
    onSuccess,
    selectedCustomerId,
    selectedCustomer,
    date,
    paymentStatus,
    paymentMethod,
    notes,
    items,
    itemsWithGst,
    billTotals,
    gstTotals,
    validateInventoryLevels
  );

  return {
    // State
    date,
    setDate,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentStatus,
    setPaymentStatus,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    pricingLevel,
    setPricingLevel,
    billDiscountMode,
    setBillDiscountMode,
    billDiscountValue,
    setBillDiscountValue,
    items,
    isSubmitting,
    
    // Data
    filteredCustomers,
    products,
    inventoryItems,
    totals: billTotals,
    gstTotals,
    
    // Methods
    addItem,
    removeItem,
    updateItem,
    handleSave
  };
};
