
// Core types used across multiple domains

// User and Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory' | 'accountant' | 'purchase';
  permissions?: string[];
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse Management
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Notification system
export interface Notification {
  id: string;
  userId: string | null; // Null for system-wide notifications
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedEntityType?: 'product' | 'customer' | 'invoice' | 'purchase' | 'stock';
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: Date;
}
