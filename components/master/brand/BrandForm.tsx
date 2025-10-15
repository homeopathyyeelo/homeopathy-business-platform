
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brand } from "@/types";

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentBrand: Brand | null;
  onSave: (brand: Partial<Brand>) => Promise<void>;
}

const BrandForm = ({ isOpen, onClose, currentBrand, onSave }: BrandFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (currentBrand) {
      setFormData({
        name: currentBrand.name || "",
        description: currentBrand.description || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [currentBrand, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const brandData: Partial<Brand> = {
      id: currentBrand?.id,
      name: formData.name,
      description: formData.description,
      isActive: true,
      active: true,
      createdAt: currentBrand?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await onSave(brandData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentBrand ? "Edit Brand" : "Add New Brand"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., SBL, Dr. Reckeweg, Schwabe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the brand"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {currentBrand ? "Update Brand" : "Create Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandForm;
