
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { usePurchaseForm } from "./hooks/usePurchaseForm";
import { PurchaseFormHeader } from "./components/PurchaseFormHeader";
import PurchaseItemsTable from "./components/PurchaseItemsTable";
import PurchaseTotals from "./components/PurchaseTotals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PurchaseFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: any;
}

const PurchaseForm = ({ onSave, onCancel, initialData }: PurchaseFormProps) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const {
    formData,
    suppliers,
    products,
    brands,
    categories,
    isSubmitting,
    subtotal,
    taxAmount,
    total,
    totalDiscountApplied,
    handleChange,
    handleSelectChange,
    handleItemChange,
    addItem,
    removeItem,
    handleSubmit: submitPurchase
  } = usePurchaseForm(onSave, initialData);
  
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.supplierInfo) {
      errors.push("Please select a supplier");
    }
    
    if (!formData.purchaseDate) {
      errors.push("Purchase date is required");
    }
    
    const hasValidItems = formData.items.some(item => 
      item.productId && item.quantity > 0 && item.unitPrice > 0
    );
    
    if (!hasValidItems) {
      errors.push("Please add at least one valid product with quantity and price");
    }
    
    const hasEmptyProducts = formData.items.some(item => 
      item.productId && (item.quantity <= 0 || item.unitPrice <= 0)
    );
    
    if (hasEmptyProducts) {
      errors.push("All products must have quantity and price greater than zero");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitPurchase(e);
    }
  };
  
  const clearValidationErrors = () => {
    setValidationErrors([]);
  };
  
  return (
    <form onSubmit={handleSubmit} onChange={clearValidationErrors}>
      <div className="space-y-4">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      
        <PurchaseFormHeader
          supplierInfo={formData.supplierInfo}
          purchaseDate={formData.purchaseDate}
          dueDate={formData.dueDate}
          status={formData.status}
          paymentStatus={formData.paymentStatus}
          suppliers={suppliers}
          onSelectChange={handleSelectChange}
          onChange={handleChange}
        />
        
        <PurchaseItemsTable
          items={formData.items}
          products={products}
          brands={brands}
          categories={categories}
          supplierId={formData.supplierInfo}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />
        
        <PurchaseTotals
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          totalDiscountApplied={totalDiscountApplied}
        />
        
        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter additional notes or terms"
            className="h-20"
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Purchase"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PurchaseForm;
