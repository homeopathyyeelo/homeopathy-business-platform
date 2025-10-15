
import { useTaxContext } from "./TaxContext";
import { TaxHeader } from "./TaxHeader";
import { TaxList } from "./TaxList";
import { TaxForm } from "./TaxForm";
import { DeleteTaxDialog } from "./DeleteTaxDialog";
import { FinancialTax as Tax } from "@/types";

export const TaxContent = () => {
  const {
    taxes,
    isLoading,
    isDialogOpen,
    isDeleteDialogOpen,
    currentTax,
    handleOpenDialog,
    handleInputChange,
    handleSave,
    handleDelete,
    openDeleteDialog,
    setIsDialogOpen,
    setIsDeleteDialogOpen
  } = useTaxContext();

  // Now taxes will be correctly typed as FinancialTax[]
  const typedTaxes = taxes as Tax[];

  return (
    <>
      <TaxHeader onAddTax={() => handleOpenDialog()} />
      
      <TaxList 
        taxes={typedTaxes}
        isLoading={isLoading} 
        onEdit={handleOpenDialog} 
        onDelete={openDeleteDialog} 
      />

      {/* Add/Edit Tax Form */}
      <TaxForm 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        currentTax={currentTax}
        onChange={handleInputChange}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTaxDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};
