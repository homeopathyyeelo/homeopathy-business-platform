
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileUp, FileDown, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UploadPurchaseDialog from "@/components/purchases/UploadPurchaseDialog";
import { PurchaseDataDisplay } from "@/components/purchases/PurchaseDataDisplay";
import { PurchaseStatusCards } from "@/components/purchases/PurchaseStatusCards";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { usePurchaseData } from "@/components/purchases/hooks/usePurchaseData";

const Purchase = () => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    sortedPurchases,
    purchases,
    purchasesThisMonth,
    pendingPayments,
    isLoading,
    refetchPurchases,
    exportPurchases
  } = usePurchaseData();

  const handleNewPurchase = () => {
    setIsFormOpen(true);
  };

  const handleUploadPurchase = () => {
    setIsUploadDialogOpen(true);
  };

  const handleSavePurchase = async () => {
    setIsFormOpen(false);
    await refetchPurchases();
    toast({
      title: "Purchase Created",
      description: "Purchase has been created successfully"
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading purchase data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleUploadPurchase} variant="outline" className="flex items-center">
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          
          <Button onClick={exportPurchases} variant="outline" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button onClick={handleNewPurchase} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase
          </Button>
        </div>
      </div>

      <PurchaseStatusCards
        totalPurchases={purchases.length}
        purchasesThisMonth={purchasesThisMonth.length}
        pendingPayments={pendingPayments.length}
      />

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by supplier, invoice or purchase number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <PurchaseDataDisplay purchases={sortedPurchases} />

      {/* Import Dialog */}
      {isUploadDialogOpen && (
        <UploadPurchaseDialog 
          open={isUploadDialogOpen} 
          onOpenChange={setIsUploadDialogOpen}
          onSuccess={() => refetchPurchases()} 
        />
      )}

      {/* Add Purchase Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Purchase</DialogTitle>
          </DialogHeader>
          <PurchaseForm
            onSave={handleSavePurchase}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchase;
