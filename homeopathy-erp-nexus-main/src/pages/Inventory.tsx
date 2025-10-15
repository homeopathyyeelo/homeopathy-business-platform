
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BatchWiseInventory from "@/components/inventory/BatchWiseInventory";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryValuation from "@/components/inventory/InventoryValuation";
import EnhancedInventoryDashboard from "@/components/inventory/EnhancedInventoryDashboard";
import StockAdjustmentDialog from "@/components/inventory/StockAdjustmentDialog";
import CSVImport from "@/components/inventory/CSVImport";
import { useInventoryData } from "@/components/inventory/hooks/useInventoryData";

const Inventory = () => {
  const {
    products,
    inventory,
    filteredInventory,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    isLoading,
    refetch,
    exportToCSV
  } = useInventoryData();

  const [adjustmentDialog, setAdjustmentDialog] = useState({
    isOpen: false,
    inventoryItem: null as any
  });

  const handleAdjustStock = (item: any) => {
    setAdjustmentDialog({
      isOpen: true,
      inventoryItem: item
    });
  };

  const handleCloseAdjustment = () => {
    setAdjustmentDialog({
      isOpen: false,
      inventoryItem: null
    });
  };

  const handleAdjustmentComplete = () => {
    refetch();
    handleCloseAdjustment();
  };

  if (isLoading) {
    return <div>Loading inventory data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <p className="text-muted-foreground">
          Manage your product inventory, stock levels, and import data.
        </p>
      </div>

      <Tabs defaultValue="enhanced" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhanced">Enhanced Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batch">Batch Wise</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="import">CSV Import</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedInventoryDashboard />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.filter(item => item.quantityInStock <= 5 && item.quantityInStock > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{inventory.reduce((sum, item) => sum + (item.purchasePrice * item.quantityInStock), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Current inventory value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.filter(item => item.quantityInStock <= 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Items to reorder</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>Latest inventory transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stock movement data will be displayed here.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Moving Products</CardTitle>
                <CardDescription>Most frequently sold items</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Product movement analytics will be displayed here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <InventorySearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
          <BatchWiseInventory
            inventory={inventory}
            products={products}
            filteredInventory={filteredInventory}
            onAdjustStock={handleAdjustStock}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <InventorySearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
          <BatchWiseInventory
            inventory={inventory}
            products={products}
            filteredInventory={filteredInventory}
            onAdjustStock={handleAdjustStock}
          />
        </TabsContent>

        <TabsContent value="valuation" className="space-y-6">
          <InventoryValuation
            inventory={inventory}
            products={products}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <CSVImport />
        </TabsContent>
      </Tabs>

      <StockAdjustmentDialog
        isOpen={adjustmentDialog.isOpen}
        onClose={handleCloseAdjustment}
        inventoryItem={adjustmentDialog.inventoryItem}
        products={products}
        onAdjustmentComplete={handleAdjustmentComplete}
      />
    </div>
  );
};

export default Inventory;
