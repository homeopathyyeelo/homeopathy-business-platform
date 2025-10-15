
import { Inventory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpiringSoonTableProps {
  expiringSoonItems: any[];
}

export const ExpiringSoonTable = ({ expiringSoonItems }: ExpiringSoonTableProps) => {
  // Get stock status class
  const getStockLevelClass = (stock: number, reorderLevel: number) => {
    if (stock <= 0) return "text-red-500 font-bold";
    if (stock <= reorderLevel) return "text-amber-500 font-bold";
    return "text-green-600";
  };

  return (
    <div>
      <h4 className="text-md font-semibold mb-2">Expiring Soon (Next 90 Days)</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Batch No</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Purchase Price</TableHead>
            <TableHead>Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expiringSoonItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">No products expiring soon</TableCell>
            </TableRow>
          ) : (
            expiringSoonItems.slice(0, 10).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.product?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{item.product?.potency}</div>
                </TableCell>
                <TableCell>{item.batchNumber}</TableCell>
                <TableCell>{formatDate(new Date(item.expiryDate))}</TableCell>
                <TableCell className={getStockLevelClass(
                  item.quantityInStock, 
                  item.product?.reorderLevel || 5
                )}>
                  {item.quantityInStock}
                </TableCell>
                <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                <TableCell>{formatCurrency(item.purchasePrice * item.quantityInStock)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
