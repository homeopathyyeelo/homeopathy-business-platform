
import { useState } from "react";
import { useDatabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SupplierFormProps {
  supplier?: any;
  onSave: () => void;
  onCancel: () => void;
}

const SupplierForm = ({ supplier, onSave, onCancel }: SupplierFormProps) => {
  const { create, update } = useDatabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_id: supplier?.supplier_id || `SUPP-${Date.now()}`,
    company_name: supplier?.company_name || "",
    contact_person: supplier?.contact_person || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    city: supplier?.city || "",
    state: supplier?.state || "",
    pincode: supplier?.pincode || "",
    gst_number: supplier?.gst_number || "",
    bank_account: supplier?.bank_account || "",
    bank_name: supplier?.bank_name || "",
    ifsc_code: supplier?.ifsc_code || "",
    opening_balance: supplier?.opening_balance !== undefined ? supplier.opening_balance : 0,
    balance_type: supplier?.balance_type || "credit",
    is_active: supplier?.is_active !== undefined ? supplier.is_active : true
  });
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in company name",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (supplier?.id) {
        // Update existing supplier
        await update("suppliers", supplier.id, formData);
        toast({
          title: "Supplier Updated",
          description: `Supplier ${formData.company_name} has been updated`
        });
      } else {
        // Create new supplier
        await create("suppliers", formData);
        toast({
          title: "Supplier Created",
          description: `Supplier ${formData.company_name} has been created`
        });
      }
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save supplier: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <Label htmlFor="supplier_id">Supplier ID</Label>
          <Input
            id="supplier_id"
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            name="gst_number"
            value={formData.gst_number}
            onChange={handleChange}
          />
        </div>
        
        {/* Address Information */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
          />
        </div>
        
        {/* Bank Information */}
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name</Label>
          <Input
            id="bank_name"
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bank_account">Account Number</Label>
          <Input
            id="bank_account"
            name="bank_account"
            value={formData.bank_account}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ifsc_code">IFSC Code</Label>
          <Input
            id="ifsc_code"
            name="ifsc_code"
            value={formData.ifsc_code}
            onChange={handleChange}
          />
        </div>
        
        {/* Financial Information */}
        <div className="space-y-2">
          <Label htmlFor="opening_balance">Opening Balance</Label>
          <Input
            id="opening_balance"
            name="opening_balance"
            type="number"
            value={formData.opening_balance}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="balance_type">Balance Type</Label>
          <Select
            value={formData.balance_type}
            onValueChange={(value) => handleSelectChange("balance_type", value)}
          >
            <SelectTrigger id="balance_type">
              <SelectValue placeholder="Select Balance Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <Select
            value={formData.is_active ? "active" : "inactive"}
            onValueChange={(value) => handleSelectChange("is_active", value === "active" ? "true" : "false")}
          >
            <SelectTrigger id="is_active">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Supplier"}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
