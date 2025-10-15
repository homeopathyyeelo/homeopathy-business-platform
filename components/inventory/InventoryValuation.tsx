
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inventory, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, Package, AlertTriangle, Calendar } from "lucide-react";

interface InventoryValuationProps {
  inventory: Inventory[];
  products: Product[];
}

const InventoryValuation = ({ inventory, products }: InventoryValuationProps) => {
  // Join inventory with products
  const inventoryWithProducts = inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  });
  
  // Calculate total inventory value at cost
  const totalCostValue = inventoryWithProducts.reduce((sum, item) => {
    return sum + (item.purchasePrice * item.quantityInStock);
  }, 0);
  
  // Calculate total inventory value at retail
  const totalRetailValue = inventoryWithProducts.reduce((sum, item) => {
    return sum + (item.sellingPriceRetail * item.quantityInStock);
  }, 0);
  
  // Calculate total inventory value at wholesale
  const totalWholesaleValue = inventoryWithProducts.reduce((sum, item) => {
    return sum + (item.sellingPriceWholesale * item.quantityInStock);
  }, 0);
  
  // Count low stock items
  const lowStockCount = inventoryWithProducts.filter(item => {
    const reorderLevel = item.product?.reorderLevel || 5;
    return item.quantityInStock > 0 && item.quantityInStock <= reorderLevel;
  }).length;
  
  // Count out of stock items
  const outOfStockCount = inventoryWithProducts.filter(item => {
    return item.quantityInStock <= 0;
  }).length;
  
  // Count items expiring in next 90 days
  const today = new Date();
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(today.getDate() + 90);
  
  const expiringSoonCount = inventoryWithProducts.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate > today && expiryDate <= ninetyDaysLater;
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Inventory Value (Cost)
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCostValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Wholesale: {formatCurrency(totalWholesaleValue)}
          </p>
          <p className="text-xs text-muted-foreground">
            Retail: {formatCurrency(totalRetailValue)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Potential Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRetailValue - totalCostValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on retail pricing
          </p>
          <p className="text-xs text-muted-foreground">
            Markup: {((totalRetailValue / totalCostValue - 1) * 100).toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Stock Alerts
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Low stock items
          </p>
          <p className="text-xs text-red-500">
            {outOfStockCount} out of stock
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Expiring Soon
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringSoonCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Items expiring in 90 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryValuation;
