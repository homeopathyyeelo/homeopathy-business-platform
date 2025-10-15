
import { useState } from "react";

export const useSaleState = (saleType: 'retail' | 'wholesale') => {
  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState<string>("");
  const [pricingLevel, setPricingLevel] = useState<string>("standard");
  const [billDiscountMode, setBillDiscountMode] = useState<'none' | 'percentage' | 'amount'>('none');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);

  return {
    date,
    setDate,
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
    setBillDiscountValue
  };
};
