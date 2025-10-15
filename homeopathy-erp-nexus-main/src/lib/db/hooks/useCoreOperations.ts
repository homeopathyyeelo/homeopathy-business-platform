
import { useToast } from "@/hooks/use-toast";

// Create core operations hook
export function useCoreOperations(activeDatabase: any, handleError: (error: any) => void) {
  return {
    getAll: async (collection: string) => {
      try {
        return await activeDatabase.getAll(collection);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
    
    getById: async (collection: string, id: string) => {
      try {
        return await activeDatabase.getById(collection, id);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    create: async (collection: string, item: any) => {
      try {
        return await activeDatabase.create(collection, item);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    update: async (collection: string, id: string, updates: any) => {
      try {
        return await activeDatabase.update(collection, id, updates);
      } catch (error: any) {
        handleError(error);
        return null;
      }
    },
    
    delete: async (collection: string, id: string) => {
      try {
        return await activeDatabase.delete(collection, id);
      } catch (error: any) {
        handleError(error);
        return false;
      }
    },
    
    query: async (collection: string, filters: Record<string, any>) => {
      try {
        return await activeDatabase.query(collection, filters);
      } catch (error: any) {
        handleError(error);
        return [];
      }
    },
  };
}
