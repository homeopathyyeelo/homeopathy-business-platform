
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface BatchWiseInventoryProps {
  inventory: any[];
  products: any[];
  filteredInventory: any[];
  onAdjustStock?: (item: any) => void;
}

const BatchWiseInventory = ({ 
  inventory,
  products,
  filteredInventory,
  onAdjustStock 
}: BatchWiseInventoryProps) => {

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Purchase Price</TableHead>
          <TableHead className="text-right">Selling Price</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInventory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              No inventory items found
            </TableCell>
          </TableRow>
        ) : (
          filteredInventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{getProductName(item.productId)}</TableCell>
              <TableCell>{item.batchNumber || 'N/A'}</TableCell>
              <TableCell>{item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <span className={item.quantityInStock <= 5 ? "text-red-500 font-bold" : ""}>
                  {item.quantityInStock}
                </span>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.sellingPriceRetail)}</TableCell>
              <TableCell>{item.rackLocation || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onAdjustStock && onAdjustStock(item)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default BatchWiseInventory;
