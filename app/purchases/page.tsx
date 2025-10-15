"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { usePurchaseOrders, useGRNs, useVendorPayments, usePurchaseStats, usePurchaseMutations } from "@/lib/hooks/purchases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Truck, Receipt, CreditCard, TrendingUp, DollarSign, FileText } from "lucide-react";

// Importing existing components to maintain functionality
import { PurchaseDataDisplay } from "@/components/purchases/PurchaseDataDisplay";
import { PurchaseStatusCards } from "@/components/purchases/PurchaseStatusCards";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { usePurchaseData } from "@/components/purchases/hooks/usePurchaseData";

export default function PurchasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("orders");

  // Use new React Query hooks for enhanced functionality
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: grns = [] } = useGRNs();
  const { data: payments = [] } = useVendorPayments();
  const { data: stats } = usePurchaseStats();
  const { deletePO } = usePurchaseMutations();

  // Use existing component data for backward compatibility
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      pending: 'outline',
      approved: 'default',
      partial_received: 'secondary',
      received: 'default',
      cancelled: 'destructive',
      confirmed: 'default',
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const handleNewPurchase = () => {
    setIsFormOpen(true);
  };

  const handleSavePurchase = async () => {
    setIsFormOpen(false);
    await refetchPurchases();
    toast({
      title: "Purchase Created",
      description: "Purchase has been created successfully"
    });
  };

  const handleDeletePO = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePO.mutateAsync(id);
        toast({
          title: "Success",
          description: "Purchase order deleted successfully",
        });
        refetchPurchases();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete purchase order",
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
          <h2 className="text-3xl font-bold tracking-tight">Purchases Management</h2>
          <p className="text-gray-600">PO, GRN, vendor payments, and returns</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportPurchases}>
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleNewPurchase}>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Total POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPOs || purchaseOrders.length}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total PO Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.totalPOValue || purchasesThisMonth)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Received POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.receivedPOs || 0}</div>
            <p className="text-xs text-muted-foreground">85% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingPayments || pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Form Dialog */}
      {isFormOpen && (
        <PurchaseForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSave={handleSavePurchase}
        />
      )}

      {/* Tabs for different purchase modules */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="grns">Goods Receipt Notes</TabsTrigger>
          <TabsTrigger value="payments">Vendor Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <PurchaseStatusCards
            purchases={purchases}
            purchasesThisMonth={purchasesThisMonth}
            pendingPayments={pendingPayments}
          />

          <PurchaseDataDisplay
            purchases={sortedPurchases}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onEdit={(id: string) => router.push(`/purchases/orders/${id}/edit`)}
            onView={(id: string) => router.push(`/purchases/orders/${id}`)}
            onDelete={handleDeletePO}
          />
        </TabsContent>

        <TabsContent value="grns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goods Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">GRN #</th>
                      <th className="text-left p-4">PO #</th>
                      <th className="text-left p-4">Vendor</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grns.map((grn) => (
                      <tr key={grn.id} className="border-b">
                        <td className="p-4 font-medium">{grn.grn_number}</td>
                        <td className="p-4">{grn.po_number}</td>
                        <td className="p-4">{grn.vendor_name}</td>
                        <td className="p-4">{formatDate(grn.received_date)}</td>
                        <td className="p-4">{getStatusBadge(grn.status)}</td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/purchases/grns/${grn.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Payment #</th>
                      <th className="text-left p-4">Vendor</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="text-left p-4">Method</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-4 font-medium">{payment.payment_number}</td>
                        <td className="p-4">{payment.vendor_name}</td>
                        <td className="p-4">{formatCurrency(payment.amount)}</td>
                        <td className="p-4">
                          <Badge variant="outline">{payment.payment_method}</Badge>
                        </td>
                        <td className="p-4">{formatDate(payment.payment_date)}</td>
                        <td className="p-4">{getStatusBadge(payment.status)}</td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/purchases/payments/${payment.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
