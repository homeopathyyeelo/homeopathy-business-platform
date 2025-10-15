
// Accounting and Ledger types

import { PaymentMethod } from './financial';

// Accounting and Ledger
export interface LedgerEntry {
  id: string;
  date: Date;
  entityId: string; // Customer or Supplier ID
  entityType: 'customer' | 'supplier' | 'general' | 'expense' | 'income';
  entityName?: string;
  transactionType: 'invoice' | 'payment' | 'purchase' | 'refund' | 'adjustment' | 'expense';
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  relatedId?: string; // ID of related document (invoice, purchase, etc.)
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Transactions
export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  date: Date;
  entityId: string; // Customer or Supplier ID
  entityType: 'customer' | 'supplier';
  entityName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // Check number, transaction ID, etc.
  status: 'success' | 'pending' | 'failed';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
