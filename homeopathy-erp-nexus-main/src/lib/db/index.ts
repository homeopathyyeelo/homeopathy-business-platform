
// Re-export everything from the database modules
import { useDatabase } from './useDatabase';
import { db } from './database';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { supabaseDb, initializeSupabase as initSupabase } from './supabase';

// Export both database implementations
export { db, useDatabase, supabaseDb };

// Function to get the database source from Supabase settings
export const getDatabaseSource = async (): Promise<'supabase' | 'postgres'> => {
  try {
    // Query the app_configuration table
    const { data, error } = await supabaseClient
      .from('app_configuration')
      .select('value')
      .eq('key', 'DATA_SOURCE')
      .single();
      
    if (error) {
      console.error('Error getting database source:', error);
      return 'supabase'; // Default to supabase on error
    }
    
    if (data && (data.value === 'supabase' || data.value === 'postgres')) {
      return data.value as 'supabase' | 'postgres';
    }
    
    // Default to supabase if not found
    return 'supabase';
  } catch (error) {
    console.error('Error getting database source:', error);
    return 'supabase'; // Default to supabase on error
  }
};

// Flag to determine which database to use - defaults to Supabase
// This will be updated based on app_configuration
export let USE_SUPABASE = true; 

// Initialize the database connection
export const initializeDatabase = async () => {
  try {
    const source = await getDatabaseSource();
    USE_SUPABASE = source === 'supabase';
    console.log(`Database source set to: ${source}`);
    
    if (USE_SUPABASE) {
      // Get Supabase configuration from app_configuration
      const { data: configData, error: configError } = await supabaseClient
        .from('app_configuration')
        .select('key, value')
        .in('key', ['SUPABASE_URL', 'SUPABASE_KEY']);
        
      if (configError) {
        console.error('Error fetching Supabase config:', configError);
        // Use default values from the imported client if there's an error
        // Get the URL and key from the environment variables used by the client
        const supabaseUrl = "https://cjujwogpqahgsonwcxdf.supabase.co";
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWp3b2dwcWFoZ3NvbndjeGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTU5MTYsImV4cCI6MjA1OTU3MTkxNn0.g2I-HSC-PKJ5eGzlqqX5hXkbVGgWxu9x2X5t7tI-bac";
        return initSupabase(supabaseUrl, supabaseKey);
      }
      
      // Extract URL and key
      let supabaseUrl = "https://cjujwogpqahgsonwcxdf.supabase.co";
      let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWp3b2dwcWFoZ3NvbndjeGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTU5MTYsImV4cCI6MjA1OTU3MTkxNn0.g2I-HSC-PKJ5eGzlqqX5hXkbVGgWxu9x2X5t7tI-bac";
      
      if (configData && configData.length > 0) {
        configData.forEach(item => {
          if (item.key === 'SUPABASE_URL' && item.value) {
            supabaseUrl = item.value;
          } else if (item.key === 'SUPABASE_KEY' && item.value) {
            supabaseKey = item.value;
          }
        });
      }
      
      console.log('Initializing Supabase with URL:', supabaseUrl);
      // Initialize Supabase with the configuration
      return initSupabase(supabaseUrl, supabaseKey);
    } else {
      // For PostgreSQL, we would initialize a different client
      console.log('PostgreSQL connection is not yet fully implemented');
      // TODO: Implement PostgreSQL connection logic
      
      // For now, return false to indicate we're not ready for PostgreSQL
      return false;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

// Function to initialize Supabase connection
export const initializeSupabase = (supabaseUrl: string, supabaseKey: string) => {
  return initSupabase(supabaseUrl, supabaseKey);
};
