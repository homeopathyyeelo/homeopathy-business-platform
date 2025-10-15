
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product, Inventory, InvoiceItem } from "@/types";
import EnhancedInvoiceItemForm from "./EnhancedInvoiceItemForm";

interface InvoiceItemsTableProps {
  items: Partial<InvoiceItem>[];
  products: Product[];
  inventoryItems: Inventory[];
  saleType: 'retail' | 'wholesale';
  onAddItem: () => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onRemoveItem: (index: number) => void;
  totals: { 
    subtotal: number; 
    gstAmount?: number; 
    total: number;
    itemDiscounts?: number;
    billDiscountAmount?: number;
  };
  showItemDiscounts?: boolean;
}

const InvoiceItemsTable = ({
  items,
  products,
  inventoryItems,
  saleType,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  totals,
  showItemDiscounts = false
}: InvoiceItemsTableProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Items</h3>
        <Button onClick={onAddItem} type="button" size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>
      
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Batch</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-right">Price</th>
              {showItemDiscounts && (
                <th className="p-2 text-right">Discount</th>
              )}
              <th className="p-2 text-right">GST %</th>
              <th className="p-2 text-right">GST Amount</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={showItemDiscounts ? 9 : 8} className="p-4 text-center text-muted-foreground">
                  No items added. Click "Add Item" to add products to this sale.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <EnhancedInvoiceItemForm 
                  key={item.id} 
                  item={item}
                  index={index}
                  products={products}
                  inventoryItems={inventoryItems}
                  saleType={saleType}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  showDiscount={showItemDiscounts}
                />
              ))
            )}
          </tbody>
          <tfoot className="bg-muted/30">
            <tr>
              <td colSpan={showItemDiscounts ? 6 : 5} className="p-2 text-right font-medium">Subtotal:</td>
              <td className="p-2 text-right">{formatCurrency(totals.gstAmount || 0)}</td>
              <td className="p-2 text-right font-medium">{formatCurrency(totals.subtotal)}</td>
              <td></td>
            </tr>
            {totals.itemDiscounts && totals.itemDiscounts > 0 && (
              <tr>
                <td colSpan={showItemDiscounts ? 6 : 5} className="p-2 text-right font-medium">Item Discounts:</td>
                <td className="p-2 text-right"></td>
                <td className="p-2 text-right font-medium text-red-500">-{formatCurrency(totals.itemDiscounts)}</td>
                <td></td>
              </tr>
            )}
            {totals.billDiscountAmount && totals.billDiscountAmount > 0 && (
              <tr>
                <td colSpan={showItemDiscounts ? 6 : 5} className="p-2 text-right font-medium">Bill Discount:</td>
                <td className="p-2 text-right"></td>
                <td className="p-2 text-right font-medium text-red-500">-{formatCurrency(totals.billDiscountAmount)}</td>
                <td></td>
              </tr>
            )}
            <tr>
              <td colSpan={showItemDiscounts ? 6 : 5} className="p-2 text-right font-medium">GST:</td>
              <td className="p-2 text-right"></td>
              <td className="p-2 text-right font-medium">{formatCurrency(totals.gstAmount || 0)}</td>
              <td></td>
            </tr>
            <tr className="border-t">
              <td colSpan={showItemDiscounts ? 6 : 5} className="p-2 text-right font-bold">Total:</td>
              <td className="p-2 text-right"></td>
              <td className="p-2 text-right font-bold">{formatCurrency(totals.total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
