
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db";
import { Invoice } from "@/types";
import { WhatsApp } from "@/lib/services/whatsapp";

export const useSaleSubmission = (
  saleType: 'retail' | 'wholesale',
  onSuccess?: () => void,
  selectedCustomerId?: string,
  selectedCustomer?: any,
  date?: string,
  paymentStatus?: 'paid' | 'pending' | 'partial',
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer',
  notes?: string,
  items?: any[],
  itemsWithGst?: any[],
  billTotals?: any,
  gstTotals?: any,
  validateInventoryLevels?: () => boolean
) => {
  const { toast } = useToast();
  const { create, updateInventory } = useDatabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = async (sendToWhatsApp: boolean = false) => {
    if (!selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this sale",
        variant: "destructive"
      });
      return { success: false };
    }

    if (!items || items.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one item to the sale",
        variant: "destructive"
      });
      return { success: false };
    }

    // Check if all items have product, batch, and quantity
    const hasIncompleteItems = items.some(item => 
      !item.productId || !item.batchNumber || !item.quantity || item.quantity <= 0
    );

    if (hasIncompleteItems) {
      toast({
        title: "Incomplete Items",
        description: "Please complete all item details (product, batch, quantity)",
        variant: "destructive"
      });
      return { success: false };
    }
    
    // Validate inventory levels
    if (validateInventoryLevels && !validateInventoryLevels()) {
      return { success: false };
    }

    setIsSubmitting(true);

    try {
      // Create invoice number
      const invoicePrefix = saleType === 'retail' ? 'R-INV-' : 'W-INV-';
      const timestamp = Date.now().toString().substring(6);
      const invoiceNumber = `${invoicePrefix}${timestamp}`;
      
      const invoice: Partial<Invoice> = {
        invoiceNumber,
        customerId: selectedCustomerId,
        date: new Date(date || new Date()),
        items: itemsWithGst as any,
        subtotal: billTotals?.subtotal,
        discountAmount: billTotals?.totalDiscounts,
        discountPercentage: billTotals?.discountPercentage,
        cgstAmount: gstTotals?.cgstAmount,
        sgstAmount: gstTotals?.sgstAmount,
        igstAmount: gstTotals?.igstAmount,
        gstAmount: gstTotals?.gstAmount,
        roundOff: billTotals?.roundOff,
        total: billTotals?.total,
        paymentStatus,
        paymentMethod,
        notes,
        type: saleType,
        createdBy: "admin"  // In a real app, this would be the logged-in user
      };
      
      const createdInvoice = await create('invoices', invoice);
      
      // Update inventory (subtract quantities)
      if (items) {
        for (const item of items) {
          if (item.productId && item.batchNumber && item.quantity) {
            await updateInventory(item.productId, item.batchNumber, -item.quantity);
          }
        }
      }
      
      // Send invoice via WhatsApp if requested and customer has a phone number
      if (sendToWhatsApp && selectedCustomer?.phone) {
        await sendInvoiceViaWhatsApp(createdInvoice, selectedCustomer, invoiceNumber, billTotals?.total);
      }
      
      toast({
        title: "Sale Created",
        description: `Invoice ${invoiceNumber} has been created successfully`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return { success: true, invoice: createdInvoice };
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to create sale. Please try again.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendInvoiceViaWhatsApp = async (
    createdInvoice: any,
    customer: any,
    invoiceNumber: string,
    total: number
  ) => {
    try {
      // Format phone number to include country code if not already present
      let phoneNumber = customer.phone;
      if (!phoneNumber.startsWith("+")) {
        phoneNumber = "+91" + phoneNumber; // Assuming India country code
      }
      
      // Send invoice via WhatsApp
      const invoicePdfUrl = `https://example.com/invoices/${invoiceNumber}.pdf`; // Placeholder URL
      const customerName = customer.name || 
        `${customer.first_name || ""} ${customer.last_name || ""}`;
        
      const whatsappResult = await WhatsApp.sendInvoice(
        phoneNumber,
        invoiceNumber,
        invoicePdfUrl,
        customerName,
        total
      );
      
      if (whatsappResult.success) {
        toast({
          title: "Invoice Sent via WhatsApp",
          description: whatsappResult.message,
        });
      } else {
        toast({
          title: "WhatsApp Notification Failed",
          description: whatsappResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      toast({
        title: "WhatsApp Notification Failed",
        description: "Could not send invoice via WhatsApp. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return {
    isSubmitting,
    handleSave
  };
};
