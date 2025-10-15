
// Core database operations with proper error handling and persistence
import { supabase } from '@/integrations/supabase/client';

class CoreDatabase {
  // Get all records from a collection
  async getAll(collection: string): Promise<any[]> {
    console.log(`[CoreDB] Getting all items from ${collection}`);
    
    try {
      const { data, error } = await supabase
        .from(collection as any)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error(`Error fetching ${collection}:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully fetched ${data?.length || 0} items from ${collection}`);
      return data || [];
    } catch (error) {
      console.error(`Database error in getAll(${collection}):`, error);
      throw error;
    }
  }

  // Get single record by ID
  async getById(collection: string, id: string): Promise<any | null> {
    console.log(`[CoreDB] Getting item by id from ${collection}: ${id}`);
    
    try {
      const { data, error } = await supabase
        .from(collection as any)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching ${collection} by id:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully fetched item from ${collection}:`, data);
      return data;
    } catch (error) {
      console.error(`Database error in getById(${collection}, ${id}):`, error);
      throw error;
    }
  }

  // Create new record
  async create(collection: string, item: any): Promise<any> {
    console.log(`[CoreDB] Creating item in ${collection}:`, item);
    
    try {
      // Ensure required timestamps are set
      const itemWithTimestamps = {
        ...item,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(collection as any)
        .insert(itemWithTimestamps)
        .select()
        .single();
        
      if (error) {
        console.error(`Error creating item in ${collection}:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully created item in ${collection}:`, data);
      return data;
    } catch (error) {
      console.error(`Database error in create(${collection}):`, error);
      throw error;
    }
  }

  // Update existing record - THIS IS THE KEY FIX
  async update(collection: string, id: string, updates: any): Promise<any> {
    console.log(`[CoreDB] Updating item in ${collection} with ID ${id}:`, updates);
    
    try {
      // Always update the updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined values to prevent database errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updatesWithTimestamp).filter(([_, value]) => value !== undefined)
      );
      
      console.log(`[CoreDB] Clean updates for ${collection}:`, cleanUpdates);
      
      const { data, error } = await supabase
        .from(collection as any)
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating item in ${collection}:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully updated item in ${collection}:`, data);
      return data;
    } catch (error) {
      console.error(`Database error in update(${collection}, ${id}):`, error);
      throw error;
    }
  }

  // Delete record
  async delete(collection: string, id: string): Promise<boolean> {
    console.log(`[CoreDB] Deleting item from ${collection}: ${id}`);
    
    try {
      const { error } = await supabase
        .from(collection as any)
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting from ${collection}:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully deleted item from ${collection}: ${id}`);
      return true;
    } catch (error) {
      console.error(`Database error in delete(${collection}, ${id}):`, error);
      throw error;
    }
  }

  // Query with filters
  async query(collection: string, filters: Record<string, any>): Promise<any[]> {
    console.log(`[CoreDB] Querying ${collection} with filters:`, filters);
    
    try {
      let query = supabase.from(collection as any).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error querying ${collection}:`, error);
        throw error;
      }
      
      console.log(`[CoreDB] Successfully queried ${collection}, found ${data?.length || 0} items`);
      return data || [];
    } catch (error) {
      console.error(`Database error in query(${collection}):`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const coreDb = new CoreDatabase();

// Additional specialized database operations
export const purchaseOrderDb = {
  createPurchaseOrder: async (order: any) => coreDb.create('purchase_orders', order),
  updatePurchaseOrderStatus: async (id: string, status: string) => 
    coreDb.update('purchase_orders', id, { status }),
  convertPOToPurchase: async (poId: string) => {
    // Implementation for converting PO to purchase
    console.log(`Converting PO ${poId} to purchase`);
    return true;
  }
};

export const reportDb = {
  generateReport: async (reportData: any) => coreDb.create('reports', reportData),
  saveReport: async (report: any) => coreDb.create('reports', report)
};

export const userDb = {
  authenticateUser: async (email: string, password: string) => {
    // Implementation for user authentication
    console.log(`Authenticating user: ${email}`);
    return null;
  },
  getUserByRole: async (role: string) => coreDb.query('users', { role }),
  updateUserRole: async (userId: string, role: string) => 
    coreDb.update('users', userId, { role })
};

export const notificationDb = {
  createNotification: async (notification: any) => coreDb.create('notifications', notification),
  getNotificationsForUser: async (userId: string) => 
    coreDb.query('notifications', { user_id: userId }),
  markNotificationAsRead: async (id: string) => 
    coreDb.update('notifications', id, { is_read: true })
};

export const migrationDb = {
  migrateToSupabase: async () => {
    console.log('Migration to Supabase would be implemented here');
    return true;
  },
  exportData: async () => {
    console.log('Data export would be implemented here');
    return {};
  }
};
