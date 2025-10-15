
import { useMemo } from "react";
import { Inventory, Product } from "@/types";

export const useInventoryReportData = (inventory: Inventory[], products: Product[]) => {
  const inventoryWithProducts = useMemo(() => {
    return inventory.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    });
  }, [inventory, products]);
  
  // Calculate valuation
  const totalValuation = useMemo(() => {
    return inventoryWithProducts.reduce((sum, item) => {
      return sum + (item.purchasePrice * item.quantityInStock);
    }, 0);
  }, [inventoryWithProducts]);
  
  // Calculate retail value
  const totalRetailValue = useMemo(() => {
    return inventoryWithProducts.reduce((sum, item) => {
      return sum + (item.sellingPriceRetail * item.quantityInStock);
    }, 0);
  }, [inventoryWithProducts]);
  
  // Calculate wholesale value
  const totalWholesaleValue = useMemo(() => {
    return inventoryWithProducts.reduce((sum, item) => {
      return sum + (item.sellingPriceWholesale * item.quantityInStock);
    }, 0);
  }, [inventoryWithProducts]);
  
  // Low stock items
  const lowStockItems = useMemo(() => {
    return inventoryWithProducts.filter(item => {
      const reorderLevel = item.product?.reorderLevel || 5;
      return item.quantityInStock > 0 && item.quantityInStock <= reorderLevel;
    });
  }, [inventoryWithProducts]);
  
  // Out of stock items
  const outOfStockItems = useMemo(() => {
    return inventoryWithProducts.filter(item => {
      return item.quantityInStock <= 0;
    });
  }, [inventoryWithProducts]);
  
  // Expiring soon (within 90 days)
  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    return inventoryWithProducts.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate > today && expiryDate <= ninetyDaysFromNow && item.quantityInStock > 0;
    });
  }, [inventoryWithProducts]);

  // Dead stock (hasn't moved in 180 days - this is a placeholder since we don't track sales history yet)
  const deadStockItems = useMemo(() => {
    return inventoryWithProducts.filter(item => {
      return item.quantityInStock > 0 && !item.lastStockUpdate;
    });
  }, [inventoryWithProducts]);

  // Group inventory by category
  const inventoryByCategory = useMemo(() => {
    return inventoryWithProducts.reduce((acc: any, item) => {
      const categoryId = item.product?.categoryId;
      if (!categoryId) return acc;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: item.product?.category?.name || 'Uncategorized',
          items: [],
          totalValue: 0,
        };
      }
      
      acc[categoryId].items.push(item);
      acc[categoryId].totalValue += (item.purchasePrice * item.quantityInStock);
      
      return acc;
    }, {});
  }, [inventoryWithProducts]);

  return {
    inventoryWithProducts,
    totalValuation,
    totalRetailValue,
    totalWholesaleValue,
    lowStockItems,
    outOfStockItems,
    expiringSoonItems,
    deadStockItems,
    inventoryByCategory
  };
};
