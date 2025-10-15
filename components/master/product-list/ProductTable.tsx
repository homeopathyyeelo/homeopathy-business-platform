
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Product, Category } from '@/types';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  searchTerm: string;
  getStockLevel: (productId: string) => number;
}

const ProductTable = ({ 
  products, 
  categories, 
  onView, 
  onEdit, 
  onDelete, 
  searchTerm,
  getStockLevel 
}: ProductTableProps) => {
  // Filter products based on search term - now includes potency, form, and brand
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.fullMedicineName?.toLowerCase().includes(searchLower) ||
      product.potency?.fullNotation?.toLowerCase().includes(searchLower) ||
      product.form?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.manufacturer?.toLowerCase().includes(searchLower) ||
      product.brand?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getStockStatus = (productId: string, reorderLevel: number) => {
    const stock = getStockLevel(productId);
    if (stock === 0) return { status: 'Out of Stock', color: 'destructive' };
    if (stock <= reorderLevel) return { status: 'Low Stock', color: 'secondary' };
    return { status: 'In Stock', color: 'default' };
  };

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm ? 'No medicines found matching your search.' : 'No medicines added yet.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Medicine Identity</th>
            <th className="text-left p-3 font-medium">Potency</th>
            <th className="text-left p-3 font-medium">Form</th>
            <th className="text-left p-3 font-medium">Brand</th>
            <th className="text-left p-3 font-medium">Category</th>
            <th className="text-left p-3 font-medium">Stock</th>
            <th className="text-left p-3 font-medium">Price</th>
            <th className="text-left p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => {
            const stockInfo = getStockStatus(product.id, product.reorderLevel);
            const stockLevel = getStockLevel(product.id);
            
            return (
              <tr key={product.id} className="border-b hover:bg-muted/25">
                <td className="p-3">
                  <div>
                    <div className="font-medium text-sm">
                      {product.fullMedicineName || `${product.name} ${product.potency?.fullNotation || ''}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge 
                    variant="outline" 
                    className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {product.potency?.fullNotation || 'N/A'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {product.form ? product.form.charAt(0).toUpperCase() + product.form.slice(1) : 'N/A'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {product.brand?.name || 'N/A'}
                  </Badge>
                </td>
                <td className="p-3 text-sm">
                  {getCategoryName(product.categoryId)}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant={stockInfo.color as any} className="text-xs">
                      {stockInfo.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Qty: {stockLevel}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-sm">
                  ₹{product.defaultSellingPriceRetail?.toFixed(2) || '0.00'}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
