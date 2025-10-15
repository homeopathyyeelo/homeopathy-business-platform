
import { Customer } from './customer';

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
  hsnCode?: string;  // Changed from hsn_code to match TypeScript conventions
  description?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  paymentMethod?: string;
  reference?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GSTReturn {
  id: string;
  period: string;
  gstr1Data: any;
  gstr2Data: any;
  gstr3bData: any;
  status: 'pending' | 'filed' | 'verified';
  filingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: string; // 'invoice', 'payment', 'order_status', etc.
  content: string;
  is_default: boolean;
  created_at: string; // From the database these are strings
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  phone_number: string;
  reference_id: string; // Invoice number, payment ID, etc.
  message: string;
  type: string; // 'invoice', 'payment', 'order_status', etc.
  status: string; // 'sent', 'delivered', 'read', 'failed'
  sent_at: string;
  updated_at: string;
}

// Add missing type exports that were referenced in other files
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit' | 'wallet' | 'other';
export type InvoiceType = 'retail' | 'wholesale' | 'return' | 'estimate' | 'return_retail' | 'return_wholesale';
