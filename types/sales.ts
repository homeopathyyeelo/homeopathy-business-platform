
// Sales and Invoice related types

import { Product } from './product';
import { Customer } from './customer';
import { PaymentStatus, PaymentMethod, InvoiceType } from './financial';

// Invoice Management
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  date: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount: number;
  roundOff?: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: {
    cash?: number;
    card?: number;
    upi?: number;
    bankTransfer?: number;
  };
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
  type: InvoiceType;
  originalInvoiceId?: string; // For returns, reference to original invoice
  reason?: string; // For returns
  eInvoiceNumber?: string; // E-Invoice reference
  eInvoiceDate?: Date;
  eWayBillNumber?: string;
  eWayBillDate?: Date;
  warehouseId?: string; // Store/warehouse from which goods were sold
  printed: boolean;
  printCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Items
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  expiryDate?: Date;
  quantity: number;
  unitPrice: number;
  mrp?: number; // Maximum Retail Price
  discountPercentage?: number;
  discountAmount?: number;
  gstPercentage: number;
  cgstPercentage?: number;
  cgstAmount?: number;
  sgstPercentage?: number;
  sgstAmount?: number;
  igstPercentage?: number;
  igstAmount?: number;
  gstAmount: number;
  hsnCode?: string;
  total: number;
  packSize?: string;
}
