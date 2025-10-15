
// Hook to use the database with comprehensive error handling and operation logging
import { useToast } from "@/hooks/use-toast";
import { db, supabaseDb, USE_SUPABASE } from "./index";
import { getDatabaseConfig } from "@/lib/config/database-connection";
import { useState, useEffect } from "react";
import { useCoreOperations } from "./hooks/useCoreOperations";
import { useInventoryOperations } from "./hooks/useInventoryOperations";
import { useGstOperations } from "./hooks/useGstOperations";
import { useLedgerOperations } from "./hooks/useLedgerOperations";
import { useDatabaseUtils } from "./hooks/useDatabaseUtils";

// Create typed wrapper hook for database operations with enhanced logging
export function useDatabase() {
  const { toast } = useToast();
  const [activeDatabase, setActiveDatabase] = useState(USE_SUPABASE ? supabaseDb : db);
  const [databaseType, setDatabaseType] = useState<'supabase' | 'postgresql'>('supabase');
  
  // Initialize database type on component mount
  useEffect(() => {
    const initDatabaseType = async () => {
      try {
        const config = await getDatabaseConfig();
        setDatabaseType(config.type);
        setActiveDatabase(config.type === 'supabase' ? supabaseDb : db);
      } catch (error) {
        console.error('Failed to get database config:', error);
      }
    };
    initDatabaseType();
  }, []);
  
  // Enhanced error handler with detailed logging
  const handleError = (error: any, operation?: string, collection?: string) => {
    console.error(`=== DATABASE ERROR ===`);
    console.error(`Operation: ${operation || 'unknown'}`);
    console.error(`Collection: ${collection || 'unknown'}`);
    console.error(`Error:`, error);
    console.error(`=== END DATABASE ERROR ===`);
    
    const errorMessage = error?.message || 'Unknown database error';
    toast({
      title: "Database Error",
      description: errorMessage,
      variant: "destructive"
    });
  };
  
  // Update the active database when configuration changes
  useEffect(() => {
    const updateDatabase = async () => {
      try {
        const config = await getDatabaseConfig();
        setDatabaseType(config.type);
        setActiveDatabase(config.type === 'supabase' ? supabaseDb : db);
      } catch (error) {
        console.error('Failed to update database config:', error);
      }
    };
    updateDatabase();
  }, [USE_SUPABASE]);
  
  // Enhanced core operations with detailed logging
  const enhancedCoreOperations = {
    getAll: async (collection: string) => {
      try {
        console.log(`[DB] Starting getAll operation for: ${collection}`);
        const result = await activeDatabase.getAll(collection);
        console.log(`[DB] getAll completed for ${collection}, found ${result?.length || 0} items`);
        return result;
      } catch (error: any) {
        handleError(error, 'getAll', collection);
        return [];
      }
    },
    
    getById: async (collection: string, id: string) => {
      try {
        console.log(`[DB] Starting getById operation for: ${collection}, ID: ${id}`);
        const result = await activeDatabase.getById(collection, id);
        console.log(`[DB] getById completed for ${collection}/${id}:`, result ? 'found' : 'not found');
        return result;
      } catch (error: any) {
        handleError(error, 'getById', collection);
        return null;
      }
    },
    
    create: async (collection: string, item: any) => {
      try {
        console.log(`[DB] Starting create operation for: ${collection}`);
        console.log(`[DB] Create data:`, item);
        
        const result = await activeDatabase.create(collection, item);
        
        console.log(`[DB] Create completed for ${collection}:`, result);
        return result;
      } catch (error: any) {
        handleError(error, 'create', collection);
        throw error; // Re-throw for proper error handling in components
      }
    },
    
    update: async (collection: string, id: string, updates: any) => {
      try {
        console.log(`[DB] Starting update operation for: ${collection}, ID: ${id}`);
        console.log(`[DB] Update data:`, updates);
        
        const result = await activeDatabase.update(collection, id, updates);
        
        console.log(`[DB] Update completed for ${collection}/${id}:`, result);
        return result;
      } catch (error: any) {
        handleError(error, 'update', collection);
        throw error; // Re-throw for proper error handling in components
      }
    },
    
    delete: async (collection: string, id: string) => {
      try {
        console.log(`[DB] Starting delete operation for: ${collection}, ID: ${id}`);
        
        const result = await activeDatabase.delete(collection, id);
        
        console.log(`[DB] Delete completed for ${collection}/${id}:`, result ? 'success' : 'failed');
        return result;
      } catch (error: any) {
        handleError(error, 'delete', collection);
        return false;
      }
    },
    
    query: async (collection: string, filters: Record<string, any>) => {
      try {
        console.log(`[DB] Starting query operation for: ${collection}`);
        console.log(`[DB] Query filters:`, filters);
        
        const result = await activeDatabase.query(collection, filters);
        
        console.log(`[DB] Query completed for ${collection}, found ${result?.length || 0} items`);
        return result;
      } catch (error: any) {
        handleError(error, 'query', collection);
        return [];
      }
    }
  };
  
  // Initialize other operations from hooks
  const inventoryOperations = useInventoryOperations(activeDatabase, handleError);
  const gstOperations = useGstOperations(activeDatabase, handleError);
  const ledgerOperations = useLedgerOperations(activeDatabase, handleError);

  return {
    ...enhancedCoreOperations,
    ...inventoryOperations,
    ...gstOperations,
    ...ledgerOperations,
    databaseType,  // Expose the database type for UI feedback
    
    // Method to reinitialize the database
    reinitialize: async () => {
      try {
        console.log('[DB] Reinitializing database connection...');
        const { initializeDatabase } = await import('./index');
        await initializeDatabase();
        setActiveDatabase(USE_SUPABASE ? supabaseDb : db);
        
        const config = await getDatabaseConfig();
        setDatabaseType(config.type);
        
        toast({
          title: "Database Reinitialized", 
          description: `Connected to ${config.type === 'supabase' ? 'Supabase' : 'PostgreSQL'} database`,
        });
        
        console.log('[DB] Database reinitializtion completed successfully');
        return true;
      } catch (error: any) {
        handleError(error, 'reinitialize');
        return false;
      }
    }
  };
}
