
// Customer-related types

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  name: string; // Computed property for full name
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  type: 'retail' | 'wholesale'; // Added missing type field
  creditLimit?: number;
  openingBalance?: number;
  outstandingBalance?: number; // Added missing field
  balanceType?: 'credit' | 'debit';
  priceLevel?: 'A' | 'B' | 'C'; // Added missing field
  isActive: boolean;
  active?: boolean; // For backward compatibility
  createdAt: Date;
  updatedAt: Date;
}
