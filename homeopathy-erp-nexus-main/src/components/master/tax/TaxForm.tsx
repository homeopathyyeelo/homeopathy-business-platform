
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FinancialTax as Tax } from "@/types";

interface TaxFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentTax: Partial<Tax>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => Promise<void>;
}

export const TaxForm: React.FC<TaxFormProps> = ({
  isOpen,
  onClose,
  currentTax,
  onChange,
  onSave
}) => {
  const handleSelectChange = (value: string) => {
    const event = {
      target: {
        name: "type",
        value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  const handleSave = async () => {
    try {
      console.log('=== TAX SAVE OPERATION START ===');
      console.log('Current tax data:', currentTax);
      
      await onSave();
      
      console.log('=== TAX SAVE OPERATION SUCCESS ===');
    } catch (error) {
      console.error('=== TAX SAVE OPERATION FAILED ===');
      console.error('Error saving tax:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentTax.id ? "Edit Tax" : "Add New Tax"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={currentTax.name || ""}
              onChange={onChange}
              placeholder="Tax Name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="percentage">Percentage</Label>
            <Input
              id="percentage"
              name="percentage"
              type="number"
              step="0.01"
              value={currentTax.percentage || 0}
              onChange={onChange}
              placeholder="Tax Percentage"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={currentTax.type || "CGST"}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select Tax Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CGST">CGST</SelectItem>
                <SelectItem value="SGST">SGST</SelectItem>
                <SelectItem value="IGST">IGST</SelectItem>
                <SelectItem value="CESS">CESS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={currentTax.description || ""}
              onChange={onChange}
              placeholder="Tax Description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hsn_code">HSN Code</Label>
            <Input
              id="hsn_code"
              name="hsn_code"
              value={currentTax.hsn_code || ""}
              onChange={onChange}
              placeholder="HSN Code (Optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {currentTax.id ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
