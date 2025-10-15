import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InvoiceItemsTable from "./InvoiceItemsTable";
import { useCreateSale } from "./useCreateSale";
import { useState } from "react";
import SaleFormFields from "./SaleFormFields";
import InvoicePrintView from "./InvoicePrintView";
import DiscountSection from "./DiscountSection";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  saleType: 'retail' | 'wholesale';
}

const CreateSaleDialog = ({ open, onOpenChange, onSuccess, saleType }: CreateSaleDialogProps) => {
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);
  
  const {
    date,
    setDate,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentStatus,
    setPaymentStatus,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    pricingLevel,
    setPricingLevel,
    billDiscountMode,
    setBillDiscountMode,
    billDiscountValue,
    setBillDiscountValue,
    items,
    isSubmitting,
    filteredCustomers,
    products,
    inventoryItems,
    totals,
    gstTotals,
    addItem,
    removeItem,
    updateItem,
    handleSave
  } = useCreateSale(saleType, () => {
    if (onSuccess) onSuccess();
  });

  const onSave = async () => {
    const result = await handleSave(sendWhatsApp);
    if (result && result.success) {
      setCreatedInvoice(result.invoice);
      setShowInvoice(true);
    }
  };
  
  const handlePrint = () => {
    // The actual printing happens in the InvoicePrintView component now
    console.log("Printing invoice:", createdInvoice.invoiceNumber);
  };
  
  const handleDownload = () => {
    // The actual downloading happens in the InvoicePrintView component now
    console.log("Downloading invoice:", createdInvoice.invoiceNumber);
  };
  
  const handleClose = () => {
    setShowInvoice(false);
    onOpenChange(false);
  };

  // Find selected customer details
  const selectedCustomer = filteredCustomers.find((c: any) => c.id === selectedCustomerId);

  if (showInvoice && createdInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          
          <InvoicePrintView
            createdInvoice={createdInvoice}
            selectedCustomer={selectedCustomer}
            products={products}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
          
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New {saleType === 'retail' ? 'Retail' : 'Wholesale'} Sale</DialogTitle>
        </DialogHeader>
        
        <SaleFormFields
          date={date}
          setDate={setDate}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          notes={notes}
          setNotes={setNotes}
          saleType={saleType}
          pricingLevel={pricingLevel}
          setPricingLevel={setPricingLevel}
        />
        
        <InvoiceItemsTable 
          items={items}
          products={products}
          inventoryItems={inventoryItems}
          saleType={saleType}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          totals={totals}
          showItemDiscounts={true}
        />
        
        <DiscountSection
          subtotal={totals.subtotal}
          discountMode={billDiscountMode}
          setDiscountMode={setBillDiscountMode}
          discountValue={billDiscountValue}
          setDiscountValue={setBillDiscountValue}
          discountAmount={totals.billDiscountAmount}
        />

        {/* WhatsApp option */}
        {selectedCustomer?.phone && (
          <div className="flex items-center space-x-2 mb-2">
            <Switch
              id="send-whatsapp"
              checked={sendWhatsApp}
              onCheckedChange={setSendWhatsApp}
            />
            <Label htmlFor="send-whatsapp">
              Send invoice via WhatsApp to {selectedCustomer.phone}
            </Label>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSaleDialog;
