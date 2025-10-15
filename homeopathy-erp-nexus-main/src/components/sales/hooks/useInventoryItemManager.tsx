
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { InvoiceItem, Product, Inventory, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to manage inventory items in a sale
 */
export const useInventoryItemManager = (
  saleType: 'retail' | 'wholesale', 
  selectedCustomerId: string,
  pricingLevel: string
) => {
  const { toast } = useToast();
  const { getAll } = useDatabase();
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
  
  // Get products and inventory data
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });
  
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });
  
  // Get selected customer for price level
  const selectedCustomer = useMemo(() => {
    return customers.find((c: Customer) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Add a new item to the list
  const addItem = () => {
    setItems([...items, {
      id: `temp-${Date.now()}`,
      productId: "",
      batchNumber: "",
      quantity: 1,
      unitPrice: 0,
      gstPercentage: 0,
      gstAmount: 0,
      total: 0
    }]);
  };

  // Remove an item from the list
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Update an item's properties
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // If product or quantity changes, we need to recalculate
    if (field === 'productId' || field === 'quantity' || field === 'batchNumber' || 
        field === 'discountAmount' || field === 'discountPercentage') {
      if (item.productId && item.quantity) {
        // Find inventory item to get price
        const inventoryItem = inventoryItems.find((inv: Inventory) => {
          const invProductId = (inv as any).productId ?? (inv as any).product_id;
          const invBatch = (inv as any).batchNumber ?? (inv as any).batch_number;
          return invProductId === item.productId && invBatch === item.batchNumber;
        });
        
        if (inventoryItem) {
          // Set base price based on customer type
          const baseRetail = (inventoryItem as any).sellingPriceRetail ?? (inventoryItem as any).selling_price_retail ?? 0;
          const baseWholesale = (inventoryItem as any).sellingPriceWholesale ?? (inventoryItem as any).selling_price_wholesale ?? 0;
          let price = saleType === 'retail' ? baseRetail : baseWholesale;
          
          // Apply pricing level adjustments for wholesale customers
          if (saleType === 'wholesale') {
            // Use the customer's pricing level if available, otherwise use the selected pricing level
            const activePricingLevel = (selectedCustomer as any)?.priceLevel ?? (selectedCustomer as any)?.price_level ?? pricingLevel;
            
            switch (activePricingLevel) {
              case 'A': // Premium pricing (higher margin)
                price = price * 1.05; // 5% higher
                break;
              case 'B': // Regular pricing (standard)
                // No adjustment needed
                break;
              case 'C': // Economy pricing (lower margin)
                price = price * 0.95; // 5% lower
                break;
              default:
                // No adjustment for standard pricing
                break;
            }
          }
            
          // Find product to get GST percentage
          const product = products.find((p: Product) => p.id === item.productId);
          const gstPercentage = product ? ((product as any).gstPercentage ?? (product as any).gst_percentage ?? 0) : 0;
          
          // Calculate values
          const subtotal = price * (item.quantity || 0);
          
          // Apply discount if present
          const discountAmount = item.discountPercentage ? 
            subtotal * (item.discountPercentage / 100) : 
            (item.discountAmount || 0);
          
          const afterDiscount = subtotal - discountAmount;
          const gstAmount = afterDiscount * (gstPercentage / 100);
          const total = afterDiscount + gstAmount;
          
          item.unitPrice = parseFloat(price.toFixed(2));
          item.gstPercentage = gstPercentage;
          item.discountAmount = parseFloat(discountAmount.toFixed(2));
          item.gstAmount = parseFloat(gstAmount.toFixed(2));
          item.total = parseFloat(total.toFixed(2));
        }
      }
    }
    
    newItems[index] = item;
    setItems(newItems);
  };
  
  // Validate inventory levels
  const validateInventoryLevels = () => {
    for (const item of items) {
      const inventoryItem = inventoryItems.find((inv: Inventory) => {
        const invProductId = (inv as any).productId ?? (inv as any).product_id;
        const invBatch = (inv as any).batchNumber ?? (inv as any).batch_number;
        return invProductId === item.productId && invBatch === item.batchNumber;
      });
      
      const currentQty = inventoryItem ? ((inventoryItem as any).quantityInStock ?? (inventoryItem as any).quantity_in_stock ?? 0) : 0;
      if (currentQty < (item.quantity || 0)) {
        const product = products.find((p: Product) => p.id === item.productId);
        toast({
          title: "Insufficient Stock",
          description: `Not enough stock for ${product?.name || 'item'} with batch ${item.batchNumber}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  return {
    items,
    setItems,
    products,
    inventoryItems,
    addItem,
    removeItem,
    updateItem,
    validateInventoryLevels
  };
};
