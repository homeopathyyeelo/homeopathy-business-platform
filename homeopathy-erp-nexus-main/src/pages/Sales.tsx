
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useSalesData } from "@/components/sales/useSalesData";

// Importing our newly created components
import SalesHeader from "@/components/sales/SalesHeader";
import SalesSummaryCards from "@/components/sales/SalesSummaryCards";
import SalesSearch from "@/components/sales/SalesSearch";
import SalesTabsHeader from "@/components/sales/SalesTabsHeader";
import RetailSalesTable from "@/components/sales/RetailSalesTable";
import WholesaleSalesTable from "@/components/sales/WholesaleSalesTable";
import CreateSaleDialog from "@/components/sales/CreateSaleDialog";
import UploadSaleDialog from "@/components/sales/UploadSaleDialog";
import SalesReturnDialog from "@/components/sales/SalesReturnDialog";
import ReturnCreditNote from "@/components/sales/ReturnCreditNote";

const Sales = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  
  const { 
    searchTerm, 
    setSearchTerm,
    currentSaleType, 
    setCurrentSaleType,
    filteredRetailInvoices,
    filteredWholesaleInvoices,
    todaySales,
    monthSales,
    pendingInvoices,
    isLoading,
    refetchInvoices
  } = useSalesData();

  const handleNewSale = (type: 'retail' | 'wholesale') => {
    setCurrentSaleType(type);
    setIsCreateDialogOpen(true);
  };

  const handleUploadSale = () => {
    setIsUploadDialogOpen(true);
  };

  const handleSalesReturn = () => {
    setIsReturnDialogOpen(true);
  };

  const exportSales = () => {
    toast({
      title: "Export Started",
      description: "Your sales data is being prepared for download"
    });
    // In a real app, this would generate and download a CSV
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading sales data...</div>;
  }

  return (
    <div className="space-y-6">
      <SalesHeader 
        onExport={exportSales}
        onUploadClick={handleUploadSale}
        onSalesReturnClick={handleSalesReturn}
      />

      <SalesSummaryCards 
        todaySales={todaySales}
        monthSales={monthSales}
        pendingInvoices={pendingInvoices}
      />

      <SalesSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Tabs defaultValue="retail" className="w-full">
        <SalesTabsHeader 
          onNewRetailSale={() => handleNewSale('retail')}
          onNewWholesaleSale={() => handleNewSale('wholesale')}
        />

        <TabsContent value="retail" className="mt-0">
          <RetailSalesTable invoices={filteredRetailInvoices} />
        </TabsContent>

        <TabsContent value="wholesale" className="mt-0">
          <WholesaleSalesTable invoices={filteredWholesaleInvoices} />
        </TabsContent>
      </Tabs>

      {isCreateDialogOpen && (
        <CreateSaleDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          saleType={currentSaleType}
          onSuccess={refetchInvoices}
        />
      )}

      {isUploadDialogOpen && (
        <UploadSaleDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        />
      )}
      
      {isReturnDialogOpen && (
        <SalesReturnDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          onSuccess={refetchInvoices}
        />
      )}
    </div>
  );
};

export default Sales;
