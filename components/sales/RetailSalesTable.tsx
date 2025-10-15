
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Invoice } from "@/types";

interface RetailSalesTableProps {
  invoices: any[];
}

const RetailSalesTable = ({ invoices }: RetailSalesTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No retail sales found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.customer?.name || 'Unknown Customer'}</div>
                    <div className="text-xs text-muted-foreground">{invoice.customer?.phone || ''}</div>
                  </TableCell>
                  <TableCell>{invoice.items?.length || 0}</TableCell>
                  <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
                  <TableCell>{formatCurrency(invoice.gstAmount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>
                    {invoice.paymentStatus === 'paid' ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">Paid</Badge>
                    ) : invoice.paymentStatus === 'partial' ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">Partial</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-500">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RetailSalesTable;
