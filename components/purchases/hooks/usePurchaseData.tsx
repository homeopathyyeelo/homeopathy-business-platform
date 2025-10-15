
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db-client";
import { Purchase, Supplier } from "@/types";

export const usePurchaseData = () => {
  const { getAll } = useDatabase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Query for purchases with refetch functionality
  const { 
    data: purchases = [], 
    isLoading: isLoadingPurchases,
    refetch: refetchPurchases 
  } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => getAll('purchases')
  });

  // Query for suppliers
  const { 
    data: suppliers = [], 
    isLoading: isLoadingSuppliers 
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getAll('suppliers')
  });

  // Combine purchase data with supplier information
  const purchasesWithSuppliers = purchases.map((purchase: Purchase) => {
    const supplier = suppliers.find((s: Supplier) => s.id === purchase.supplierId);
    return { ...purchase, supplier };
  });

  // Filter purchases based on search term
  const filteredPurchases = purchasesWithSuppliers.filter((purchase: any) => {
    const supplierName = purchase.supplier?.company_name?.toLowerCase() || '';
    const purchaseNumber = purchase.purchaseNumber?.toLowerCase() || '';
    const invoiceNumber = purchase.invoiceNumber?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return supplierName.includes(searchLower) || 
           purchaseNumber.includes(searchLower) ||
           invoiceNumber.includes(searchLower);
  });

  // Sort purchases by date (newest first)
  const sortedPurchases = [...filteredPurchases].sort((a: any, b: any) => 
    new Date(b.purchase_date || b.date).getTime() - new Date(a.purchase_date || a.date).getTime()
  );

  // Calculate statistics
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  
  const purchasesThisMonth = purchasesWithSuppliers.filter((p: any) => {
    const purchaseDate = new Date(p.purchase_date || p.date);
    return purchaseDate.getMonth() === thisMonth && 
           purchaseDate.getFullYear() === thisYear;
  });
  
  const pendingPayments = purchasesWithSuppliers.filter((p: any) => 
    p.paymentStatus !== 'paid'
  );

  const exportPurchases = () => {
    // Create CSV content
    const headers = ['Purchase #', 'Date', 'Supplier', 'Total', 'Status', 'Payment Status'];
    
    const csvContent = sortedPurchases.map((purchase: any) => {
      return [
        purchase.purchaseNumber || '',
        purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '',
        purchase.supplier?.company_name || '',
        purchase.total || 0,
        purchase.status || '',
        purchase.paymentStatus || ''
      ].join(',');
    });
    
    const csv = [headers.join(','), ...csvContent].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export completed",
      description: "Your purchases data has been downloaded"
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    sortedPurchases,
    purchases,
    purchasesThisMonth,
    pendingPayments,
    isLoading: isLoadingPurchases || isLoadingSuppliers,
    refetchPurchases,
    exportPurchases
  };
};
