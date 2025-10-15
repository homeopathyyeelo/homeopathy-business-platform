
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Customer, Invoice } from "@/types";

interface CustomerReportProps {
  customers: Customer[];
  invoices: Invoice[];
}

const CustomerReport = ({ customers, invoices }: CustomerReportProps) => {
  // Create customer summary with sales data
  const customerSummary = customers.map(customer => {
    const customerInvoices = invoices.filter(invoice => invoice.customerId === customer.id);
    const totalPurchases = customerInvoices.length;
    const totalSpent = customerInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const pendingAmount = customerInvoices
      .filter(invoice => invoice.paymentStatus !== 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
      
    return {
      ...customer,
      totalPurchases,
      totalSpent,
      pendingAmount,
      lastPurchase: customerInvoices.length > 0 
        ? new Date(Math.max(...customerInvoices.map(i => new Date(i.date).getTime())))
        : null
    };
  });
  
  // Sort by total spent (descending)
  const sortedCustomers = [...customerSummary].sort((a, b) => b.totalSpent - a.totalSpent);
  
  // Calculate stats
  const totalCustomers = customers.length;
  const retailCustomers = customers.filter(c => c.type === 'retail').length;
  const wholesaleCustomers = customers.filter(c => c.type === 'wholesale').length;
  const activeCustomers = customerSummary.filter(c => c.totalPurchases > 0).length;
  
  // Calculate total outstanding
  const totalOutstanding = customerSummary.reduce((sum, customer) => sum + customer.pendingAmount, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Customer Report</h3>
      
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Customers</p>
          <p className="text-2xl font-bold mt-2">{totalCustomers}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Retail Customers</p>
          <p className="text-2xl font-bold mt-2">{retailCustomers}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Wholesale Customers</p>
          <p className="text-2xl font-bold mt-2">{wholesaleCustomers}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Active Customers</p>
          <p className="text-2xl font-bold mt-2">{activeCustomers}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Outstanding Amount</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Average Purchase Value</p>
          <p className="text-2xl font-bold mt-2">
            {formatCurrency(invoices.length > 0 ? 
              invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0
            )}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Top Customers (By Purchase Value)</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No customer data available</TableCell>
              </TableRow>
            ) : (
              sortedCustomers.slice(0, 10).map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  </TableCell>
                  <TableCell className="capitalize">{customer.type}</TableCell>
                  <TableCell className="text-center">{customer.totalPurchases}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                  <TableCell className="text-right">
                    {customer.pendingAmount > 0 ? 
                      <span className="text-red-600">{formatCurrency(customer.pendingAmount)}</span> : 
                      formatCurrency(0)
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerReport;
