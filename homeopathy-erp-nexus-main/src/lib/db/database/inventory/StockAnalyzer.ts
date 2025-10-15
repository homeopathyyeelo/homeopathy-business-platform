
import { coreDb } from '../core';

export class StockAnalyzer {
  public async getLowStockItems(): Promise<any[]> {
    const inventory = await coreDb.getAll('inventory');
    const products = await coreDb.getAll('products');
    
    return inventory.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && item.quantityInStock <= product.reorderLevel;
    }).map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    });
  }

  public async getSoonToExpireItems(daysThreshold: number = 90): Promise<any[]> {
    const inventory = await coreDb.getAll('inventory');
    const products = await coreDb.getAll('products');
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    return inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= thresholdDate && expiryDate >= today;
    }).map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    });
  }
  
  public async getProductsByLocation(rackLocation: string): Promise<any[]> {
    const inventory = await coreDb.getAll('inventory');
    const products = await coreDb.getAll('products');
    
    // Get unique product IDs with the specified rack location
    const productIds = new Set(
      inventory
        .filter(item => item.rackLocation === rackLocation)
        .map(item => item.productId)
    );
    
    // Get products with the default rack location
    const productsWithDefaultLocation = products.filter(
      product => product.defaultRackLocation === rackLocation
    ).map(product => product.id);
    
    // Combine both sets
    productsWithDefaultLocation.forEach(id => productIds.add(id));
    
    // Get full product details
    return products.filter(product => productIds.has(product.id));
  }
}
