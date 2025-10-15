
// Report-related types

// Reports
export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'purchase' | 'accounting' | 'customer' | 'gst' | 'profitloss';
  parameters: Record<string, any>;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  generateDate: Date;
  generatedBy: string;
  data?: any;
  summary?: any;
  format: 'pdf' | 'excel' | 'csv';
  createdAt: Date;
}
