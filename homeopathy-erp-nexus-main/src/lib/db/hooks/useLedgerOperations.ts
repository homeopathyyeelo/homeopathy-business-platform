
// Hook for ledger operations
export function useLedgerOperations(activeDatabase: any, handleError: (error: any) => void) {
  return {
    getLedgerEntries: async (entityId: string, type: 'customer' | 'supplier') => {
      try {
        return await activeDatabase.getLedgerEntries(entityId, type);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    createLedgerEntry: async (entry: any) => {
      try {
        return await activeDatabase.createLedgerEntry(entry);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    getTrialBalance: async () => {
      try {
        return await activeDatabase.getTrialBalance();
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    recordPayment: async (payment: any) => {
      try {
        return await activeDatabase.recordPayment(payment);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    getOutstandingPayments: async (entityId: string, type: 'customer' | 'supplier') => {
      try {
        return await activeDatabase.getOutstandingPayments(entityId, type);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    generateAccountingReports: async (reportType: string, period: string) => {
      try {
        return await activeDatabase.generateAccountingReports(reportType, period);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    }
  };
}
