
import { Inventory, Product } from "@/types";
import { useInventoryReportData } from "./hooks/useInventoryReportData";
import { InventorySummaryCards } from "./components/InventorySummaryCards";
import { ExpiringSoonTable } from "./components/ExpiringSoonTable";
import { CategoryInventoryList } from "./components/CategoryInventoryList";

interface InventoryReportProps {
  inventory: Inventory[];
  products: Product[];
}

const InventoryReport = ({ inventory, products }: InventoryReportProps) => {
  const {
    inventoryWithProducts,
    totalValuation,
    totalRetailValue,
    totalWholesaleValue,
    lowStockItems,
    outOfStockItems,
    expiringSoonItems,
    inventoryByCategory
  } = useInventoryReportData(inventory, products);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Inventory Report</h3>
      
      <InventorySummaryCards 
        totalValuation={totalValuation}
        totalRetailValue={totalRetailValue}
        totalWholesaleValue={totalWholesaleValue}
        lowStockCount={lowStockItems.length}
        outOfStockCount={outOfStockItems.length}
        expiringSoonCount={expiringSoonItems.length}
        productsCount={products.length}
        batchesCount={inventory.length}
      />
      
      <ExpiringSoonTable expiringSoonItems={expiringSoonItems} />
      
      <CategoryInventoryList inventoryByCategory={inventoryByCategory} />
    </div>
  );
};

export default InventoryReport;
