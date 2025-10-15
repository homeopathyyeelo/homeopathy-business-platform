
// Purchase-related types

import { Product } from './product';
import { Supplier } from './supplier';
import { PaymentStatus, PaymentMethod } from './financial';

// Purchase Management
export interface Purchase {
  id: string;
  purchaseNumber: string;
  invoiceNumber: string;
  purchaseOrderId?: string; // Reference to PO if created from PO
  challanNumber?: string;
  supplierId: string;
  supplier?: Supplier;
  date: Date;
  challanDate?: Date;
  lrDate?: Date;
  items: PurchaseItem[];
  subtotal: number;
  discountAmount?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  roundOff?: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus: PaymentStatus;
  paymentDueDate?: Date;
  paymentMethod?: PaymentMethod;
  paymentDetails?: {
    cash?: number;
    bankTransfer?: number;
  };
  cases?: number;
  transport?: string;
  createdBy: string;
  notes?: string;
  warehouseId?: string; // For multi-warehouse support
  warehouseName?: string;
  grn?: string; // Goods Receipt Note
  grnDate?: Date;
  grnStatus?: 'pending' | 'partial' | 'complete';
  status: 'pending' | 'approved' | 'received' | 'returned';
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Items
export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  packSize?: string; // 30ML, 100ML, etc
  packSizeId?: string;
  hsnCode: string;
  manufacturerName?: string; // SBL, PATIT, etc
  manufacturingDate?: Date;
  expiryDate: Date;
  quantity: number;
  receivedQuantity?: number; // For partial receipts
  freeQuantity?: number; // Free items
  rate: number;
  mrp: number; // Maximum Retail Price
  taxableAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  cgstPercentage: number;
  cgstAmount: number;
  sgstPercentage: number;
  sgstAmount: number;
  igstPercentage: number;
  igstAmount: number;
  total: number;
  rackLocation?: string;
}

// Purchase Order Management
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  date: Date;
  expectedDeliveryDate?: Date;
  items: PurchaseOrderItem[];
  subtotal: number;
  estimatedTax: number;
  estimatedTotal: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  notes?: string;
  approvedBy?: string;
  createdBy: string;
  warehouseId?: string;
  warehouseName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Order Items
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  estimatedPrice: number;
  notes?: string;
}
