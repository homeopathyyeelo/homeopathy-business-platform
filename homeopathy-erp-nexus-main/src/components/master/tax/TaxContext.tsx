
import { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { FinancialTax as Tax } from "@/types";

interface TaxContextType {
  taxes: Tax[];
  isLoading: boolean;
  isDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  currentTax: Partial<Tax>;
  taxToDelete: string | null;
  setIsDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setCurrentTax: (tax: Partial<Tax>) => void;
  setTaxToDelete: (id: string | null) => void;
  handleOpenDialog: (tax?: Tax) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  openDeleteDialog: (id: string) => void;
  refetch: () => void;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAll, create, update, delete: deleteTax } = useDatabase();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTax, setCurrentTax] = useState<Partial<Tax>>({});
  const [taxToDelete, setTaxToDelete] = useState<string | null>(null);

  const { data: taxes = [], isLoading, refetch } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => getAll('taxes')
  });

  const handleOpenDialog = (tax?: Tax) => {
    if (tax) {
      setCurrentTax(tax);
    } else {
      setCurrentTax({
        name: '',
        percentage: 0,
        type: 'CGST', // Use valid tax type from the allowed list
        description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTax({
      ...currentTax,
      [name]: name === 'percentage' ? parseFloat(value) : value
    });
  };

  const handleSave = async () => {
    try {
      if (!currentTax.name || currentTax.percentage === undefined) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Make sure we have a valid tax type
      if (!currentTax.type || !["CGST", "SGST", "IGST", "CESS"].includes(currentTax.type)) {
        setCurrentTax({
          ...currentTax,
          type: "CGST"
        });
      }

      if (currentTax.id) {
        await update('taxes', currentTax.id, currentTax);
        toast({
          title: "Tax Updated",
          description: `${currentTax.name} has been updated successfully`
        });
      } else {
        await create('taxes', currentTax);
        toast({
          title: "Tax Created",
          description: `${currentTax.name} has been added successfully`
        });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `There was an error saving the tax: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!taxToDelete) return;

    try {
      await deleteTax('taxes', taxToDelete);
      toast({
        title: "Tax Deleted",
        description: "The tax has been deleted successfully"
      });
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `There was an error deleting the tax: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (id: string) => {
    setTaxToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const value = {
    taxes,
    isLoading,
    isDialogOpen,
    isDeleteDialogOpen,
    currentTax,
    taxToDelete,
    setIsDialogOpen,
    setIsDeleteDialogOpen,
    setCurrentTax,
    setTaxToDelete,
    handleOpenDialog,
    handleInputChange,
    handleSave,
    handleDelete,
    openDeleteDialog,
    refetch
  };

  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>;
};

export const useTaxContext = () => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    throw new Error("useTaxContext must be used within a TaxProvider");
  }
  return context;
};
