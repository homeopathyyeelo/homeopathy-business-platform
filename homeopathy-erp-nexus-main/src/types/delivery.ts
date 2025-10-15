
export interface Delivery {
  id: string;
  orderId: string;
  orderType: 'retail' | 'wholesale';
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  assignedTo?: string; // Staff ID or 3PL provider
  assignedToName?: string; 
  deliveryStatus: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  deliveryDate?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  paymentCollected?: boolean;
  paymentAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryTracking {
  id: string;
  deliveryId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';
  location?: string;
  notes?: string;
  timestamp: Date;
  updatedBy: string;
}

export interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  currentStatus: 'available' | 'busy' | 'offline';
  completedDeliveries: number;
  rating?: number;
}

export interface ThirdPartyProvider {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  isActive: boolean;
  trackingUrlTemplate?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  areas: string[];
  pincodes: string[];
  deliveryCharge: number;
  minOrderValueForFreeDelivery?: number;
  estimatedDeliveryTimeInHours: number;
}
