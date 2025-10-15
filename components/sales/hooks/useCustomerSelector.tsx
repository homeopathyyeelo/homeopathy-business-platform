
import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db-client";
import { Customer } from "@/types";

/**
 * Custom hook to manage customer selection logic
 */
export const useCustomerSelector = (saleType: 'retail' | 'wholesale') => {
  const { getAll } = useDatabase();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Get customers from database
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  // Filter customers by type
  const filteredCustomers = customers.filter((customer: Customer) => 
    customer.type === saleType
  );

  // Get selected customer details
  const selectedCustomer = filteredCustomers.find((c: Customer) => c.id === selectedCustomerId);
  
  // Auto-select first customer if none selected
  useEffect(() => {
    if (filteredCustomers.length > 0 && !selectedCustomerId) {
      if (saleType === 'wholesale' && filteredCustomers.some((c: Customer) => c.priceLevel)) {
        // For wholesale, try to find a customer with a price level first
        const customerWithPriceLevel = filteredCustomers.find((c: Customer) => c.priceLevel);
        if (customerWithPriceLevel) {
          setSelectedCustomerId(customerWithPriceLevel.id);
        } else {
          setSelectedCustomerId(filteredCustomers[0].id);
        }
      } else if (saleType === 'retail' && filteredCustomers.length === 1) {
        // For retail, auto-select only if there's just one customer (walk-in)
        setSelectedCustomerId(filteredCustomers[0].id);
      }
    }
  }, [filteredCustomers, selectedCustomerId, saleType]);
  
  return {
    customers,
    filteredCustomers,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer
  };
};
