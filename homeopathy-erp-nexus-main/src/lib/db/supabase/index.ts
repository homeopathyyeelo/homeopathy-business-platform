// Supabase client integration for ERP system
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Product, 
  Customer, 
  Supplier, 
  Category, 
  Brand,
  Tax, 
  Inventory, 
  Invoice, 
  Purchase,
  LedgerEntry,
  Unit,
  Warehouse,
  StockAdjustment,
  User,
  GSTReturn,
  StockMovement,
  PurchaseOrder,
  PaymentTransaction,
  ExpenseCategory,
  Expense,
  Report,
  Notification
} from "@/types";

class SupabaseDatabase {
  private supabase: SupabaseClient | null = null;
  
  // Initialize Supabase client
  initialize(supabaseUrl: string, supabaseKey: string) {
    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return false;
    }
  }
  
  // Check if Supabase is initialized
  private checkInitialization() {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized. Call initialize() first.');
    }
  }

  // Core database operations
  public async getAll(collection: string): Promise<any[]> {
    this.checkInitialization();
    console.log(`[Supabase] Getting all items from ${collection}`);
    
    try {
      const { data, error } = await this.supabase!
        .from(collection)
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      return [];
    }
  }

  public async getById(collection: string, id: string): Promise<any | null> {
    this.checkInitialization();
    console.log(`[Supabase] Getting item by id from ${collection}`);
    
    try {
      const { data, error } = await this.supabase!
        .from(collection)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ${collection} by id:`, error);
      return null;
    }
  }

  public async create(collection: string, item: any): Promise<any> {
    this.checkInitialization();
    console.log(`[Supabase] Creating item in ${collection}`);
    
    try {
      // Ensure createdAt and updatedAt are set
      const itemWithTimestamps = {
        ...item,
        createdAt: item.createdAt || new Date(),
        updatedAt: item.updatedAt || new Date()
      };
      
      const { data, error } = await this.supabase!
        .from(collection)
        .insert(itemWithTimestamps)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error creating item in ${collection}:`, error);
      throw error;
    }
  }

  public async update(collection: string, id: string, updates: any): Promise<any | null> {
    this.checkInitialization();
    console.log(`[Supabase] Updating item in ${collection}`);
    
    try {
      // Always update the updatedAt timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      
      const { data, error } = await this.supabase!
        .from(collection)
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating item in ${collection}:`, error);
      return null;
    }
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    this.checkInitialization();
    console.log(`[Supabase] Deleting item from ${collection}`);
    
    try {
      const { error } = await this.supabase!
        .from(collection)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting from ${collection}:`, error);
      return false;
    }
  }

  public async query(collection: string, filters: Record<string, any>): Promise<any[]> {
    this.checkInitialization();
    console.log(`[Supabase] Querying ${collection} with filters`, filters);
    
    try {
      let query = this.supabase!.from(collection).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        // Handle date range filters
        if (key === 'dateFrom' && value) {
          query = query.gte('date', value);
        } else if (key === 'dateTo' && value) {
          query = query.lte('date', value);
        } 
        // Handle array values (IN queries)
        else if (Array.isArray(value)) {
          query = query.in(key, value);
        } 
        // Default equality check
        else {
          query = query.eq(key, value);
        }
      });
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error querying ${collection}:`, error);
      return [];
    }
  }

  // Inventory-specific operations
  public async updateInventory(productId: string, batchNumber: string, quantity: number): Promise<boolean> {
    this.checkInitialization();
    console.log(`[Supabase] Updating inventory for product ${productId}`);
    
    try {
      // First get the current inventory record
      const { data: inventory, error: fetchError } = await this.supabase!
        .from('inventory')
        .select('*')
        .eq('productId', productId)
        .eq('batchNumber', batchNumber)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!inventory) {
        throw new Error(`Inventory record not found for product ${productId}, batch ${batchNumber}`);
      }
      
      // Update the quantity
      const newQuantity = inventory.quantityInStock + quantity;
      
      const { error: updateError } = await this.supabase!
        .from('inventory')
        .update({ 
          quantityInStock: newQuantity,
          lastStockUpdate: new Date(),
          updatedAt: new Date()
        })
        .eq('id', inventory.id);
      
      if (updateError) throw updateError;
      
      // Create a stock movement record
      await this.createStockMovement({
        movementNumber: `MOV-${Date.now()}`,
        date: new Date(),
        type: quantity > 0 ? 'adjustment' : 'adjustment',
        referenceId: inventory.id,
        referenceNumber: `ADJ-${Date.now()}`,
        productId,
        batchNumber,
        expiryDate: inventory.expiryDate,
        quantityIn: quantity > 0 ? Math.abs(quantity) : 0,
        quantityOut: quantity < 0 ? Math.abs(quantity) : 0,
        warehouseId: inventory.warehouseId || 'default',
        warehouseName: inventory.warehouseName || 'Default Warehouse',
        costPrice: inventory.purchasePrice,
        sellingPrice: inventory.sellingPriceRetail,
        createdBy: 'system',
        notes: 'Inventory adjustment',
        createdAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating inventory:`, error);
      return false;
    }
  }

  public async createBatch(productId: string, batchData: any): Promise<any> {
    this.checkInitialization();
    console.log(`[Supabase] Creating batch for product ${productId}`);
    
    try {
      // Prepare inventory record
      const inventoryRecord = {
        productId,
        ...batchData,
        quantityInStock: batchData.quantityInStock || 0,
        lastStockUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert into inventory table
      const { data, error } = await this.supabase!
        .from('inventory')
        .insert(inventoryRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create stock movement record if quantity > 0
      if (batchData.quantityInStock > 0) {
        await this.createStockMovement({
          movementNumber: `MOV-${Date.now()}`,
          date: new Date(),
          type: 'adjustment',
          referenceId: data.id,
          referenceNumber: `BATCH-${batchData.batchNumber}`,
          productId,
          batchNumber: batchData.batchNumber,
          expiryDate: batchData.expiryDate,
          quantityIn: batchData.quantityInStock,
          quantityOut: 0,
          warehouseId: batchData.warehouseId || 'default',
          warehouseName: batchData.warehouseName || 'Default Warehouse',
          costPrice: batchData.purchasePrice,
          sellingPrice: batchData.sellingPriceRetail,
          createdBy: 'system',
          notes: 'Initial batch creation',
          createdAt: new Date()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error creating batch:`, error);
      throw error;
    }
  }
  
  public async getBatchesByProduct(productId: string): Promise<any[]> {
    this.checkInitialization();
    console.log(`[Supabase] Getting batches for product ${productId}`);
    
    try {
      const { data, error } = await this.supabase!
        .from('inventory')
        .select('*')
        .eq('productId', productId)
        .order('expiryDate', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching batches:`, error);
      return [];
    }
  }
  
  public async updateBatch(batchId: string, updates: any): Promise<any | null> {
    return this.update('inventory', batchId, updates);
  }

  // Add missing methods to resolve the TypeScript errors
  public async getLowStockItems(): Promise<any[]> {
    this.checkInitialization();
    
    try {
      // Join inventory with products to get reorder level
      const { data, error } = await this.supabase!
        .from('inventory')
        .select(`
          *,
          products!inner(id, name, reorderLevel)
        `)
        .order('quantityInStock', { ascending: true });
      
      if (error) throw error;
      
      // Filter items where quantity is below reorder level
      return (data || []).filter(item => 
        item.quantityInStock <= item.products.reorderLevel
      );
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  }

  public async getSoonToExpireItems(daysThreshold: number = 90): Promise<any[]> {
    this.checkInitialization();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysThreshold);
    
    try {
      const { data, error } = await this.supabase!
        .from('inventory')
        .select(`
          *,
          products(id, name)
        `)
        .lte('expiryDate', futureDate.toISOString())
        .gte('expiryDate', today.toISOString())
        .order('expiryDate', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching soon to expire items:', error);
      return [];
    }
  }

  public async getProductsByLocation(rackLocation: string): Promise<any[]> {
    this.checkInitialization();
    
    try {
      const { data, error } = await this.supabase!
        .from('inventory')
        .select(`
          *,
          products(*)
        `)
        .eq('rackLocation', rackLocation);
      
      if (error) throw error;
      
      // Extract unique products
      const uniqueProductIds = new Set();
      const uniqueProducts: any[] = [];
      
      (data || []).forEach(item => {
        if (!uniqueProductIds.has(item.products.id)) {
          uniqueProductIds.add(item.products.id);
          uniqueProducts.push(item.products);
        }
      });
      
      return uniqueProducts;
    } catch (error) {
      console.error('Error fetching products by location:', error);
      return [];
    }
  }

  public async createStockMovement(movement: any): Promise<any> {
    return this.create('stockMovements', movement);
  }

  // Adding the missing methods that caused build errors
  public async getStockMovementLogs(filters?: any): Promise<any[]> {
    this.checkInitialization();
    
    try {
      let query = this.supabase!.from('stockMovements').select('*');
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          // Handle date range filters
          if (key === 'dateFrom' && value) {
            query = query.gte('date', value);
          } else if (key === 'dateTo' && value) {
            query = query.lte('date', value);
          } 
          // Handle product ID filter
          else if (key === 'productId') {
            query = query.eq('productId', value);
          }
          // Handle batch number filter
          else if (key === 'batchNumber') {
            query = query.eq('batchNumber', value);
          }
          // Handle movement type filter
          else if (key === 'type') {
            query = query.eq('type', value);
          }
          // Default equality check
          else {
            query = query.eq(key, value);
          }
        });
      }
      
      // Order by date descending
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching stock movement logs:', error);
      return [];
    }
  }

  public async transferStock(fromBatchId: string, toBatchId: string, quantity: number): Promise<boolean> {
    this.checkInitialization();
    
    try {
      // Get the source batch
      const { data: sourceBatch, error: sourceError } = await this.supabase!
        .from('inventory')
        .select('*')
        .eq('id', fromBatchId)
        .single();
        
      if (sourceError) throw sourceError;
      if (!sourceBatch) throw new Error(`Source batch ${fromBatchId} not found`);
      
      // Get the target batch
      const { data: targetBatch, error: targetError } = await this.supabase!
        .from('inventory')
        .select('*')
        .eq('id', toBatchId)
        .single();
        
      if (targetError) throw targetError;
      if (!targetBatch) throw new Error(`Target batch ${toBatchId} not found`);
      
      // Check if there's enough stock
      if (sourceBatch.quantityInStock < quantity) {
        throw new Error(`Insufficient stock in source batch. Available: ${sourceBatch.quantityInStock}, Requested: ${quantity}`);
      }
      
      // Update the source batch
      const { error: updateSourceError } = await this.supabase!
        .from('inventory')
        .update({ 
          quantityInStock: sourceBatch.quantityInStock - quantity,
          lastStockUpdate: new Date(),
          updatedAt: new Date()
        })
        .eq('id', fromBatchId);
        
      if (updateSourceError) throw updateSourceError;
      
      // Update the target batch
      const { error: updateTargetError } = await this.supabase!
        .from('inventory')
        .update({ 
          quantityInStock: targetBatch.quantityInStock + quantity,
          lastStockUpdate: new Date(),
          updatedAt: new Date()
        })
        .eq('id', toBatchId);
        
      if (updateTargetError) throw updateTargetError;
      
      // Create stock movement records
      await this.createStockMovement({
        date: new Date(),
        type: 'transfer',
        referenceId: `transfer-${Date.now()}`,
        referenceNumber: `TRF-OUT-${Date.now()}`,
        productId: sourceBatch.productId,
        batchNumber: sourceBatch.batchNumber,
        expiryDate: sourceBatch.expiryDate,
        quantityIn: 0,
        quantityOut: quantity,
        warehouseId: sourceBatch.warehouseId,
        warehouseName: sourceBatch.warehouseName,
        costPrice: sourceBatch.purchasePrice,
        sellingPrice: sourceBatch.sellingPriceRetail,
        notes: `Transfer to batch ${targetBatch.batchNumber}`,
        createdAt: new Date(),
        createdBy: 'system'
      });
      
      await this.createStockMovement({
        date: new Date(),
        type: 'transfer',
        referenceId: `transfer-${Date.now()}`,
        referenceNumber: `TRF-IN-${Date.now()}`,
        productId: targetBatch.productId,
        batchNumber: targetBatch.batchNumber,
        expiryDate: targetBatch.expiryDate,
        quantityIn: quantity,
        quantityOut: 0,
        warehouseId: targetBatch.warehouseId,
        warehouseName: targetBatch.warehouseName,
        costPrice: targetBatch.purchasePrice,
        sellingPrice: targetBatch.sellingPriceRetail,
        notes: `Transfer from batch ${sourceBatch.batchNumber}`,
        createdAt: new Date(),
        createdBy: 'system'
      });
      
      return true;
    } catch (error) {
      console.error('Error transferring stock:', error);
      return false;
    }
  }

  // GST and E-invoice operations
  public async generateEInvoice(invoiceId: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const { data: invoice, error: fetchError } = await this.supabase!
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!invoice) {
        return { success: false, error: "Invoice not found" };
      }
      
      // In a real implementation, this would call the E-Invoice API
      // For now, we'll simulate it
      const eInvoiceNumber = `EIN${Date.now()}`;
      
      // Update the invoice with the e-invoice number
      const { error: updateError } = await this.supabase!
        .from('invoices')
        .update({
          eInvoiceNumber,
          eInvoiceDate: new Date(),
          updatedAt: new Date()
        })
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
      
      return { 
        success: true, 
        invoiceNumber: eInvoiceNumber,
        irn: `IRN${Math.floor(Math.random() * 1000000000)}`
      };
    } catch (error) {
      console.error('Error generating e-invoice:', error);
      return { success: false, error: "Failed to generate e-invoice" };
    }
  }

  public async generateEWayBill(invoiceId: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const { data: invoice, error: fetchError } = await this.supabase!
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!invoice) {
        return { success: false, error: "Invoice not found" };
      }
      
      // In a real implementation, this would call the E-Way Bill API
      // For now, we'll simulate it
      const eWayBillNumber = `EWB${Date.now()}`;
      
      // Update the invoice with the e-way bill number
      const { error: updateError } = await this.supabase!
        .from('invoices')
        .update({
          eWayBillNumber,
          eWayBillDate: new Date(),
          updatedAt: new Date()
        })
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
      
      return { 
        success: true, 
        wayBillNumber: eWayBillNumber,
        validUntil: new Date(Date.now() + 86400000) // Valid for 24 hours
      };
    } catch (error) {
      console.error('Error generating e-way bill:', error);
      return { success: false, error: "Failed to generate e-way bill" };
    }
  }

  public async getGSTReturns(period: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const { data, error } = await this.supabase!
        .from('gstReturns')
        .select('*')
        .eq('period', period);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      // If no data found, return a simulated response
      return {
        gstr1: {
          totalSales: 0,
          totalGST: 0,
          b2b: 0,
          b2c: 0
        },
        gstr2: {
          totalPurchases: 0,
          totalGST: 0,
          inputCredit: 0
        },
        gstr3b: {
          outputTax: 0,
          inputCredit: 0,
          payable: 0
        }
      };
    } catch (error) {
      console.error('Error fetching GST returns:', error);
      return null;
    }
  }

  // Ledger operations
  public async getLedgerEntries(entityId: string, type: 'customer' | 'supplier'): Promise<any[]> {
    this.checkInitialization();
    
    try {
      const { data, error } = await this.supabase!
        .from('ledgerEntries')
        .select('*')
        .eq('entityId', entityId)
        .eq('entityType', type)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      return [];
    }
  }

  public async createLedgerEntry(entry: LedgerEntry): Promise<any> {
    return this.create('ledgerEntries', entry);
  }

  public async getTrialBalance(): Promise<any> {
    this.checkInitialization();
    
    try {
      // Get all ledger entries
      const { data, error } = await this.supabase!
        .from('ledgerEntries')
        .select('*');
      
      if (error) throw error;
      
      // Group by entity and calculate balances
      const trialBalance = (data || []).reduce((acc: any, entry: any) => {
        const key = `${entry.entityType}_${entry.entityId}`;
        
        if (!acc[key]) {
          acc[key] = {
            entityId: entry.entityId,
            entityType: entry.entityType,
            entityName: entry.entityName,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0
          };
        }
        
        acc[key].totalDebit += entry.debit || 0;
        acc[key].totalCredit += entry.credit || 0;
        acc[key].balance = acc[key].totalDebit - acc[key].totalCredit;
        
        return acc;
      }, {});
      
      return Object.values(trialBalance);
    } catch (error) {
      console.error('Error generating trial balance:', error);
      return null;
    }
  }

  // Adding missing ledger operations
  public async recordPayment(payment: any): Promise<any> {
    this.checkInitialization();
    
    try {
      // Set default values for the payment
      const paymentWithDefaults = {
        ...payment,
        id: payment.id || `pay_${Date.now()}`,
        transactionNumber: payment.transactionNumber || `TXN${Date.now()}`,
        date: payment.date || new Date(),
        status: payment.status || 'success',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create the payment record
      const { data, error } = await this.supabase!
        .from('paymentTransactions')
        .insert(paymentWithDefaults)
        .select()
        .single();
        
      if (error) throw error;
      
      // Create corresponding ledger entry
      if (data.entityType === 'customer') {
        await this.createLedgerEntry({
          id: `le_${Date.now()}`,
          date: data.date,
          entityId: data.entityId,
          entityType: 'customer',
          entityName: data.entityName || '',
          transactionType: 'payment',
          documentNumber: data.transactionNumber,
          description: `Payment received from customer`,
          debit: 0,
          credit: data.amount,
          balance: 0,
          paymentMethod: data.paymentMethod,
          relatedId: data.id,
          createdBy: data.createdBy || 'system',
          notes: data.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (data.entityType === 'supplier') {
        await this.createLedgerEntry({
          id: `le_${Date.now()}`,
          date: data.date,
          entityId: data.entityId,
          entityType: 'supplier',
          entityName: data.entityName || '',
          transactionType: 'payment',
          documentNumber: data.transactionNumber,
          description: `Payment made to supplier`,
          debit: data.amount,
          credit: 0,
          balance: 0,
          paymentMethod: data.paymentMethod,
          relatedId: data.id,
          createdBy: data.createdBy || 'system',
          notes: data.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  public async getOutstandingPayments(entityId: string, type: 'customer' | 'supplier'): Promise<any[]> {
    this.checkInitialization();
    
    try {
      let tableName = '';
      let entityField = '';
      
      if (type === 'customer') {
        tableName = 'invoices';
        entityField = 'customerId';
      } else if (type === 'supplier') {
        tableName = 'purchases';
        entityField = 'supplierId';
      } else {
        throw new Error(`Invalid entity type: ${type}`);
      }
      
      // Query for unpaid or partially paid transactions
      const { data, error } = await this.supabase!
        .from(tableName)
        .select('*')
        .eq(entityField, entityId)
        .in('paymentStatus', ['pending', 'partial'])
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error getting outstanding payments for ${type}:`, error);
      return [];
    }
  }

  public async generateAccountingReports(reportType: string, period: string): Promise<any> {
    this.checkInitialization();
    
    try {
      // Parse period in format "YYYY-MM"
      const [year, month] = period.split('-').map(Number);
      
      // Calculate start and end dates for the period
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
      const endDate = new Date(year, month, 0); // Last day of the month
      
      // Format dates for database query
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Generate report based on type
      switch (reportType) {
        case 'profit-loss': {
          // Get sales data for the period
          const { data: sales, error: salesError } = await this.supabase!
            .from('invoices')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);
            
          if (salesError) throw salesError;
          
          // Get purchase data for the period
          const { data: purchases, error: purchasesError } = await this.supabase!
            .from('purchases')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);
            
          if (purchasesError) throw purchasesError;
          
          // Get expense data for the period
          const { data: expenses, error: expensesError } = await this.supabase!
            .from('expenses')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr);
            
          if (expensesError) throw expensesError;
          
          // Calculate totals
          const totalSales = (sales || []).reduce((sum, invoice) => sum + (invoice.total || 0), 0);
          const totalPurchases = (purchases || []).reduce((sum, purchase) => sum + (purchase.total || 0), 0);
          const totalExpenses = (expenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
          
          // Group expenses by category
          const expensesByCategory = (expenses || []).reduce((acc, expense) => {
            const category = expense.category || 'Uncategorized';
            if (!acc[category]) acc[category] = 0;
            acc[category] += expense.amount || 0;
            return acc;
          }, {});
          
          // Calculate profit
          const grossProfit = totalSales - totalPurchases;
          const netProfit = grossProfit - totalExpenses;
          const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) + '%' : '0.00%';
          
          return {
            reportData: {
              income: {
                sales: totalSales,
                otherIncome: 0, // Not implemented yet
                total: totalSales
              },
              expenses: {
                purchases: totalPurchases,
                ...expensesByCategory,
                total: totalPurchases + totalExpenses
              },
              grossProfit,
              netProfit
            },
            summary: {
              title: 'Profit & Loss Report',
              period: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
              profitMargin
            }
          };
        }
        
        // Other report types can be implemented similarly
        default:
          return {
            reportData: {},
            summary: {
              title: `${reportType} Report`,
              period: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
              message: 'This report type is not yet implemented'
            }
          };
      }
    } catch (error) {
      console.error('Error generating accounting report:', error);
      return {
        reportData: {},
        summary: {
          title: `${reportType} Report Error`,
          period,
          message: 'An error occurred while generating the report'
        }
      };
    }
  }
}

export const supabaseDb = new SupabaseDatabase();

// Add a method to lib/db/index.ts to initialize Supabase
export const initializeSupabase = (supabaseUrl: string, supabaseKey: string) => {
  return supabaseDb.initialize(supabaseUrl, supabaseKey);
};
