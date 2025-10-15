
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product, Inventory, InvoiceItem } from "@/types";
import { useState } from "react";

interface InvoiceItemFormProps {
  item: Partial<InvoiceItem>;
  index: number;
  products: Product[];
  inventoryItems: Inventory[];
  saleType: 'retail' | 'wholesale';
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  showDiscount?: boolean;
}

const InvoiceItemForm = ({
  item,
  index,
  products,
  inventoryItems,
  saleType,
  onUpdate,
  onRemove,
  showDiscount = false
}: InvoiceItemFormProps) => {
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'amount'>(
    item.discountPercentage ? 'percentage' : item.discountAmount ? 'amount' : 'none'
  );

  // Find product details
  const product = products.find(p => p.id === item.productId);
  
  // Filter batches by product
  const availableBatches = item.productId
    ? inventoryItems.filter(inv => 
        inv.productId === item.productId && inv.quantityInStock > 0
      )
    : [];

  const handleDiscountTypeChange = (value: string) => {
    const newType = value as 'none' | 'percentage' | 'amount';
    setDiscountType(newType);
    
    // Reset existing discounts
    if (newType === 'none') {
      onUpdate(index, 'discountPercentage', undefined);
      onUpdate(index, 'discountAmount', undefined);
    } else if (newType === 'percentage') {
      onUpdate(index, 'discountAmount', undefined);
      onUpdate(index, 'discountPercentage', 0);
    } else {
      onUpdate(index, 'discountPercentage', undefined);
      onUpdate(index, 'discountAmount', 0);
    }
  };

  return (
    <tr className="border-b">
      <td className="p-2">
        <Select 
          value={item.productId} 
          onValueChange={(value) => onUpdate(index, 'productId', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      
      <td className="p-2">
        <Select 
          value={item.batchNumber} 
          onValueChange={(value) => onUpdate(index, 'batchNumber', value)}
          disabled={!item.productId || availableBatches.length === 0}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            {availableBatches.map((batch) => (
              <SelectItem key={batch.id} value={batch.batchNumber}>
                {batch.batchNumber} ({batch.quantityInStock})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      
      <td className="p-2">
        <Input
          type="number"
          min={1}
          value={item.quantity || 1}
          onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
          className="w-20"
        />
      </td>
      
      <td className="p-2 text-right">
        <div className="flex items-center justify-end space-x-1">
          <span>₹</span>
          <Input
            type="number"
            value={item.unitPrice || 0}
            onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
            className="w-20"
            step={0.01}
          />
        </div>
      </td>
      
      {showDiscount && (
        <td className="p-2 text-right">
          <div className="flex items-center justify-end space-x-1">
            <Select 
              value={discountType} 
              onValueChange={handleDiscountTypeChange}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="percentage">%</SelectItem>
                <SelectItem value="amount">₹</SelectItem>
              </SelectContent>
            </Select>
            
            {discountType !== 'none' && (
              <Input
                type="number"
                value={discountType === 'percentage' ? 
                  item.discountPercentage || 0 : 
                  item.discountAmount || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (discountType === 'percentage') {
                    onUpdate(index, 'discountPercentage', value);
                  } else {
                    onUpdate(index, 'discountAmount', value);
                  }
                }}
                className="w-20"
                min={0}
                max={discountType === 'percentage' ? 100 : item.unitPrice ? item.unitPrice * (item.quantity || 1) : 0}
                step={discountType === 'percentage' ? 0.1 : 1}
              />
            )}
          </div>
        </td>
      )}
      
      <td className="p-2 text-right">
        {item.gstPercentage || 0}%
      </td>
      
      <td className="p-2 text-right">
        {formatCurrency(item.gstAmount || 0)}
      </td>
      
      <td className="p-2 text-right">
        {formatCurrency(item.total || 0)}
      </td>
      
      <td className="p-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </td>
    </tr>
  );
};

export default InvoiceItemForm;
