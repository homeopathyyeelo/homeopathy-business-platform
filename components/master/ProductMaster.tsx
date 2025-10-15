
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import ProductManagementForm from './ProductManagementForm';
import ProductSearchBar from './product-list/ProductSearchBar';
import ProductTable from './product-list/ProductTable';
import ProductDetailsSheet from './product-list/ProductDetailsSheet';
import DeleteProductDialog from './product-list/DeleteProductDialog';
import useProductManagement from './product-list/useProductManagement';

const ProductMaster = () => {
  const {
    searchTerm,
    setSearchTerm,
    isAddProductOpen,
    setIsAddProductOpen,
    editingProduct,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    isProductDetailsOpen,
    setIsProductDetailsOpen,
    selectedProduct,
    products,
    categories,
    inventory,
    getStockLevel,
    handleViewProduct,
    handleEditProduct,
    confirmDeleteProduct,
    handleDeleteProduct,
    handleSaveProduct
  } = useProductManagement();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Homeopathic Medicines</CardTitle>
        <Button onClick={() => setIsAddProductOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Medicine
        </Button>
      </CardHeader>
      <CardContent>
        <ProductSearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />

        <ProductTable 
          products={products}
          categories={categories}
          onView={handleViewProduct}
          onEdit={handleEditProduct}
          onDelete={(product) => confirmDeleteProduct(product)}
          searchTerm={searchTerm}
          getStockLevel={getStockLevel}
        />
      </CardContent>

      {/* Add/Edit Product Dialog - Made horizontally scrollable */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Homeopathic Medicine' : 'Add New Homeopathic Medicine'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto overflow-y-auto max-h-[80vh] pr-2">
            <div className="min-w-[800px]">
              <ProductManagementForm
                product={editingProduct || undefined}
                onSave={handleSaveProduct}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        product={productToDelete}
        onDelete={handleDeleteProduct}
      />

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        isOpen={isProductDetailsOpen}
        onOpenChange={setIsProductDetailsOpen}
        product={selectedProduct}
        categories={categories}
        getStockLevel={getStockLevel}
        onEdit={handleEditProduct}
      />
    </Card>
  );
};

export default ProductMaster;
