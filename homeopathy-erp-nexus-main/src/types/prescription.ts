
export interface Prescription {
  id: string;
  patientId: string;
  doctorName: string;
  prescriptionDate: Date;
  expiryDate: Date | null;
  notes: string | null;
  status: 'active' | 'completed' | 'expired';
  isRecurring: boolean;
  refillPeriodDays: number | null;
  nextRefillDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  productId: string;
  productName?: string;
  dosage: string;
  duration: string;
  instructions: string | null;
  quantity: number;
  refillsAllowed: number;
  refillsUsed: number;
}

export interface PrescriptionReminder {
  id: string;
  prescriptionId: string;
  patientId: string;
  reminderDate: Date;
  reminderType: 'refill' | 'expiry' | 'followup';
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  sentVia: 'whatsapp' | 'sms' | 'email' | null;
  sentAt: Date | null;
  message: string | null;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  contact: string | null;
  email: string | null;
  address: string | null;
  registrationNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderSettings = {
  enabled: boolean;
  daysBeforeRefill: number;
  daysBeforeExpiry: number;
  defaultChannel: 'whatsapp' | 'sms' | 'email';
  defaultMessage: string;
  sendTime: string; // In 24-hour format, e.g. "09:00"
}
