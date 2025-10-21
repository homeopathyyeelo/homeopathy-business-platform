// Finance & Accounting API Service
import { api, PaginatedResponse } from '../api-client';

export interface Ledger {
  id: string;
  date: string;
  type: 'sales' | 'purchase' | 'payment' | 'receipt' | 'journal' | 'contra';
  reference: string;
  accountHead: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: 'payment' | 'receipt' | 'journal' | 'contra';
  date: string;
  amount: number;
  fromAccount: string;
  toAccount: string;
  paymentMode?: string;
  reference?: string;
  narration: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: string;
  subcategory?: string;
  amount: number;
  paymentMode: string;
  reference?: string;
  description: string;
  attachmentUrl?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
}

export interface GSTReport {
  period: string;
  gstr1: {
    b2b: number;
    b2c: number;
    exports: number;
    totalTaxable: number;
    totalTax: number;
  };
  gstr3b: {
    outwardSupplies: number;
    inwardSupplies: number;
    itcAvailable: number;
    itcReversed: number;
    netTax: number;
  };
}

export interface TrialBalance {
  accountHead: string;
  debit: number;
  credit: number;
}

export interface ProfitLoss {
  period: string;
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    purchases: number;
    operatingExpenses: number;
    salaries: number;
    rent: number;
    utilities: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheet {
  date: string;
  assets: {
    currentAssets: {
      cash: number;
      bank: number;
      inventory: number;
      receivables: number;
      other: number;
      total: number;
    };
    fixedAssets: {
      land: number;
      building: number;
      equipment: number;
      furniture: number;
      vehicles: number;
      total: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      payables: number;
      shortTermLoans: number;
      other: number;
      total: number;
    };
    longTermLiabilities: {
      loans: number;
      other: number;
      total: number;
    };
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    reserves: number;
    retainedEarnings: number;
    total: number;
  };
}

export const financeService = {
  // Ledgers
  getSalesLedger: async (params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
  }): Promise<Ledger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Ledger[]>(`/finance/ledger/sales?${queryParams}`);
  },

  getPurchaseLedger: async (params?: {
    startDate?: string;
    endDate?: string;
    vendorId?: string;
  }): Promise<Ledger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Ledger[]>(`/finance/ledger/purchase?${queryParams}`);
  },

  getCashBook: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Ledger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Ledger[]>(`/finance/cash-book?${queryParams}`);
  },

  getBankBook: async (params?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<Ledger[]> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<Ledger[]>(`/finance/bank-book?${queryParams}`);
  },

  // Vouchers
  getVouchers: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Voucher>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Voucher>>(`/finance/vouchers?${queryParams}`);
  },

  createVoucher: async (data: Partial<Voucher>): Promise<Voucher> => {
    return api.post<Voucher>('/finance/vouchers', data);
  },

  getVoucher: async (id: string): Promise<Voucher> => {
    return api.get<Voucher>(`/finance/vouchers/${id}`);
  },

  printVoucher: async (id: string): Promise<void> => {
    return api.download(`/finance/vouchers/${id}/print`, `voucher-${id}.pdf`);
  },

  // Expenses
  getExpenses: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Expense>> => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get<PaginatedResponse<Expense>>(`/finance/expenses?${queryParams}`);
  },

  createExpense: async (data: Partial<Expense>): Promise<Expense> => {
    return api.post<Expense>('/finance/expenses', data);
  },

  approveExpense: async (id: string): Promise<Expense> => {
    return api.post<Expense>(`/finance/expenses/${id}/approve`);
  },

  rejectExpense: async (id: string, reason: string): Promise<Expense> => {
    return api.post<Expense>(`/finance/expenses/${id}/reject`, { reason });
  },

  uploadExpenseAttachment: async (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload(`/finance/expenses/${id}/upload`, formData);
  },

  // GST Reports
  getGSTReport: async (period: string): Promise<GSTReport> => {
    return api.get<GSTReport>(`/finance/gst-report?period=${period}`);
  },

  downloadGSTR1: async (period: string): Promise<void> => {
    return api.download(`/finance/gst/gstr1?period=${period}`, `gstr1-${period}.json`);
  },

  downloadGSTR3B: async (period: string): Promise<void> => {
    return api.download(`/finance/gst/gstr3b?period=${period}`, `gstr3b-${period}.json`);
  },

  // Financial Statements
  getTrialBalance: async (date: string): Promise<TrialBalance[]> => {
    return api.get<TrialBalance[]>(`/finance/trial-balance?date=${date}`);
  },

  getProfitLoss: async (startDate: string, endDate: string): Promise<ProfitLoss> => {
    return api.get<ProfitLoss>(`/finance/profit-loss?start_date=${startDate}&end_date=${endDate}`);
  },

  getBalanceSheet: async (date: string): Promise<BalanceSheet> => {
    return api.get<BalanceSheet>(`/finance/balance-sheet?date=${date}`);
  },

  // Bank Reconciliation
  getBankReconciliation: async (accountId: string, month: string): Promise<any> => {
    return api.get(`/finance/bank-reconciliation?account_id=${accountId}&month=${month}`);
  },

  reconcileTransaction: async (transactionId: string, bankStatementId: string): Promise<any> => {
    return api.post('/finance/bank-reconciliation/reconcile', { transactionId, bankStatementId });
  },

  // Petty Cash
  getPettyCash: async (): Promise<any> => {
    return api.get('/finance/petty-cash');
  },

  addPettyCashEntry: async (data: any): Promise<any> => {
    return api.post('/finance/petty-cash', data);
  },
};
