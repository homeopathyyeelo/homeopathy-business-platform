import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Invoice, InvoiceItem } from '@/types/sales';
import { Customer } from '@/types/customer';

interface ValidationError {
  field: string;
  message: string;
}

interface SalesValidationState {
  errors: ValidationError[];
  isValid: boolean;
  loading: boolean;
}

export function useSalesValidation() {
  const { toast } = useToast();
  const [validationState, setValidationState] = useState<SalesValidationState>({
    errors: [],
    isValid: true,
    loading: false
  });

  const validateCustomer = useCallback((customer: Partial<Customer>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!customer.firstName || customer.firstName.trim().length < 2) {
      errors.push({
        field: 'firstName',
        message: 'First name must be at least 2 characters long'
      });
    }

    // Phone validation
    if (!customer.phone || !/^\d{10}$/.test(customer.phone)) {
      errors.push({
        field: 'phone',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Email validation (if provided)
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address'
      });
    }

    // GST validation for wholesale customers
    if (customer.type === 'wholesale' && customer.gstNumber) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customer.gstNumber)) {
        errors.push({
          field: 'gstNumber',
          message: 'Please enter a valid GST number'
        });
      }
    }

    return errors;
  }, []);

  const validateInvoiceItem = useCallback((item: Partial<InvoiceItem>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Product validation
    if (!item.productId) {
      errors.push({
        field: 'productId',
        message: 'Product is required'
      });
    }

    // Quantity validation
    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        field: 'quantity',
        message: 'Quantity must be greater than 0'
      });
    }

    // Price validation
    if (!item.unitPrice || item.unitPrice <= 0) {
      errors.push({
        field: 'unitPrice',
        message: 'Unit price must be greater than 0'
      });
    }

    // Batch validation
    if (!item.batchNumber) {
      errors.push({
        field: 'batchNumber',
        message: 'Batch number is required'
      });
    }

    // Discount validation
    if (item.discountPercentage && (item.discountPercentage < 0 || item.discountPercentage > 100)) {
      errors.push({
        field: 'discountPercentage',
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    // GST validation
    if (item.gstPercentage && (item.gstPercentage < 0 || item.gstPercentage > 28)) {
      errors.push({
        field: 'gstPercentage',
        message: 'GST percentage must be between 0 and 28'
      });
    }

    return errors;
  }, []);

  const validateInvoice = useCallback((invoice: Partial<Invoice>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Customer validation
    if (!invoice.customerId) {
      errors.push({
        field: 'customerId',
        message: 'Customer is required'
      });
    }

    // Invoice number validation
    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length < 3) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number must be at least 3 characters long'
      });
    }

    // Date validation
    if (!invoice.date) {
      errors.push({
        field: 'date',
        message: 'Invoice date is required'
      });
    }

    // Items validation
    if (!invoice.items || invoice.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required'
      });
    } else {
      // Validate each item
      invoice.items.forEach((item, index) => {
        const itemErrors = validateInvoiceItem(item);
        itemErrors.forEach(error => {
          errors.push({
            field: `items[${index}].${error.field}`,
            message: `Item ${index + 1}: ${error.message}`
          });
        });
      });
    }

    // Total validation
    if (!invoice.total || invoice.total <= 0) {
      errors.push({
        field: 'total',
        message: 'Total amount must be greater than 0'
      });
    }

    // Payment validation
    if (invoice.paymentStatus === 'paid' && (!invoice.amountPaid || invoice.amountPaid < invoice.total!)) {
      errors.push({
        field: 'amountPaid',
        message: 'Paid amount must equal total amount for paid invoices'
      });
    }

    return errors;
  }, [validateInvoiceItem]);

  const validatePayment = useCallback((payment: {
    amount?: number;
    method?: string;
    details?: any;
  }): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!payment.amount || payment.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Payment amount must be greater than 0'
      });
    }

    if (!payment.method) {
      errors.push({
        field: 'method',
        message: 'Payment method is required'
      });
    }

    // Validate payment details based on method
    if (payment.method === 'card' && payment.details) {
      if (!payment.details.cardNumber || payment.details.cardNumber.length < 16) {
        errors.push({
          field: 'cardNumber',
          message: 'Valid card number is required'
        });
      }
    }

    if (payment.method === 'upi' && payment.details) {
      if (!payment.details.upiId || !/^[\w.-]+@[\w.-]+$/.test(payment.details.upiId)) {
        errors.push({
          field: 'upiId',
          message: 'Valid UPI ID is required'
        });
      }
    }

    return errors;
  }, []);

  const validateReturn = useCallback((returnData: {
    originalInvoiceId?: string;
    items?: any[];
    reason?: string;
    amount?: number;
  }): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!returnData.originalInvoiceId) {
      errors.push({
        field: 'originalInvoiceId',
        message: 'Original invoice is required'
      });
    }

    if (!returnData.items || returnData.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item must be returned'
      });
    }

    if (!returnData.reason || returnData.reason.trim().length < 5) {
      errors.push({
        field: 'reason',
        message: 'Return reason must be at least 5 characters long'
      });
    }

    if (!returnData.amount || returnData.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Return amount must be greater than 0'
      });
    }

    return errors;
  }, []);

  const runValidation = useCallback(async (
    type: 'customer' | 'invoice' | 'invoiceItem' | 'payment' | 'return',
    data: any
  ): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, loading: true }));

    try {
      let errors: ValidationError[] = [];

      switch (type) {
        case 'customer':
          errors = validateCustomer(data);
          break;
        case 'invoice':
          errors = validateInvoice(data);
          break;
        case 'invoiceItem':
          errors = validateInvoiceItem(data);
          break;
        case 'payment':
          errors = validatePayment(data);
          break;
        case 'return':
          errors = validateReturn(data);
          break;
        default:
          errors = [{ field: 'general', message: 'Unknown validation type' }];
      }

      const isValid = errors.length === 0;

      setValidationState({
        errors,
        isValid,
        loading: false
      });

      if (!isValid) {
        toast({
          title: "Validation Failed",
          description: `Found ${errors.length} validation error(s)`,
          variant: "destructive"
        });
      }

      return isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState({
        errors: [{ field: 'general', message: 'Validation failed' }],
        isValid: false,
        loading: false
      });

      toast({
        title: "Validation Error",
        description: "An error occurred during validation",
        variant: "destructive"
      });

      return false;
    }
  }, [validateCustomer, validateInvoice, validateInvoiceItem, validatePayment, validateReturn, toast]);

  const clearValidation = useCallback(() => {
    setValidationState({
      errors: [],
      isValid: true,
      loading: false
    });
  }, []);

  const getFieldError = useCallback((field: string): string | null => {
    const error = validationState.errors.find(e => e.field === field);
    return error ? error.message : null;
  }, [validationState.errors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return validationState.errors.some(e => e.field === field);
  }, [validationState.errors]);

  return {
    validationState,
    validateCustomer,
    validateInvoice,
    validateInvoiceItem,
    validatePayment,
    validateReturn,
    runValidation,
    clearValidation,
    getFieldError,
    hasFieldError
  };
}