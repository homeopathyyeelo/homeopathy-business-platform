
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Percent } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import SupplierForm from './supplier-form/SupplierForm';
import SupplierDiscountDialog from './supplier-form/SupplierDiscountDialog';

const SupplierMaster = () => {
  const { getAll } = useDatabase();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  
  const { data: suppliers = [], isLoading, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getAll('suppliers')
  });
  
  // Fetch discount counts for each supplier
  const { data: supplierDiscounts = [] } = useQuery({
    queryKey: ['supplier-discounts-summary'],
    queryFn: () => getAll('supplier_discounts')
  });
  
  const getDiscountCount = (supplierId: string) => {
    return supplierDiscounts.filter((d: any) => d.supplier_id === supplierId && d.is_active).length;
  };
  
  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const searchLower = searchTerm.toLowerCase();
    return supplier.company_name?.toLowerCase().includes(searchLower) || 
           supplier.contact_person?.toLowerCase().includes(searchLower) || 
           supplier.email?.toLowerCase().includes(searchLower) ||
           supplier.phone?.toLowerCase().includes(searchLower) ||
           supplier.supplier_id?.toLowerCase().includes(searchLower);
  });
  
  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  };
  
  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };
  
  const handleManageDiscounts = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDiscountDialogOpen(true);
  };
  
  const handleSaveSupplier = async () => {
    setIsDialogOpen(false);
    await refetch();
    toast({
      title: selectedSupplier ? "Supplier Updated" : "Supplier Created",
      description: `Supplier has been ${selectedSupplier ? 'updated' : 'added'} successfully`
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Suppliers</CardTitle>
        <Button onClick={handleAddSupplier}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <Input 
            placeholder="Search suppliers..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="max-w-xs"
          />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Discounts</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading suppliers...</TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">No suppliers found</TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier: any) => {
                const discountCount = getDiscountCount(supplier.id);
                return (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.supplier_id}</TableCell>
                    <TableCell>{supplier.company_name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.city || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={discountCount > 0 ? "default" : "secondary"}>
                          {discountCount} {discountCount === 1 ? 'discount' : 'discounts'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageDiscounts(supplier)}
                          className="h-6 px-2"
                        >
                          <Percent className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSupplier(supplier)}>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Supplier Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm 
            supplier={selectedSupplier}
            onSave={handleSaveSupplier}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Supplier Discount Dialog */}
      {selectedSupplier && (
        <SupplierDiscountDialog
          open={isDiscountDialogOpen}
          onOpenChange={setIsDiscountDialogOpen}
          supplierId={selectedSupplier.id}
          supplierName={selectedSupplier.company_name}
        />
      )}
    </Card>
  );
};

export default SupplierMaster;
