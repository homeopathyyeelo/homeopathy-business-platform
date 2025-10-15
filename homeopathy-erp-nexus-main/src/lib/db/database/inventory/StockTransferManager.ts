
import { StockMovementManager } from './StockMovementManager';
import { BatchManager } from './BatchManager';
import { coreDb } from '../core';

export class StockTransferManager {
  private stockMovements: StockMovementManager;
  private batchManager: BatchManager;

  constructor(stockMovements: StockMovementManager, batchManager: BatchManager) {
    this.stockMovements = stockMovements;
    this.batchManager = batchManager;
  }

  public async transferStock(fromWarehouseId: string, toWarehouseId: string, items: any[]): Promise<boolean> {
    // For each item, reduce stock in source warehouse and increase in target warehouse
    for (const item of items) {
      const { productId, batchNumber, quantity } = item;
      
      // Get the inventory item from source warehouse
      const inventoryItems = await coreDb.getAll('inventory');
      const sourceItem = inventoryItems.find(
        inv => inv.productId === productId && 
              inv.batchNumber === batchNumber && 
              inv.warehouseId === fromWarehouseId
      );
      
      if (!sourceItem || sourceItem.quantityInStock < quantity) {
        console.error(`Insufficient stock in source warehouse for product ${productId}, batch ${batchNumber}`);
        return false;
      }
      
      // Reduce quantity in source warehouse
      await this.batchManager.updateBatch(sourceItem.id, {
        quantityInStock: sourceItem.quantityInStock - quantity
      });
      
      // Check if batch exists in target warehouse
      const targetItem = inventoryItems.find(
        inv => inv.productId === productId && 
              inv.batchNumber === batchNumber && 
              inv.warehouseId === toWarehouseId
      );
      
      if (targetItem) {
        // Update existing batch in target warehouse
        await this.batchManager.updateBatch(targetItem.id, {
          quantityInStock: targetItem.quantityInStock + quantity
        });
      } else {
        // Create new batch in target warehouse
        await this.batchManager.createBatch(productId, {
          ...sourceItem,
          id: undefined, // Let the system generate a new ID
          warehouseId: toWarehouseId,
          warehouseName: 'Target Warehouse', // This would be dynamically determined in a real system
          quantityInStock: quantity
        });
      }
      
      // Log the transfer as stock movements
      await this.stockMovements.createStockMovement({
        date: new Date(),
        type: 'transfer',
        referenceId: `transfer-${Date.now()}`,
        referenceNumber: `TRF-${Date.now()}`,
        productId,
        batchNumber,
        expiryDate: sourceItem.expiryDate,
        quantityIn: 0,
        quantityOut: quantity,
        warehouseId: fromWarehouseId,
        notes: `Transfer to warehouse ${toWarehouseId}`
      });
      
      await this.stockMovements.createStockMovement({
        date: new Date(),
        type: 'transfer',
        referenceId: `transfer-${Date.now()}`,
        referenceNumber: `TRF-${Date.now()}`,
        productId,
        batchNumber,
        expiryDate: sourceItem.expiryDate,
        quantityIn: quantity,
        quantityOut: 0,
        warehouseId: toWarehouseId,
        notes: `Transfer from warehouse ${fromWarehouseId}`
      });
    }
    
    return true;
  }
}
