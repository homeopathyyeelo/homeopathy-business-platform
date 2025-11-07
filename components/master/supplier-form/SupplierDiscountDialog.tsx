
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { authFetch } from '@/lib/api/fetch-utils';

interface SupplierDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
}

type DiscountType = 'brand' | 'category' | 'volume' | 'payment_terms';

const SupplierDiscountDialog = ({ open, onOpenChange, supplierId, supplierName }: SupplierDiscountDialogProps) => {
  const { getAll, create, update, delete: deleteItem } = useDatabase();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    discountType: 'brand' as DiscountType,
    brandId: '',
    categoryId: '',
    minQuantity: '',
    minAmount: '',
    discountPercentage: '',
    discountAmount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    paymentTermsDays: '',
    isActive: true,
    notes: ''
  });

  // Fetch existing discounts for this supplier
  const { data: existingDiscounts = [], refetch } = useQuery({
    queryKey: ['supplier-discounts', supplierId],
    queryFn: () => getAll('supplier_discounts').then(data => 
      data.filter((d: any) => d.supplier_id === supplierId)
    ),
    enabled: open
  });

  // Fetch brands and categories for selection
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAll('brands')
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAll('categories')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const discountData = {
        supplier_id: supplierId,
        discount_type: formData.discountType,
        brand_id: formData.brandId || null,
        category_id: formData.categoryId || null,
        min_quantity: formData.minQuantity ? parseFloat(formData.minQuantity) : null,
        min_amount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        discount_percentage: parseFloat(formData.discountPercentage),
        discount_amount: formData.discountAmount ? parseFloat(formData.discountAmount) : null,
        valid_from: formData.validFrom,
        valid_until: formData.validUntil || null,
        payment_terms_days: formData.paymentTermsDays ? parseInt(formData.paymentTermsDays) : null,
        is_active: formData.isActive,
        notes: formData.notes
      };

      await create('supplier_discounts', discountData);
      
      toast({
        title: "Discount Added",
        description: "Supplier discount has been created successfully"
      });
      
      // Reset form
      setFormData({
        discountType: 'brand',
        brandId: '',
        categoryId: '',
        minQuantity: '',
        minAmount: '',
        discountPercentage: '',
        discountAmount: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        paymentTermsDays: '',
        isActive: true,
        notes: ''
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create discount: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (discountId: string) => {
    try {
      await deleteItem('supplier_discounts', discountId);
      toast({
        title: "Discount Deleted",
        description: "Supplier discount has been removed"
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete discount: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'brand': return 'Brand-wise';
      case 'category': return 'Category-wise';
      case 'volume': return 'Volume-based';
      case 'payment_terms': return 'Payment Terms';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier Discounts - {supplierName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Discount Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select 
                    value={formData.discountType} 
                    onValueChange={(value: DiscountType) => setFormData(prev => ({ ...prev, discountType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">Brand-wise Discount</SelectItem>
                      <SelectItem value="category">Category-wise Discount</SelectItem>
                      <SelectItem value="volume">Volume-based Discount</SelectItem>
                      <SelectItem value="payment_terms">Payment Terms Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.discountType === 'brand' && (
                  <div>
                    <Label htmlFor="brandId">Brand</Label>
                    <Select 
                      value={formData.brandId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.discountType === 'category' && (
                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.discountType === 'volume' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minQuantity">Min Quantity</Label>
                      <Input
                        id="minQuantity"
                        type="number"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                        placeholder="Minimum quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minAmount">Min Amount ()</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        value={formData.minAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, minAmount: e.target.value }))}
                        placeholder="Minimum amount"
                      />
                    </div>
                  </div>
                )}

                {formData.discountType === 'payment_terms' && (
                  <div>
                    <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTermsDays"
                      type="number"
                      value={formData.paymentTermsDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsDays: e.target.value }))}
                      placeholder="Payment within days"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountPercentage">Discount %</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      step="0.01"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                      placeholder="Discount percentage"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountAmount">Fixed Discount ()</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: e.target.value }))}
                      placeholder="Fixed discount amount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this discount"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Discounts List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Discounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingDiscounts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No discounts configured for this supplier
                  </p>
                ) : (
                  existingDiscounts.map((discount: any) => (
                    <div key={discount.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant={discount.is_active ? "default" : "secondary"}>
                            {getDiscountTypeLabel(discount.discount_type)}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {discount.discount_percentage}% discount
                            {discount.discount_amount && ` + ${discount.discount_amount} fixed`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(discount.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {discount.brand_id && (
                        <div className="text-sm">
                          <span className="font-medium">Brand:</span> {
                            brands.find((b: any) => b.id === discount.brand_id)?.name || 'Unknown'
                          }
                        </div>
                      )}
                      
                      {discount.category_id && (
                        <div className="text-sm">
                          <span className="font-medium">Category:</span> {
                            categories.find((c: any) => c.id === discount.category_id)?.name || 'Unknown'
                          }
                        </div>
                      )}
                      
                      {discount.min_quantity && (
                        <div className="text-sm">
                          <span className="font-medium">Min Qty:</span> {discount.min_quantity}
                        </div>
                      )}
                      
                      {discount.min_amount && (
                        <div className="text-sm">
                          <span className="font-medium">Min Amount:</span> {discount.min_amount}
                        </div>
                      )}
                      
                      {discount.payment_terms_days && (
                        <div className="text-sm">
                          <span className="font-medium">Payment Terms:</span> {discount.payment_terms_days} days
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Valid: {new Date(discount.valid_from).toLocaleDateString()} 
                        {discount.valid_until && ` - ${new Date(discount.valid_until).toLocaleDateString()}`}
                      </div>
                      
                      {discount.notes && (
                        <div className="text-sm mt-1 italic">{discount.notes}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDiscountDialog;
