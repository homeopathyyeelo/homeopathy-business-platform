
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

interface PurchaseDataDisplayProps {
  purchases: any[];
}

export const PurchaseDataDisplay: React.FC<PurchaseDataDisplayProps> = ({ purchases }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No purchase records found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase: any) => (
                <TableRow key={purchase.id}>
                  <TableCell>{formatDate(purchase.date)}</TableCell>
                  <TableCell>{purchase.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{purchase.supplier?.name || 'Unknown Supplier'}</div>
                    <div className="text-xs text-muted-foreground">{purchase.supplier?.gstNumber || ''}</div>
                  </TableCell>
                  <TableCell>{purchase.items?.length || 0}</TableCell>
                  <TableCell>{formatCurrency(purchase.subtotal || 0)}</TableCell>
                  <TableCell>{formatCurrency(purchase.totalGstAmount || 0)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(purchase.total || 0)}</TableCell>
                  <TableCell>
                    {purchase.paymentStatus === 'paid' ? (
                      <Badge variant="outline" className="border-green-500 text-green-500">Paid</Badge>
                    ) : purchase.paymentStatus === 'partial' ? (
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
