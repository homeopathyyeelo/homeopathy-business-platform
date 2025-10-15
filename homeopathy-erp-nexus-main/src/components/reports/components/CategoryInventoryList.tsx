
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface CategoryInventoryListProps {
  inventoryByCategory: Record<string, {
    name: string;
    items: any[];
    totalValue: number;
  }>;
}

export const CategoryInventoryList = ({ inventoryByCategory }: CategoryInventoryListProps) => {
  return (
    <div>
      <h4 className="text-md font-semibold mb-2">Inventory by Category</h4>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(inventoryByCategory).map((category: any) => (
          <Card key={category.name} className="overflow-hidden">
            <div className="bg-muted px-4 py-2 font-medium flex justify-between items-center">
              <span>{category.name}</span>
              <span>{formatCurrency(category.totalValue)}</span>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.items.slice(0, 5).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.batchNumber}</div>
                      </TableCell>
                      <TableCell>{item.quantityInStock}</TableCell>
                      <TableCell>{formatCurrency(item.purchasePrice * item.quantityInStock)}</TableCell>
                    </TableRow>
                  ))}
                  {category.items.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                        +{category.items.length - 5} more items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
