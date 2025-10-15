
import { coreDb } from '../core';
import { StockMovement } from '@/types';

export class StockMovementManager {
  /**
   * Creates a new stock movement entry
   */
  public async createStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
    const newMovement = {
      ...movement,
      id: `mov${Date.now()}`,
      movementNumber: `MOV-${Date.now()}`,
      date: movement.date || new Date(),
      quantityIn: movement.quantityIn || 0,
      quantityOut: movement.quantityOut || 0,
      createdAt: new Date()
    } as StockMovement;
    
    return await coreDb.create('stockMovements', newMovement);
  }

  /**
   * Retrieves stock movement logs based on filters
   */
  public async getStockMovementLogs(filters: any): Promise<StockMovement[]> {
    return await coreDb.query('stockMovements', filters);
  }
  
  /**
   * Gets stock movement logs for a specific product
   */
  public async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return this.getStockMovementLogs({ productId });
  }
  
  /**
   * Gets stock movement logs for a specific batch
   */
  public async getStockMovementsByBatch(batchNumber: string): Promise<StockMovement[]> {
    return this.getStockMovementLogs({ batchNumber });
  }
  
  /**
   * Gets stock movements within a date range
   */
  public async getStockMovementsByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]> {
    const movements = await coreDb.getAll('stockMovements');
    return movements.filter((movement: StockMovement) => {
      const movementDate = new Date(movement.date);
      return movementDate >= startDate && movementDate <= endDate;
    });
  }
  
  /**
   * Gets stock movements by type (purchase, sale, adjustment, transfer, return)
   */
  public async getStockMovementsByType(type: string): Promise<StockMovement[]> {
    return this.getStockMovementLogs({ type });
  }
  
  /**
   * Records a sales stock movement
   */
  public async recordSaleMovement(
    productId: string, 
    batchNumber: string, 
    quantity: number, 
    invoiceId: string, 
    invoiceNumber: string,
    warehouseId: string
  ): Promise<StockMovement> {
    return this.createStockMovement({
      date: new Date(),
      type: 'sale',
      referenceId: invoiceId,
      referenceNumber: invoiceNumber,
      productId,
      batchNumber,
      quantityIn: 0,
      quantityOut: quantity,
      warehouseId,
      createdBy: 'system',
      notes: 'Sale transaction'
    });
  }
  
  /**
   * Records a purchase stock movement
   */
  public async recordPurchaseMovement(
    productId: string, 
    batchNumber: string, 
    quantity: number, 
    purchaseId: string, 
    purchaseNumber: string,
    warehouseId: string
  ): Promise<StockMovement> {
    return this.createStockMovement({
      date: new Date(),
      type: 'purchase',
      referenceId: purchaseId,
      referenceNumber: purchaseNumber,
      productId,
      batchNumber,
      quantityIn: quantity,
      quantityOut: 0,
      warehouseId,
      createdBy: 'system',
      notes: 'Purchase transaction'
    });
  }
}
