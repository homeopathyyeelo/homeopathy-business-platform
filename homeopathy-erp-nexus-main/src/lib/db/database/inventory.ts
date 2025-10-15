
import { coreDb } from './core';
import { StockMovementManager } from './inventory/StockMovementManager';
import { BatchManager } from './inventory/BatchManager';
import { StockAnalyzer } from './inventory/StockAnalyzer';
import { StockTransferManager } from './inventory/StockTransferManager';
import { StockMovement } from '@/types';

// Main Inventory Database class that combines all functionality
export class InventoryDatabase {
  private stockMovements: StockMovementManager;
  private batchManager: BatchManager;
  private stockAnalyzer: StockAnalyzer;
  private stockTransferManager: StockTransferManager;

  constructor() {
    this.stockMovements = new StockMovementManager();
    this.batchManager = new BatchManager(this.stockMovements);
    this.stockAnalyzer = new StockAnalyzer();
    this.stockTransferManager = new StockTransferManager(this.stockMovements, this.batchManager);
  }

  // Forward inventory operations to appropriate classes
  public async updateInventory(productId: string, batchNumber: string, quantity: number): Promise<boolean> {
    const inventory = await coreDb.getAll('inventory');
    const index = inventory.findIndex(item => 
      item.productId === productId && item.batchNumber === batchNumber);
    
    if (index === -1) return false;
    
    const currentQuantity = inventory[index].quantityInStock;
    const newQuantity = currentQuantity + quantity;
    
    if (newQuantity < 0) return false;
    
    const updated = await this.batchManager.updateBatch(inventory[index].id, {
      quantityInStock: newQuantity
    });
    
    return !!updated;
  }

  // Delegate methods to specialized classes
  public async createBatch(productId: string, batchData: any): Promise<any> {
    return this.batchManager.createBatch(productId, batchData);
  }
  
  public async getBatchesByProduct(productId: string): Promise<any[]> {
    return this.batchManager.getBatchesByProduct(productId);
  }
  
  public async updateBatch(batchId: string, updates: any): Promise<any | null> {
    return this.batchManager.updateBatch(batchId, updates);
  }

  public async getLowStockItems(): Promise<any[]> {
    return this.stockAnalyzer.getLowStockItems();
  }

  public async getSoonToExpireItems(daysThreshold: number = 90): Promise<any[]> {
    return this.stockAnalyzer.getSoonToExpireItems(daysThreshold);
  }
  
  public async getProductsByLocation(rackLocation: string): Promise<any[]> {
    return this.stockAnalyzer.getProductsByLocation(rackLocation);
  }

  public async createStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
    return this.stockMovements.createStockMovement(movement);
  }

  public async getStockMovementLogs(filters: any): Promise<any[]> {
    return this.stockMovements.getStockMovementLogs(filters);
  }

  public async transferStock(fromWarehouseId: string, toWarehouseId: string, items: any[]): Promise<boolean> {
    return this.stockTransferManager.transferStock(fromWarehouseId, toWarehouseId, items);
  }
}

export const inventoryDb = new InventoryDatabase();
