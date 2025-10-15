
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseReportProps {
  purchases: any[];
  startDate: string;
  endDate: string;
}

const PurchaseReport = ({ purchases, startDate, endDate }: PurchaseReportProps) => {
  // Calculate totals
  const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalGst = purchases.reduce((sum, purchase) => sum + purchase.totalGstAmount, 0);
  const totalCgst = purchases.reduce((sum, purchase) => sum + purchase.cgstAmount, 0);
  const totalSgst = purchases.reduce((sum, purchase) => sum + purchase.sgstAmount, 0);
  const totalIgst = purchases.reduce((sum, purchase) => sum + purchase.igstAmount, 0);
  
  // Calculate by payment status
  const paidPurchases = purchases
    .filter(purchase => purchase.paymentStatus === 'paid')
    .reduce((sum, purchase) => sum + purchase.total, 0);
    
  const pendingPurchases = purchases
    .filter(purchase => purchase.paymentStatus === 'pending')
    .reduce((sum, purchase) => sum + purchase.total, 0);
    
  const partialPurchases = purchases
    .filter(purchase => purchase.paymentStatus === 'partial')
    .reduce((sum, purchase) => sum + purchase.total, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Purchase Report ({formatDate(new Date(startDate))} to {formatDate(new Date(endDate))})</h3>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total Purchases</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalPurchaseAmount)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Total GST Paid</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalGst)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Net Purchase Value</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalPurchaseAmount - totalGst)}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">CGST Amount</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalCgst)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">SGST Amount</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalSgst)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">IGST Amount</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalIgst)}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Paid Purchases</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(paidPurchases)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Pending Payments</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(pendingPurchases)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Partial Payments</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{formatCurrency(partialPurchases)}</p>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Recent Purchases</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice No</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No purchase data for selected period</TableCell>
              </TableRow>
            ) : (
              purchases.slice(0, 10).map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{formatDate(new Date(purchase.date))}</TableCell>
                  <TableCell>{purchase.invoiceNumber}</TableCell>
                  <TableCell>{purchase.supplier?.name || 'Unknown Supplier'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.subtotal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.totalGstAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.total)}</TableCell>
                  <TableCell className="capitalize">{purchase.paymentStatus}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchaseReport;
