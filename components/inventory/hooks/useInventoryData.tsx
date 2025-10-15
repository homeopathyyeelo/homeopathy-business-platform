
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db-client";
import { useToast } from "@/hooks/use-toast";
import { Inventory } from "@/types";

export const useInventoryData = () => {
  const { getAll } = useDatabase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: products = [], isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const today = new Date();
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(today.getDate() + 90);

  // Filter inventory based on search term and filter type
  const filteredInventory = inventory.filter((item: Inventory) => {
    const product = products.find((p: any) => p.id === item.productId);
    const productName = product?.name.toLowerCase() || '';
    const batchNumber = item.batchNumber?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    // Apply text search
    const matchesSearch = productName.includes(searchLower) || batchNumber.includes(searchLower);
    if (!matchesSearch) return false;
    
    // Apply status filter
    switch (filterType) {
      case "low":
        return item.quantityInStock > 0 && 
               item.quantityInStock <= (product?.reorderLevel || 5);
      case "out":
        return item.quantityInStock <= 0;
      case "expiringSoon":
        const expiryDate = new Date(item.expiryDate);
        return expiryDate > today && expiryDate <= ninetyDaysLater;
      default:
        return true;
    }
  });

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Product', 'Batch', 'Expiry Date', 'Stock', 'Purchase Price', 'Selling Price', 'Location'];
    
    const csvContent = filteredInventory.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      return [
        product?.name || 'Unknown Product',
        item.batchNumber || 'N/A',
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
        item.quantityInStock || 0,
        item.purchasePrice || 0,
        item.sellingPriceRetail || 0,
        item.rackLocation || 'N/A'
      ].join(',');
    });
    
    const csv = [headers.join(','), ...csvContent].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export completed",
      description: "Your inventory data has been downloaded"
    });
  };

  return {
    products,
    inventory,
    filteredInventory,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    isLoading: isLoadingProducts || isLoadingInventory,
    refetch,
    exportToCSV
  };
};
