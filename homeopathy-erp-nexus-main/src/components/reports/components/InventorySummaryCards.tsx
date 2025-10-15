
import { Inventory, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface InventorySummaryCardsProps {
  totalValuation: number;
  totalRetailValue: number;
  totalWholesaleValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  productsCount: number;
  batchesCount: number;
}

export const InventorySummaryCards = ({
  totalValuation,
  totalRetailValue,
  totalWholesaleValue,
  lowStockCount,
  outOfStockCount,
  expiringSoonCount,
  productsCount,
  batchesCount
}: InventorySummaryCardsProps) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Inventory Value (Cost)</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalValuation)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Retail Value</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalRetailValue)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Wholesale Value</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalWholesaleValue)}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Potential Retail Profit</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(totalRetailValue - totalValuation)}</p>
          <p className="text-xs text-muted-foreground">Margin: {((totalRetailValue / totalValuation - 1) * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Potential Wholesale Profit</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(totalWholesaleValue - totalValuation)}</p>
          <p className="text-xs text-muted-foreground">Margin: {((totalWholesaleValue / totalValuation - 1) * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Products</p>
          <p className="text-2xl font-bold mt-2">{productsCount}</p>
          <p className="text-xs text-muted-foreground">With {batchesCount} batches</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Low Stock Items</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{lowStockCount}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Out of Stock</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{outOfStockCount}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Expiring Soon</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{expiringSoonCount}</p>
        </div>
      </div>
    </>
  );
};
