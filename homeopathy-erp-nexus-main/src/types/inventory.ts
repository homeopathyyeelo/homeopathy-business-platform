
// Inventory-related types

import { Product } from './product';

// Category Management
export interface Category {
  id: string;
  name: string;
  description?: string;
  gstPercentage: number;
  hsnPrefix?: string; // HSN code prefix for this category
  parentId?: string; // For hierarchical categories
  isSubcategory?: boolean; // Flag to identify subcategories
  level?: number; // Level in category hierarchy (0 for main, 1+ for subcategories)
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tax Management
export interface Tax {
  id: string;
  name: string;
  percentage: number;
  type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
  hsnCode?: string;
  description?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Inventory Management
export interface Inventory {
  id: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate: Date;
  quantityInStock: number;
  purchasePrice: number;
  mrp: number; // Maximum Retail Price
  sellingPriceRetail: number;
  sellingPriceWholesale: number;
  discount?: number; // Discount percentage
  rackLocation?: string; // Physical storage location
  warehouseId?: string; // For multiple warehouses/stores
  warehouseName?: string;
  lastStockUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Stock Adjustment
export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  date: Date;
  type: 'addition' | 'reduction' | 'damage' | 'expiry' | 'sample' | 'transfer';
  items: StockAdjustmentItem[];
  reason: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  total: number;
  warehouseId?: string;
  warehouseName?: string;
  targetWarehouseId?: string; // For transfers
  targetWarehouseName?: string; // For transfers
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Stock Adjustment Items
export interface StockAdjustmentItem {
  id: string;
  adjustmentId: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  expiryDate?: Date;
  quantity: number;
  unitCost: number;
  total: number;
  reason?: string;
}

// Stock Movement
export interface StockMovement {
  id: string;
  movementNumber: string;
  date: Date;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return';
  referenceId: string; // ID of related document (purchase, invoice, adjustment)
  referenceNumber: string; // Number of related document
  productId: string;
  product?: Product;
  batchNumber: string;
  expiryDate?: Date;
  quantityIn: number;
  quantityOut: number;
  warehouseId: string;
  warehouseName?: string;
  costPrice?: number;
  sellingPrice?: number;
  createdBy: string;
  notes?: string;
  createdAt: Date;
}
