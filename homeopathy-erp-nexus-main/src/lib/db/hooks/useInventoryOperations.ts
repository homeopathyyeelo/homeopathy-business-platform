
// Hook for inventory operations
export function useInventoryOperations(activeDatabase: any, handleError: (error: any) => void) {
  return {
    updateInventory: async (productId: string, batchNumber: string, quantity: number) => {
      try {
        return await activeDatabase.updateInventory(productId, batchNumber, quantity);
      } catch (error: any) {
        handleError(error);
        return false;
      }
    },
    
    createBatch: async (productId: string, batchData: any) => {
      try {
        return await activeDatabase.createBatch(productId, batchData);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    getBatchesByProduct: async (productId: string) => {
      try {
        return await activeDatabase.getBatchesByProduct(productId);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    updateBatch: async (batchId: string, updates: any) => {
      try {
        return await activeDatabase.updateBatch(batchId, updates);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    getLowStockItems: async () => {
      try {
        return await activeDatabase.getLowStockItems();
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    getSoonToExpireItems: async (daysThreshold?: number) => {
      try {
        return await activeDatabase.getSoonToExpireItems(daysThreshold);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    getProductsByLocation: async (rackLocation: string) => {
      try {
        return await activeDatabase.getProductsByLocation(rackLocation);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },

    createStockMovement: async (movement: any) => {
      try {
        return await activeDatabase.createStockMovement(movement);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    getStockMovementLogs: async (filters?: any) => {
      try {
        return await activeDatabase.getStockMovementLogs(filters);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    transferStock: async (fromBatch: string, toBatch: string, quantity: number) => {
      try {
        return await activeDatabase.transferStock(fromBatch, toBatch, quantity);
      } catch (error: any) {
        handleError(error);
        return false;
      }
    }
  };
}
