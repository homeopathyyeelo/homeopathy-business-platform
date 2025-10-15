
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Define the Supabase database implementation
class SupabaseDatabase {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Core database operations
  public async getAll(collection: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from(collection)
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  public async getById(collection: string, id: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
    return data || null;
  }

  public async create(collection: string, item: any): Promise<any> {
    // Ensure we're not trying to insert undefined values
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    
    const { data, error } = await this.supabase
      .from(collection)
      .insert(cleanItem)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  }

  public async update(collection: string, id: string, updates: any): Promise<any> {
    // Ensure we're not trying to update with undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    const { data, error } = await this.supabase
      .from(collection)
      .update(cleanUpdates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(collection)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  public async query(collection: string, filters: Record<string, any>): Promise<any[]> {
    let query = this.supabase.from(collection).select('*');
    
    // Handle special filter types
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'dateFrom' && typeof value === 'string') {
        // This assumes a date column named 'date'
        query = query.gte('date', value);
      } else if (key === 'dateTo' && typeof value === 'string') {
        // This assumes a date column named 'date'
        query = query.lte('date', value);
      } else if (Array.isArray(value)) {
        // Handle 'in' query
        query = query.in(key, value);
      } else {
        // Standard equality check
        query = query.eq(key, value);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  // Inventory specific operations
  public async updateInventory(productId: string, batchNumber: string, quantity: number): Promise<boolean> {
    const { data: inventoryItems, error: fetchError } = await this.supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('batch_number', batchNumber);
    
    if (fetchError) throw fetchError;
    if (!inventoryItems || inventoryItems.length === 0) return false;
    
    const item = inventoryItems[0];
    const newQuantity = item.quantity_in_stock + quantity;
    
    if (newQuantity < 0) return false;
    
    const { error: updateError } = await this.supabase
      .from('inventory')
      .update({ 
        quantity_in_stock: newQuantity,
        updated_at: new Date()
      })
      .eq('id', item.id);
    
    if (updateError) throw updateError;
    return true;
  }
  
  public async createBatch(productId: string, batchData: any): Promise<any> {
    // Ensure required fields
    const batch = {
      product_id: productId,
      batch_number: batchData.batchNumber || `BATCH-${Date.now()}`,
      expiry_date: batchData.expiryDate,
      manufacturing_date: batchData.manufacturingDate || null,
      quantity_in_stock: batchData.quantityInStock || 0,
      purchase_price: batchData.purchasePrice || 0,
      selling_price_retail: batchData.sellingPriceRetail || 0,
      selling_price_wholesale: batchData.sellingPriceWholesale || 0,
      rack_location: batchData.rackLocation || '',
      warehouse_id: batchData.warehouseId || '00000000-0000-0000-0000-000000000000'
    };
    
    const { data, error } = await this.supabase
      .from('inventory')
      .insert(batch)
      .select();
    
    if (error) throw error;
    
    // Log stock movement if quantity > 0
    if (batch.quantity_in_stock > 0) {
      await this.createStockMovement({
        type: 'purchase',
        product_id: productId,
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        quantity_in: batch.quantity_in_stock,
        warehouse_id: batch.warehouse_id,
        notes: 'New batch created'
      });
    }
    
    return data?.[0] || null;
  }
  
  public async getBatchesByProduct(productId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId);
    
    if (error) throw error;
    return data || [];
  }
  
  public async updateBatch(batchId: string, updates: any): Promise<any> {
    // Get current batch info first
    const { data: currentBatch, error: fetchError } = await this.supabase
      .from('inventory')
      .select('*')
      .eq('id', batchId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!currentBatch) return null;
    
    // Check for quantity changes to log them
    const oldQuantity = currentBatch.quantity_in_stock;
    const newQuantity = updates.quantity_in_stock;
    const quantityChanged = newQuantity !== undefined && oldQuantity !== newQuantity;
    
    // Update the batch
    const { data, error } = await this.supabase
      .from('inventory')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', batchId)
      .select();
    
    if (error) throw error;
    
    // Log stock movement if quantity changed
    if (quantityChanged) {
      const quantityDifference = newQuantity - oldQuantity;
      await this.createStockMovement({
        type: 'adjustment',
        product_id: currentBatch.product_id,
        batch_number: currentBatch.batch_number,
        expiry_date: currentBatch.expiry_date,
        quantity_in: quantityDifference > 0 ? quantityDifference : 0,
        quantity_out: quantityDifference < 0 ? Math.abs(quantityDifference) : 0,
        warehouse_id: currentBatch.warehouse_id,
        notes: 'Manual batch update'
      });
    }
    
    return data?.[0] || null;
  }
  
  public async getLowStockItems(): Promise<any[]> {
    // This requires a join between inventory and products
    const { data, error } = await this.supabase
      .from('inventory')
      .select(`
        *,
        products:product_id (*)
      `);
    
    if (error) throw error;
    
    // Filter items where quantity is below reorder level
    return (data || []).filter(item => {
      const product = item.products;
      return product && item.quantity_in_stock <= product.reorder_level;
    });
  }
  
  public async getSoonToExpireItems(daysThreshold: number = 90): Promise<any[]> {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Format dates for Supabase
    const todayStr = today.toISOString().split('T')[0];
    const thresholdStr = thresholdDate.toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from('inventory')
      .select(`
        *,
        products:product_id (*)
      `)
      .lte('expiry_date', thresholdStr)
      .gte('expiry_date', todayStr);
    
    if (error) throw error;
    return data || [];
  }
  
  public async getProductsByLocation(rackLocation: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('inventory')
      .select(`
        *,
        products:product_id (*)
      `)
      .eq('rack_location', rackLocation);
    
    if (error) throw error;
    
    // Extract unique products
    const uniqueProducts = new Map();
    (data || []).forEach(item => {
      if (item.products) {
        uniqueProducts.set(item.products.id, item.products);
      }
    });
    
    return Array.from(uniqueProducts.values());
  }
  
  public async createStockMovement(movement: any): Promise<any> {
    const newMovement = {
      movement_number: movement.movement_number || `MOV-${Date.now()}`,
      date: movement.date || new Date(),
      type: movement.type || 'adjustment',
      reference_id: movement.reference_id,
      reference_number: movement.reference_number,
      product_id: movement.product_id,
      batch_number: movement.batch_number,
      expiry_date: movement.expiry_date,
      quantity_in: movement.quantity_in || 0,
      quantity_out: movement.quantity_out || 0,
      warehouse_id: movement.warehouse_id,
      notes: movement.notes,
      created_by: movement.created_by
    };
    
    const { data, error } = await this.supabase
      .from('stock_movements')
      .insert(newMovement)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  }
  
  public async getStockMovementLogs(filters?: any): Promise<any[]> {
    let query = this.supabase
      .from('stock_movements')
      .select(`
        *,
        products:product_id (name)
      `);
    
    if (filters) {
      // Apply filters
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
    }
    
    // Sort by date
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
  
  public async transferStock(fromBatch: string, toBatch: string, quantity: number): Promise<boolean> {
    // Not implemented for Supabase yet
    // In a real implementation, this would be a transaction
    return false;
  }

  // GST operations
  public async generateEInvoice(invoiceId: string): Promise<any> {
    // Get the invoice
    const { data: invoice, error: fetchError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!invoice) return { success: false, error: "Invoice not found" };
    
    // Generate e-invoice number
    const eInvoiceNumber = `EIN${Date.now()}`;
    
    // Update invoice
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update({
        e_invoice_number: eInvoiceNumber,
        e_invoice_date: new Date(),
        updated_at: new Date()
      })
      .eq('id', invoiceId);
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      invoiceNumber: eInvoiceNumber,
      irn: `IRN${Math.floor(Math.random() * 1000000000)}`
    };
  }
  
  public async generateEWayBill(invoiceId: string): Promise<any> {
    // Get the invoice
    const { data: invoice, error: fetchError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!invoice) return { success: false, error: "Invoice not found" };
    
    // Generate e-way bill number
    const eWayBillNumber = `EWB${Date.now()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 1); // Valid for 1 day
    
    // Update invoice
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update({
        e_way_bill_number: eWayBillNumber,
        e_way_bill_date: new Date(),
        updated_at: new Date()
      })
      .eq('id', invoiceId);
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      wayBillNumber: eWayBillNumber,
      validUntil
    };
  }
  
  public async getGSTReturns(period: string): Promise<any> {
    // Check if returns data exists
    const { data, error } = await this.supabase
      .from('gst_returns')
      .select('*')
      .eq('period', period)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      return {
        ...data,
        gstr1: data.gstr1,
        gstr2: data.gstr2,
        gstr3b: data.gstr3b
      };
    }
    
    // If no returns data, return a stub
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
  }

  // Ledger operations
  public async getLedgerEntries(entityId: string, type: 'customer' | 'supplier'): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('ledger_entries')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', type)
      .order('date');
    
    if (error) throw error;
    return data || [];
  }
  
  public async createLedgerEntry(entry: any): Promise<any> {
    const newEntry = {
      date: entry.date || new Date(),
      entity_id: entry.entityId,
      entity_type: entry.entityType,
      entity_name: entry.entityName,
      transaction_type: entry.transactionType,
      document_number: entry.documentNumber,
      description: entry.description,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance || 0,
      payment_method: entry.paymentMethod,
      related_id: entry.relatedId,
      created_by: entry.createdBy,
      notes: entry.notes
    };
    
    const { data, error } = await this.supabase
      .from('ledger_entries')
      .insert(newEntry)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  }
  
  public async getTrialBalance(): Promise<any> {
    // In a real implementation, this would be a complex query or stored procedure
    // For demo, return simulated data
    return {
      assets: {
        inventory: 250000,
        accountsReceivable: 75000,
        cash: 150000,
        total: 475000
      },
      liabilities: {
        accountsPayable: 125000,
        loans: 50000,
        total: 175000
      },
      equity: {
        capital: 250000,
        retainedEarnings: 50000,
        total: 300000
      }
    };
  }
  
  public async recordPayment(payment: any): Promise<any> {
    const newPayment = {
      transaction_number: payment.transactionNumber || `TXN${Date.now()}`,
      date: payment.date || new Date(),
      entity_id: payment.entityId,
      entity_type: payment.entityType,
      entity_name: payment.entityName,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      payment_reference: payment.paymentReference,
      related_invoice: payment.relatedInvoice,
      related_purchase: payment.relatedPurchase,
      notes: payment.notes,
      status: payment.status || 'success',
      created_by: payment.createdBy
    };
    
    const { data, error } = await this.supabase
      .from('payment_transactions')
      .insert(newPayment)
      .select();
    
    if (error) throw error;
    
    const transaction = data?.[0] || null;
    
    // Create ledger entry
    if (transaction) {
      if (transaction.entity_type === 'customer') {
        await this.createLedgerEntry({
          entityId: transaction.entity_id,
          entityType: 'customer',
          entityName: transaction.entity_name,
          transactionType: 'payment',
          documentNumber: transaction.transaction_number,
          description: 'Payment received from customer',
          debit: 0,
          credit: transaction.amount,
          paymentMethod: transaction.payment_method,
          relatedId: transaction.id,
          createdBy: transaction.created_by,
          notes: transaction.notes
        });
      } else if (transaction.entity_type === 'supplier') {
        await this.createLedgerEntry({
          entityId: transaction.entity_id,
          entityType: 'supplier',
          entityName: transaction.entity_name,
          transactionType: 'payment',
          documentNumber: transaction.transaction_number,
          description: 'Payment made to supplier',
          debit: transaction.amount,
          credit: 0,
          paymentMethod: transaction.payment_method,
          relatedId: transaction.id,
          createdBy: transaction.created_by,
          notes: transaction.notes
        });
      }
    }
    
    return transaction;
  }
  
  public async getOutstandingPayments(entityId: string, type: 'customer' | 'supplier'): Promise<any[]> {
    const table = type === 'customer' ? 'invoices' : 'purchases';
    const idField = type === 'customer' ? 'customer_id' : 'supplier_id';
    
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq(idField, entityId)
      .in('payment_status', ['pending', 'partial']);
    
    if (error) throw error;
    return data || [];
  }
  
  public async generateAccountingReports(reportType: string, period: string): Promise<any> {
    // In a real implementation, this would be a complex query or stored procedure
    // For demo, return simulated data based on report type
    switch (reportType) {
      case 'profit-loss':
        return {
          reportData: {
            income: {
              sales: 500000,
              otherIncome: 20000,
              total: 520000
            },
            expenses: {
              purchases: 300000,
              salaries: 80000,
              rent: 20000,
              utilities: 10000,
              marketing: 5000,
              miscellaneous: 15000,
              total: 430000
            },
            netProfit: 90000
          },
          summary: {
            title: 'Profit & Loss Report',
            period,
            profitMargin: '17.3%'
          }
        };
      
      case 'balance-sheet':
        return {
          reportData: {
            assets: {
              currentAssets: {
                cash: 150000,
                accountsReceivable: 75000,
                inventory: 250000,
                total: 475000
              },
              fixedAssets: {
                furniture: 50000,
                equipment: 100000,
                vehicles: 200000,
                total: 350000
              },
              totalAssets: 825000
            },
            liabilities: {
              currentLiabilities: {
                accountsPayable: 125000,
                loansShortTerm: 20000,
                total: 145000
              },
              longTermLiabilities: {
                loansLongTerm: 30000,
                total: 30000
              },
              totalLiabilities: 175000
            },
            equity: {
              capital: 250000,
              retainedEarnings: 400000,
              total: 650000
            }
          },
          summary: {
            title: 'Balance Sheet',
            asOf: new Date(),
            totalAssetsLiabilities: 825000
          }
        };
      
      case 'cash-flow':
        return {
          reportData: {
            operatingActivities: {
              netIncome: 90000,
              depreciation: 20000,
              changeInReceivables: -15000,
              changeInInventory: -30000,
              changeInPayables: 25000,
              netCashFromOperating: 90000
            },
            investingActivities: {
              purchaseOfEquipment: -40000,
              saleOfAssets: 10000,
              netCashFromInvesting: -30000
            },
            financingActivities: {
              loanRepayments: -10000,
              dividendsPaid: -20000,
              netCashFromFinancing: -30000
            },
            netChangeInCash: 30000,
            beginningCash: 120000,
            endingCash: 150000
          },
          summary: {
            title: 'Cash Flow Statement',
            period,
            cashFlow: 30000
          }
        };
      
      default:
        return {
          reportData: [],
          summary: {
            title: `${reportType} Report`,
            period,
            message: 'No data available for this report type'
          }
        };
    }
  }
}

// Initialize Supabase database instance
let supabaseDb: SupabaseDatabase;

// Function to initialize or reinitialize the Supabase client
export const initializeSupabase = (url: string, key: string): boolean => {
  try {
    // Use the single shared client from integrations to avoid multiple GoTrue instances
    supabaseDb = new SupabaseDatabase(supabaseClient);
    return true;
  } catch (error) {
    console.error("Error initializing Supabase:", error);
    return false;
  }
};

export { supabaseDb };
