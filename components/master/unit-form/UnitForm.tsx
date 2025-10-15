
import { useState } from "react";
import { useDatabase } from "@/lib/db-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UnitFormProps {
  unit?: any;
  allUnits?: any[];
  onSave: () => void;
  onCancel: () => void;
}

const UnitForm = ({ unit, allUnits = [], onSave, onCancel }: UnitFormProps) => {
  const { create, update } = useDatabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: unit?.name || "",
    short_name: unit?.short_name || "",
    base_unit_id: unit?.base_unit_id || null,
    conversion_factor: unit?.conversion_factor || 1,
    is_active: unit?.is_active !== undefined ? unit.is_active : true
  });
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.short_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const unitData = {
        ...formData,
        conversion_factor: formData.base_unit_id ? formData.conversion_factor : 1
      };
      
      if (unit?.id) {
        // Update existing unit
        await update("units", unit.id, unitData);
        toast({
          title: "Unit Updated",
          description: `Unit ${formData.name} has been updated`
        });
      } else {
        // Create new unit
        await create("units", unitData);
        toast({
          title: "Unit Created",
          description: `Unit ${formData.name} has been created`
        });
      }
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save unit: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter out the current unit from the base unit options
  const baseUnitOptions = allUnits.filter(u => u.id !== unit?.id);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Milliliter, Tablet"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="short_name">Abbreviation *</Label>
        <Input
          id="short_name"
          name="short_name"
          value={formData.short_name}
          onChange={handleChange}
          required
          placeholder="e.g., ml, tab"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="base_unit_id">Base Unit</Label>
        <Select
          value={formData.base_unit_id || ""}
          onValueChange={(value) => handleSelectChange("base_unit_id", value || null)}
        >
          <SelectTrigger id="base_unit_id">
            <SelectValue placeholder="Select Base Unit (if applicable)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (This is a base unit)</SelectItem>
            {baseUnitOptions.map((baseUnit) => (
              <SelectItem key={baseUnit.id} value={baseUnit.id}>
                {baseUnit.name} ({baseUnit.short_name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {formData.base_unit_id && (
        <div className="space-y-2">
          <Label htmlFor="conversion_factor">Conversion Factor</Label>
          <Input
            id="conversion_factor"
            name="conversion_factor"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.conversion_factor}
            onChange={handleChange}
            required={!!formData.base_unit_id}
            placeholder="e.g., 1000 (if 1 liter = 1000 ml)"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Unit"}
        </Button>
      </div>
    </form>
  );
};

export default UnitForm;
