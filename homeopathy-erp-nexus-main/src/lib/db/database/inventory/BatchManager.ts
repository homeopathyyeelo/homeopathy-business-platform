
import { coreDb } from '../core';
import { StockMovementManager } from './StockMovementManager';

export class BatchManager {
  private stockMovements: StockMovementManager;

  constructor(stockMovements: StockMovementManager) {
    this.stockMovements = stockMovements;
  }

  public async createBatch(productId: string, batchData: any): Promise<any> {
    const product = await coreDb.getById('products', productId);
    if (!product) throw new Error('Product not found');
    
    const newBatch = {
      id: `inv${Date.now()}`,
      productId,
      batchNumber: batchData.batchNumber,
      manufacturingDate: batchData.manufacturingDate || null,
      expiryDate: new Date(batchData.expiryDate),
      quantityInStock: batchData.quantityInStock || 0,
      purchasePrice: batchData.purchasePrice || 0,
      mrp: batchData.mrp || 0,
      sellingPriceRetail: batchData.sellingPriceRetail || 0,
      sellingPriceWholesale: batchData.sellingPriceWholesale || 0,
      discount: batchData.discount || 0,
      rackLocation: batchData.rackLocation || product.defaultRackLocation || '',
      warehouseId: batchData.warehouseId || 'default',
      warehouseName: batchData.warehouseName || 'Default Warehouse',
      lastStockUpdate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const createdBatch = await coreDb.create('inventory', newBatch);
    
    // Record this as a stock movement if quantity > 0
    if (createdBatch && createdBatch.quantityInStock > 0) {
      await this.stockMovements.createStockMovement({
        date: new Date(),
        type: 'purchase',
        referenceId: createdBatch.id,
        referenceNumber: `BATCH-${createdBatch.batchNumber}`,
        productId,
        batchNumber: createdBatch.batchNumber,
        expiryDate: createdBatch.expiryDate,
        quantityIn: createdBatch.quantityInStock,
        quantityOut: 0,
        warehouseId: createdBatch.warehouseId,
        costPrice: createdBatch.purchasePrice,
        sellingPrice: createdBatch.sellingPriceRetail,
        createdBy: 'system',
        notes: 'New batch creation'
      });
    }
    
    return createdBatch;
  }
  
  public async getBatchesByProduct(productId: string): Promise<any[]> {
    const inventory = await coreDb.getAll('inventory');
    return inventory.filter(item => item.productId === productId);
  }
  
  public async updateBatch(batchId: string, updates: any): Promise<any | null> {
    const batch = await coreDb.getById('inventory', batchId);
    if (!batch) return null;
    
    // Check if quantity is being updated
    const quantityChange = 
      updates.quantityInStock !== undefined ? 
      updates.quantityInStock - batch.quantityInStock : 
      0;
    
    const updatedBatch = await coreDb.update('inventory', batchId, {
      ...updates,
      lastStockUpdate: new Date(),
      updatedAt: new Date()
    });
    
    // Record this as a stock movement if quantity changed
    if (updatedBatch && quantityChange !== 0) {
      await this.stockMovements.createStockMovement({
        date: new Date(),
        type: 'adjustment',
        referenceId: updatedBatch.id,
        referenceNumber: `ADJ-${Date.now()}`,
        productId: updatedBatch.productId,
        batchNumber: updatedBatch.batchNumber,
        expiryDate: updatedBatch.expiryDate,
        quantityIn: quantityChange > 0 ? quantityChange : 0,
        quantityOut: quantityChange < 0 ? Math.abs(quantityChange) : 0,
        warehouseId: updatedBatch.warehouseId || 'default',
        costPrice: updatedBatch.purchasePrice,
        sellingPrice: updatedBatch.sellingPriceRetail,
        createdBy: 'system',
        notes: 'Batch update'
      });
    }
    
    return updatedBatch;
  }
}
