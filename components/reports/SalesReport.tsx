
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Invoice, Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InvoiceType } from "@/types/financial";

interface SalesReportProps {
  invoices: Invoice[];
  customers: Customer[];
  startDate: string;
  endDate: string;
}

const SalesReport = ({ invoices, customers, startDate, endDate }: SalesReportProps) => {
  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Filter sales and returns
  const sales = invoices.filter(invoice => 
    !invoice.type.toString().startsWith('return_')
  );
  
  const returns = invoices.filter(invoice => 
    invoice.type.toString().startsWith('return_')
  );
  
  // Calculate total sales by type (retail vs wholesale)
  const retailSales = sales
    .filter(invoice => invoice.type === 'retail')
    .reduce((sum, invoice) => sum + invoice.total, 0);
    
  const wholesaleSales = sales
    .filter(invoice => invoice.type === 'wholesale')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  // Calculate total returns
  const retailReturns = returns
    .filter(invoice => invoice.type === 'return_retail')
    .reduce((sum, invoice) => sum + invoice.total, 0);
    
  const wholesaleReturns = returns
    .filter(invoice => invoice.type === 'return_wholesale')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  // Calculate total GST
  const totalGstCollected = sales.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
  const totalGstReturned = returns.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
  const netGst = totalGstCollected - totalGstReturned;
  
  // Calculate sales by payment status
  const paidSales = sales
    .filter(invoice => invoice.paymentStatus === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);
    
  const pendingSales = sales
    .filter(invoice => invoice.paymentStatus === 'pending')
    .reduce((sum, invoice) => sum + invoice.total, 0);
    
  const partialSales = sales
    .filter(invoice => invoice.paymentStatus === 'partial')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  // Net sales
  const totalSales = retailSales + wholesaleSales;
  const totalReturns = retailReturns + wholesaleReturns;
  const netSales = totalSales - totalReturns;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sales Report ({formatDate(new Date(startDate))} to {formatDate(new Date(endDate))})</h3>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Net Sales</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(netSales)}</p>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Sales: {formatCurrency(totalSales)}</span>
            <span>Returns: -{formatCurrency(totalReturns)}</span>
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Sales by Type</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-sm">Retail</p>
              <p className="text-xl font-bold">{formatCurrency(retailSales)}</p>
            </div>
            <div>
              <p className="text-sm">Wholesale</p>
              <p className="text-xl font-bold">{formatCurrency(wholesaleSales)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">GST (Net)</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(netGst)}</p>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Collected: {formatCurrency(totalGstCollected)}</span>
            <span>Returned: -{formatCurrency(totalGstReturned)}</span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Paid Sales</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(paidSales)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Pending Sales</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(pendingSales)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Partial Payments</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{formatCurrency(partialSales)}</p>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Recent Sales</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <div>
            <h4 className="text-md font-semibold mb-2">Recent Invoices</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No sales data for selected period</TableCell>
                  </TableRow>
                ) : (
                  sales.slice(0, 10).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(new Date(invoice.date))}</TableCell>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                      <TableCell className="capitalize">{invoice.type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          invoice.paymentStatus === 'paid'
                            ? "border-green-500 text-green-500"
                            : invoice.paymentStatus === 'partial'
                            ? "border-amber-500 text-amber-500"
                            : "border-red-500 text-red-500"
                        }>
                          {invoice.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="returns">
          <div>
            <h4 className="text-md font-semibold mb-2">Recent Returns</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Return No</TableHead>
                  <TableHead>Original Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No returns data for selected period</TableCell>
                  </TableRow>
                ) : (
                  returns.slice(0, 10).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(new Date(invoice.date))}</TableCell>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.originalInvoiceId || 'N/A'}</TableCell>
                      <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                      <TableCell className="capitalize">{invoice.reason || 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesReport;
