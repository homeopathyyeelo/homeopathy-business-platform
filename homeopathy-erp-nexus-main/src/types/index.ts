
// Export all types from the ERP system

// Core types
export * from './product';
export * from './brand';
export * from './inventory';

// Additional product types for backward compatibility
export interface Category {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  gstPercentage?: number;
  parentId?: string;
  isSubcategory?: boolean;
  level?: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  baseUnitId?: string;
  conversionFactor?: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName?: string;
  name?: string; // Computed property for reports
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  creditLimit?: number;
  openingBalance?: number;
  outstandingBalance?: number;
  balanceType?: string;
  type?: 'retail' | 'wholesale';
  priceLevel?: 'A' | 'B' | 'C';
  active: boolean;
  isActive?: boolean; // Alias for active
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Supplier {
  id: string;
  supplierId: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
  openingBalance?: number;
  balanceType?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Sales and Invoice types
export interface InvoiceItem {
  id: string;
  productId: string;
  product?: any; // Reference to Product
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  gstPercentage?: number;
  gstAmount?: number;
  cgstPercentage?: number;
  cgstAmount?: number;
  sgstPercentage?: number;
  sgstAmount?: number;
  igstPercentage?: number;
  igstAmount?: number;
  hsnCode?: string;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount?: number;
  roundOff?: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer';
  notes?: string;
  type: 'retail' | 'wholesale' | 'return_retail' | 'return_wholesale';
  originalInvoiceId?: string; // For returns
  reason?: string; // For returns
  termsAndConditions?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Purchase types
export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier?: Supplier;
  date: Date;
  total: number;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

// Marketing types
export interface MarketingContact {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  contact_type?: string;
  category?: string;
  society?: string;
  area?: string;
  city?: string;
  is_doctor?: boolean;
  is_existing_customer?: boolean;
  customer_id?: string;
  is_subscribed?: boolean;
  created_at?: string; // From DB - string format
  updated_at?: string; // From DB - string format
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: string;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  message_content: string;
  scheduled_at?: string; // From DB - string format
  sent_at?: string; // From DB - string format
  created_by?: string;
  segment_id?: string;
  template_id?: string;
  created_at?: string; // From DB - string format
  updated_at?: string; // From DB - string format
  marketing_segments?: any;
  campaign_analytics?: any[];
}

// Tax types
export interface FinancialTax {
  id: string;
  name: string;
  description?: string;
  percentage: number;
  type?: string;
  hsn_code?: string; // Match DB column name
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// WhatsApp types
export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  is_default?: boolean;
  created_at?: string; // From DB - string format
  updated_at?: string; // From DB - string format
}

export interface WhatsAppMessage {
  id: string;
  phone_number: string;
  reference_id: string;
  message: string;
  type: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  updated_at: string;
}

// Accounting and Ledger types
export interface LedgerEntry {
  id: string;
  date: Date;
  entityId: string;
  entityType: 'customer' | 'supplier' | 'general' | 'expense' | 'income';
  entityName?: string;
  transactionType: 'invoice' | 'payment' | 'purchase' | 'refund' | 'adjustment' | 'expense';
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  relatedId?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  date: Date;
  entityId: string;
  entityType: 'customer' | 'supplier';
  entityName?: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  status: 'success' | 'pending' | 'failed';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Additional missing types
export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
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

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  date: Date;
  total: number;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
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

export interface Report {
  id: string;
  name: string;
  type: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  userId?: string;
  createdAt: Date;
}

// Re-export other types that might be needed
export type { 
  Potency, 
  MedicineForm, 
  PackSize 
} from './product';

export type { 
  INDIAN_HOMEOPATHY_BRANDS, 
  INTERNATIONAL_HOMEOPATHY_BRANDS 
} from './brand';
