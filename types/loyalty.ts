
export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  pointsPerRupee: number;
  minimumPointsRedemption: number;
  redemptionValue: number; // How much 1 point is worth in rupees
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  customerName?: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastPointsEarnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  transactionType: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  orderId?: string;
  orderAmount?: number;
  description: string;
  balanceAfter: number;
  createdAt: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string; // bronze, silver, gold, platinum
  minimumPoints: number;
  bonusMultiplier: number; // e.g. 1.0, 1.2, 1.5, 2.0
  description?: string;
  benefits?: string[];
  icon?: string;
  isActive: boolean;
}
