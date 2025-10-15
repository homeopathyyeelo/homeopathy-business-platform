
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer } from "@/types";

interface CustomerSelectorProps {
  selectedCustomerId: string;
  onSelect: (customerId: string) => void;
  placeholder?: string;
  className?: string;
  customerType?: 'retail' | 'wholesale' | 'all';
}

const CustomerSelector = ({
  selectedCustomerId,
  onSelect,
  placeholder = "Select customer",
  className = "",
  customerType = 'all'
}: CustomerSelectorProps) => {
  // Fetch customers data from the database
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => useDatabase().getAll('customers')
  });
  
  // Filter customers by type if specified
  const filteredCustomers = customerType === 'all' 
    ? customers 
    : customers.filter((customer: Customer) => customer.type === customerType);
  
  return (
    <Select value={selectedCustomerId} onValueChange={onSelect}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredCustomers.length === 0 ? (
          <SelectItem value="no-customer" disabled>
            No customers available
          </SelectItem>
        ) : (
          filteredCustomers.map((customer: Customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.firstName} {customer.lastName}
              {customer.type === 'wholesale' && customer.gstNumber ? ` (${customer.gstNumber})` : ''}
              {customer.type === 'retail' && customer.phone ? ` (${customer.phone})` : ''}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default CustomerSelector;
