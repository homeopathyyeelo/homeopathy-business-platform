/**
 * Client-safe database utilities that use API calls
 * Use this in React components instead of importing from @/lib/db
 */

export const useDatabase = () => {
  return {
    // Get all records from a table
    async getAll(tableName: string, conditions?: Record<string, any>) {
      const params = conditions ? `?${new URLSearchParams(conditions).toString()}` : '';
      const response = await authFetch(`/api/master/${tableName}${params}`);
      if (!response.ok) throw new Error(`Failed to fetch ${tableName}`);
      return response.json();
    },

    // Get one record by ID
    async getById(tableName: string, id: string) {
      const response = await authFetch(`/api/master/${tableName}/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch ${tableName} with id ${id}`);
      return response.json();
    },

    // Insert a new record
    async insert(tableName: string, data: Record<string, any>) {
      const response = await authFetch(`/api/master/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to insert into ${tableName}`);
      return response.json();
    },

    // Update a record
    async update(tableName: string, id: string, data: Record<string, any>) {
      const response = await authFetch(`/api/master/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to update ${tableName} with id ${id}`);
      return response.json();
    },

    // Delete a record
    async delete(tableName: string, id: string) {
      const response = await authFetch(`/api/master/${tableName}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete ${tableName} with id ${id}`);
      return response.json();
    },

    // Custom query (use API endpoints for specific queries)
    async customQuery(endpoint: string, params?: any) {
      const response = await authFetch(endpoint, {
        method: params ? 'POST' : 'GET',
        headers: params ? { 'Content-Type': 'application/json' } : undefined,
        body: params ? JSON.stringify(params) : undefined,
      });
      if (!response.ok) throw new Error(`API call to ${endpoint} failed`);
      return response.json();
    },

    // Transaction (for complex operations, use dedicated API endpoints)
    async transaction(callback: () => Promise<any>) {
      // For transactions, use specific API endpoints that handle the transaction server-side
      return callback();
    },
  };
};

// Export as default for easier imports
export default useDatabase;
