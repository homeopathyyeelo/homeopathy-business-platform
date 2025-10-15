
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inventory, Product } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpiryReportProps {
  inventory: Inventory[];
  products: Product[];
}

const ExpiryReport = ({ inventory, products }: ExpiryReportProps) => {
  // Join inventory with products
  const inventoryWithProducts = inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.quantityInStock > 0); // Only consider items with stock
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate date thresholds
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(today.getMonth() + 1);
  
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);
  
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);
  
  // Categorize by expiry timeline
  const expired = inventoryWithProducts.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });
  
  const expiringWithinMonth = inventoryWithProducts.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= today && expiryDate <= oneMonthFromNow;
  });
  
  const expiringWithinThreeMonths = inventoryWithProducts.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate > oneMonthFromNow && expiryDate <= threeMonthsFromNow;
  });
  
  const expiringWithinSixMonths = inventoryWithProducts.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate > threeMonthsFromNow && expiryDate <= sixMonthsFromNow;
  });
  
  // Calculate value of expired and soon-to-expire inventory
  const expiredValue = expired.reduce((sum, item) => {
    return sum + (item.purchasePrice * item.quantityInStock);
  }, 0);
  
  const atRiskValue = [...expiringWithinMonth, ...expiringWithinThreeMonths].reduce((sum, item) => {
    return sum + (item.purchasePrice * item.quantityInStock);
  }, 0);

  // Get badge for expiry status
  const getExpiryBadge = (expiryDate: Date) => {
    const date = new Date(expiryDate);
    
    if (date < today) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (date <= oneMonthFromNow) {
      return <Badge variant="outline" className="border-red-500 text-red-500">Within 1 Month</Badge>;
    }
    
    if (date <= threeMonthsFromNow) {
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Within 3 Months</Badge>;
    }
    
    if (date <= sixMonthsFromNow) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Within 6 Months</Badge>;
    }
    
    return <Badge variant="outline" className="border-green-500 text-green-500">Valid</Badge>;
  };

  // Helper function to get potency display
  const getPotencyDisplay = (product: Product | undefined) => {
    if (!product?.potency) return 'N/A';
    if (typeof product.potency === 'string') return product.potency;
    return product.potency.fullNotation || 'N/A';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Expiry Report</h3>
      
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Expired Products</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{expired.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Expiring in 1 Month</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{expiringWithinMonth.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Expiring in 3 Months</p>
          <p className="text-2xl font-bold mt-2 text-yellow-600">{expiringWithinThreeMonths.length}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Expiring in 6 Months</p>
          <p className="text-2xl font-bold mt-2">{expiringWithinSixMonths.length}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Value of Expired Stock</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(expiredValue)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Value of At-Risk Stock</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">{formatCurrency(atRiskValue)}</p>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Expiry Details</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch No</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...expired, ...expiringWithinMonth, ...expiringWithinThreeMonths, ...expiringWithinSixMonths].length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No expiring products found</TableCell>
              </TableRow>
            ) : (
              [...expired, ...expiringWithinMonth, ...expiringWithinThreeMonths, ...expiringWithinSixMonths]
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.product?.fullMedicineName || item.product?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getPotencyDisplay(item.product)}
                      </div>
                    </TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>{formatDate(new Date(item.expiryDate))}</TableCell>
                    <TableCell className="text-center">{item.quantityInStock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.purchasePrice * item.quantityInStock)}</TableCell>
                    <TableCell>{getExpiryBadge(item.expiryDate)}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExpiryReport;
