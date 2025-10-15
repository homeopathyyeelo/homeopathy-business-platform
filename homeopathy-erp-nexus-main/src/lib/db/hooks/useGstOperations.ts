
// Hook for GST and Invoice operations
export function useGstOperations(activeDatabase: any, handleError: (error: any) => void) {
  return {
    generateEInvoice: async (invoiceId: string) => {
      try {
        return await activeDatabase.generateEInvoice(invoiceId);
      } catch (error: any) {
        handleError(error);
        return { success: false, error: error.message };
      }
    },
    
    generateEWayBill: async (invoiceId: string) => {
      try {
        return await activeDatabase.generateEWayBill(invoiceId);
      } catch (error: any) {
        handleError(error);
        return { success: false, error: error.message };
      }
    },
    
    getGSTReturns: async (period: string) => {
      try {
        return await activeDatabase.getGSTReturns(period);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    }
  };
}
