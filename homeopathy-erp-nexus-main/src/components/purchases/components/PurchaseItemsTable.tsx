
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PurchaseItemDiscountInfo from "./PurchaseItemDiscountInfo";
import { useDiscountCalculation } from "../hooks/useDiscountCalculation";

interface PurchaseItemsTableProps {
  items: any[];
  products: any[];
  brands: any[];
  categories: any[];
  supplierId: string;
  onItemChange: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

const PurchaseItemsTable = ({ 
  items, 
  products, 
  brands, 
  categories, 
  supplierId,
  onItemChange, 
  onAddItem, 
  onRemoveItem 
}: PurchaseItemsTableProps) => {
  
  const {
    getItemDiscount,
    getItemPricing,
    getTotalDiscountAmount,
    getTotalOriginalAmount
  } = useDiscountCalculation({
    supplierId,
    items: items.map((item, index) => ({
      ...item,
      brandId: products.find(p => p.id === item.productId)?.brand_id,
      categoryId: products.find(p => p.id === item.productId)?.category_id,
      brandName: brands.find(b => b.id === products.find(p => p.id === item.productId)?.brand_id)?.name,
      categoryName: categories.find(c => c.id === products.find(p => p.id === item.productId)?.category_id)?.name
    }))
  });

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      onItemChange(index, 'productId', productId);
      onItemChange(index, 'unitPrice', product.purchase_price || 0);
      onItemChange(index, 'brandId', product.brand_id || '');
      onItemChange(index, 'categoryId', product.category_id || '');
    }
  };

  const calculateItemTotal = (item: any, index: number) => {
    const discount = getItemDiscount(index, item.productId);
    if (discount) {
      return discount.discountedAmount;
    }
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  const hasDiscounts = getTotalDiscountAmount() > 0;

  return (
    <div className="space-y-4">
      {/* Discount Summary */}
      {hasDiscounts && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800">Supplier Discounts Applied</h4>
              <p className="text-sm text-green-600">
                Total Savings: ₹{getTotalDiscountAmount().toFixed(2)} on ₹{getTotalOriginalAmount().toFixed(2)}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              {((getTotalDiscountAmount() / getTotalOriginalAmount()) * 100).toFixed(1)}% Total Discount
            </Badge>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[120px]">Unit Price</TableHead>
              <TableHead className="w-[120px]">Total</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const brand = brands.find(b => b.id === product?.brand_id);
              const category = categories.find(c => c.id === product?.category_id);
              const discount = getItemDiscount(index, item.productId);
              const pricing = getItemPricing(index, item.productId);
              const itemTotal = calculateItemTotal(item, index);

              return (
                <React.Fragment key={index}>
                  <TableRow>
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleProductChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex flex-col">
                                <span>{product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {product.product_code} | ₹{product.purchase_price || 0}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {brand?.name || '-'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {category?.name || '-'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => onItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                        {discount && (
                          <div className="text-xs text-green-600">
                            Effective: ₹{pricing?.discountedRate.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">₹{itemTotal.toFixed(2)}</div>
                        {discount && (
                          <div className="text-xs text-muted-foreground line-through">
                            ₹{discount.originalAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Show discount information row */}
                  {discount && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <PurchaseItemDiscountInfo
                          discount={discount}
                          pricing={pricing!}
                          index={index}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <Button type="button" variant="outline" onClick={onAddItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
};

export default PurchaseItemsTable;
