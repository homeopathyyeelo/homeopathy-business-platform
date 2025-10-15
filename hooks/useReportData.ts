
import { useState, useEffect } from "react";
import { useDatabase } from "@/lib/db-client";
import { useQuery } from "@tanstack/react-query";
import { Customer, Invoice, Product, Inventory, Purchase } from "@/types";

export function useReportData() {
  const { getAll } = useDatabase();
  const [reportType, setReportType] = useState<string>("sales");
  const [dateRange, setDateRange] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data fetching
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAll('inventory')
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => getAll('purchases')
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  // Set date range based on selection
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "today":
        // Already set to today
        break;
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "custom":
        // Don't change dates for custom range
        return;
      default:
        break;
    }
    
    setStartDate(startDate.toISOString().split('T')[0]);
    setEndDate(endDate.toISOString().split('T')[0]);
  };

  // Filter data based on date range
  const filterDataByDate = (data: any[], dateField: string = 'date') => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Apply date filters
  const filteredInvoices = filterDataByDate(invoices as Invoice[]);
  const filteredPurchases = filterDataByDate(purchases as Purchase[]);
  
  // Summary calculations
  const totalSales = filteredInvoices.reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);
  const totalPurchases = filteredPurchases.reduce((sum: number, purchase: Purchase) => sum + purchase.total, 0);
  const totalProfit = totalSales - totalPurchases;

  // Export report as CSV
  const exportReport = () => {
    // This would implement actual CSV export
    alert("Report export functionality will be implemented here");
  };

  const isLoading = isLoadingInvoices || isLoadingInventory || isLoadingProducts || 
                   isLoadingPurchases || isLoadingCustomers;

  return {
    reportType,
    setReportType,
    dateRange,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    handleDateRangeChange,
    filteredInvoices,
    filteredPurchases,
    inventory,
    products,
    customers,
    isLoading,
    totalSales,
    totalPurchases,
    totalProfit,
    exportReport
  };
}
