// Settings & Configuration API Service
import { api } from '../api-client';

export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
  email: string;
  phone: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  fiscalYearStart: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: 'retail' | 'wholesale' | 'warehouse' | 'clinic';
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
  description?: string;
}

export interface TaxSettings {
  id: string;
  taxType: 'gst' | 'vat' | 'sales_tax';
  isEnabled: boolean;
  rates: TaxRate[];
  hsnCodes: boolean;
  eInvoice: boolean;
  eWayBill: boolean;
}

export interface TaxRate {
  name: string;
  rate: number;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'wallet';
  isActive: boolean;
  accountId?: string;
  charges?: number;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    lowStock: boolean;
    expiryAlerts: boolean;
    orderUpdates: boolean;
    paymentReminders: boolean;
  };
  sms: {
    enabled: boolean;
    lowStock: boolean;
    expiryAlerts: boolean;
    orderUpdates: boolean;
  };
  whatsapp: {
    enabled: boolean;
    orderConfirmation: boolean;
    paymentReminders: boolean;
    promotions: boolean;
  };
  push: {
    enabled: boolean;
    realTimeAlerts: boolean;
  };
}

export interface IntegrationKey {
  id: string;
  service: string;
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
}

export const settingsService = {
  // Company Settings
  getCompanies: async (): Promise<Company[]> => {
    return api.get<Company[]>('/settings/companies');
  },

  getCompany: async (id: string): Promise<Company> => {
    return api.get<Company>(`/settings/companies/${id}`);
  },

  createCompany: async (data: Partial<Company>): Promise<Company> => {
    return api.post<Company>('/settings/companies', data);
  },

  updateCompany: async (id: string, data: Partial<Company>): Promise<Company> => {
    return api.put<Company>(`/settings/companies/${id}`, data);
  },

  uploadCompanyLogo: async (companyId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.upload(`/settings/companies/${companyId}/logo`, formData);
    return response.url;
  },

  // Branch Settings
  getBranches: async (companyId?: string): Promise<Branch[]> => {
    const params = companyId ? `?company_id=${companyId}` : '';
    return api.get<Branch[]>(`/settings/branches${params}`);
  },

  getBranch: async (id: string): Promise<Branch> => {
    return api.get<Branch>(`/settings/branches/${id}`);
  },

  createBranch: async (data: Partial<Branch>): Promise<Branch> => {
    return api.post<Branch>('/settings/branches', data);
  },

  updateBranch: async (id: string, data: Partial<Branch>): Promise<Branch> => {
    return api.put<Branch>(`/settings/branches/${id}`, data);
  },

  deleteBranch: async (id: string): Promise<void> => {
    return api.delete(`/settings/branches/${id}`);
  },

  // Roles & Permissions
  getRoles: async (): Promise<Role[]> => {
    return api.get<Role[]>('/settings/roles');
  },

  getRole: async (id: string): Promise<Role> => {
    return api.get<Role>(`/settings/roles/${id}`);
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    return api.post<Role>('/settings/roles', data);
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    return api.put<Role>(`/settings/roles/${id}`, data);
  },

  deleteRole: async (id: string): Promise<void> => {
    return api.delete(`/settings/roles/${id}`);
  },

  getPermissions: async (): Promise<Permission[]> => {
    return api.get<Permission[]>('/settings/permissions');
  },

  // Tax Settings
  getTaxSettings: async (): Promise<TaxSettings> => {
    return api.get<TaxSettings>('/settings/tax');
  },

  updateTaxSettings: async (data: Partial<TaxSettings>): Promise<TaxSettings> => {
    return api.put<TaxSettings>('/settings/tax', data);
  },

  // Payment Methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    return api.get<PaymentMethod[]>('/settings/payment-methods');
  },

  createPaymentMethod: async (data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    return api.post<PaymentMethod>('/settings/payment-methods', data);
  },

  updatePaymentMethod: async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    return api.put<PaymentMethod>(`/settings/payment-methods/${id}`, data);
  },

  // AI Model Selection
  getAIModels: async (): Promise<any[]> => {
    return api.get('/settings/ai/models');
  },

  selectAIModel: async (modelId: string): Promise<any> => {
    return api.post('/settings/ai/select-model', { modelId });
  },

  getAISettings: async (): Promise<any> => {
    return api.get('/settings/ai');
  },

  updateAISettings: async (data: any): Promise<any> => {
    return api.put('/settings/ai', data);
  },

  // Email Gateway
  getEmailSettings: async (): Promise<any> => {
    return api.get('/settings/email');
  },

  updateEmailSettings: async (data: any): Promise<any> => {
    return api.put('/settings/email', data);
  },

  testEmailConnection: async (): Promise<any> => {
    return api.post('/settings/email/test');
  },

  // WhatsApp Gateway
  getWhatsAppSettings: async (): Promise<any> => {
    return api.get('/settings/whatsapp');
  },

  updateWhatsAppSettings: async (data: any): Promise<any> => {
    return api.put('/settings/whatsapp', data);
  },

  testWhatsAppConnection: async (): Promise<any> => {
    return api.post('/settings/whatsapp/test');
  },

  // Backup & Restore
  createBackup: async (): Promise<any> => {
    return api.post('/settings/backup/create');
  },

  getBackups: async (): Promise<any[]> => {
    return api.get('/settings/backup/list');
  },

  downloadBackup: async (backupId: string): Promise<void> => {
    return api.download(`/settings/backup/${backupId}/download`, `backup-${backupId}.zip`);
  },

  restoreBackup: async (backupId: string): Promise<any> => {
    return api.post(`/settings/backup/${backupId}/restore`);
  },

  scheduleBackup: async (schedule: any): Promise<any> => {
    return api.post('/settings/backup/schedule', schedule);
  },

  // Notification Settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    return api.get<NotificationSettings>('/settings/notifications');
  },

  updateNotificationSettings: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    return api.put<NotificationSettings>('/settings/notifications', data);
  },

  // Integration Keys
  getIntegrationKeys: async (): Promise<IntegrationKey[]> => {
    return api.get<IntegrationKey[]>('/settings/integrations');
  },

  createIntegrationKey: async (data: Partial<IntegrationKey>): Promise<IntegrationKey> => {
    return api.post<IntegrationKey>('/settings/integrations', data);
  },

  updateIntegrationKey: async (id: string, data: Partial<IntegrationKey>): Promise<IntegrationKey> => {
    return api.put<IntegrationKey>(`/settings/integrations/${id}`, data);
  },

  deleteIntegrationKey: async (id: string): Promise<void> => {
    return api.delete(`/settings/integrations/${id}`);
  },

  // User Access Logs
  getAccessLogs: async (params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    action?: string;
  }): Promise<any[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/settings/access-logs?${queryParams}`);
  },

  // System Settings
  getSystemSettings: async (): Promise<any> => {
    return api.get('/settings/system');
  },

  updateSystemSettings: async (data: any): Promise<any> => {
    return api.put('/settings/system', data);
  },
};
