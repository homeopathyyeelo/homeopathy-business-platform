"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSales, useSalesStats, useSalesMutations } from "@/lib/hooks/sales";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Receipt, TrendingUp, DollarSign, FileText, Upload, RotateCcw } from "lucide-react";

// Importing existing components to maintain functionality
import SalesHeader from "@/components/sales/SalesHeader";
import SalesSummaryCards from "@/components/sales/SalesSummaryCards";
import SalesSearch from "@/components/sales/SalesSearch";
import RetailSalesTable from "@/components/sales/RetailSalesTable";
import WholesaleSalesTable from "@/components/sales/WholesaleSalesTable";
import CreateSaleDialog from "@/components/sales/CreateSaleDialog";
import UploadSaleDialog from "@/components/sales/UploadSaleDialog";
import SalesReturnDialog from "@/components/sales/SalesReturnDialog";
import { useSalesData } from "@/components/sales/useSalesData";

export default function SalesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [currentSaleType, setCurrentSaleType] = useState<'retail' | 'wholesale'>('retail');

  // Use new React Query hooks for enhanced functionality
  const { data: sales = [], isLoading } = useSales();
  const { data: stats } = useSalesStats();
  const { remove } = useSalesMutations();

  // Use existing component data
  const {
    searchTerm,
    setSearchTerm,
    filteredRetailInvoices,
    filteredWholesaleInvoices,
    todaySales,
    monthSales,
    pendingInvoices,
    refetchInvoices
  } = useSalesData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  const handleDeleteSale = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await remove.mutateAsync(id);
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        });
        refetchInvoices();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete sale",
          variant: "destructive"
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with React Query Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
          <p className="text-gray-600">Complete invoice management, returns, and receipts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleUploadSale}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Sales
          </Button>
          <Button variant="outline" onClick={handleSalesReturn}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Sales Return
          </Button>
          <Button onClick={() => handleNewSale('retail')}>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards with React Query Data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || monthSales)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.salesCount || sales.length}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.averageOrderValue || (monthSales / Math.max(sales.length, 1)))}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Receipt className="w-4 h-4 mr-2" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingInvoices || pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Sales Interface with Tabs */}
      <Tabs defaultValue="retail" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="retail">Retail Sales</TabsTrigger>
          <TabsTrigger value="wholesale">Wholesale Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="retail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retail Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              <RetailSalesTable
                invoices={filteredRetailInvoices}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wholesale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wholesale Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              <WholesaleSalesTable
                invoices={filteredWholesaleInvoices}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs using existing components */}
      <CreateSaleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        saleType={currentSaleType}
        onSuccess={refetchInvoices}
      />

      <UploadSaleDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={refetchInvoices}
      />

      <SalesReturnDialog
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
        onSuccess={refetchInvoices}
      />
    </div>
  );
}
