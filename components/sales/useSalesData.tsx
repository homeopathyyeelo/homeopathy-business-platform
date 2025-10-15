
import { useDatabase } from "@/lib/db-client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Invoice, Customer } from "@/types";

export const useSalesData = () => {
  const { getAll } = useDatabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSaleType, setCurrentSaleType] = useState<"retail" | "wholesale">("retail");

  // Fetch invoices and customer data
  const { data: invoices = [], isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  // Process data
  const invoicesWithCustomers = invoices.map((invoice: Invoice) => {
    const customer = customers.find((c: Customer) => c.id === invoice.customerId);
    return { ...invoice, customer };
  });

  // Filter out return invoices for the main display
  const salesInvoices = invoicesWithCustomers.filter((invoice: any) => 
    !invoice.type.startsWith('return_')
  );

  const retailInvoices = salesInvoices.filter((invoice: any) => invoice.type === 'retail');
  const wholesaleInvoices = salesInvoices.filter((invoice: any) => invoice.type === 'wholesale');

  const filteredRetailInvoices = retailInvoices.filter((invoice: any) => {
    const customerName = invoice.customer?.name.toLowerCase() || '';
    const invoiceNumber = invoice.invoiceNumber.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return customerName.includes(searchLower) || invoiceNumber.includes(searchLower);
  });

  const filteredWholesaleInvoices = wholesaleInvoices.filter((invoice: any) => {
    const customerName = invoice.customer?.name.toLowerCase() || '';
    const invoiceNumber = invoice.invoiceNumber.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return customerName.includes(searchLower) || invoiceNumber.includes(searchLower);
  });

  // Calculate summary metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySales = salesInvoices
    .filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.date);
      invoiceDate.setHours(0, 0, 0, 0);
      return invoiceDate.getTime() === today.getTime();
    })
    .reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);

  // Calculate this month's sales
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const monthSales = salesInvoices
    .filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= firstDayOfMonth;
    })
    .reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);

  // Count pending invoices
  const pendingInvoices = salesInvoices.filter(
    (invoice: Invoice) => invoice.paymentStatus !== 'paid'
  ).length;

  return {
    searchTerm,
    setSearchTerm,
    currentSaleType,
    setCurrentSaleType,
    filteredRetailInvoices,
    filteredWholesaleInvoices,
    todaySales,
    monthSales,
    pendingInvoices,
    isLoading: isLoadingInvoices || isLoadingCustomers,
    refetchInvoices
  };
};
