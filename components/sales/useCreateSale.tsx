
import { useState, useEffect } from "react";
import { useCustomerSelector } from "./hooks/useCustomerSelector";
import { useDiscountCalculator } from "./hooks/useDiscountCalculator";
import { useGstHandler } from "./hooks/useGstHandler";
import { useInventoryItemManager } from "./hooks/useInventoryItemManager";
import { useSaleSubmission } from "./hooks/useSaleSubmission";
import { golangAPI } from "@/lib/api";

export const useCreateSale = (saleType: 'retail' | 'wholesale', onSuccess?: () => void) => {
  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState<string>("");
  const [pricingLevel, setPricingLevel] = useState<string>("standard");
  const [billDiscountMode, setBillDiscountMode] = useState<'none' | 'percentage' | 'amount'>('none');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);

  // Customer Profile State
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Use customer selector hook
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    filteredCustomers,
    selectedCustomer
  } = useCustomerSelector(saleType);

  // Fetch customer profile when selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerProfile(selectedCustomerId);
    } else {
      setCustomerProfile(null);
    }
  }, [selectedCustomerId]);

  const fetchCustomerProfile = async (customerId: string) => {
    try {
      setLoadingProfile(true);
      const response = await golangAPI.get(`/api/erp/customers/${customerId}/profile`);
      if (response.data?.success) {
        setCustomerProfile(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

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
    customerProfile,
    loadingProfile,

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
