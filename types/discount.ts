
// Supplier discount management types

export interface SupplierDiscount {
  id: string;
  supplierId: string;
  discountType: 'brand' | 'category' | 'volume' | 'payment_terms';
  brandId?: string;
  categoryId?: string;
  minQuantity?: number;
  minAmount?: number;
  discountPercentage: number;
  discountAmount?: number;
  validFrom: Date;
  validUntil?: Date;
  paymentTermsDays?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountCalculation {
  brandDiscount: number;
  categoryDiscount: number;
  volumeDiscount: number;
  paymentDiscount: number;
  totalDiscount: number;
  originalAmount: number;
  discountedAmount: number;
  breakdown: {
    type: string;
    percentage: number;
    amount: number;
    reason: string;
  }[];
}

export interface PriceCalculation {
  originalRate: number;
  discountedRate: number;
  marginPercentage: number;
  suggestedRetailPrice: number;
  suggestedWholesalePrice: number;
  mrp: number;
}
