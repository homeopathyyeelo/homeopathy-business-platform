
// Supplier-related types

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  openingBalance?: number;
  balanceType?: 'credit' | 'debit';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
