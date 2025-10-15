import { useState } from "react";
import { useDatabase } from "@/lib/db-client";
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
import { Customer } from "@/types";

interface CustomerFormProps {
  customer?: Partial<Customer>;
  onSave: () => void;
  onCancel: () => void;
}

const CustomerForm = ({ customer, onSave, onCancel }: CustomerFormProps) => {
  const { create, update } = useDatabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: (customer as any)?.customer_id || `CUST-${Date.now()}`,
    first_name: (customer as any)?.first_name || customer?.firstName || "",
    last_name: (customer as any)?.last_name || customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    state: customer?.state || "",
    pincode: customer?.pincode || "",
    gst_number: (customer as any)?.gst_number || customer?.gstNumber || "",
    type: customer?.type || "retail",
    credit_limit: (customer as any)?.credit_limit !== undefined ? (customer as any).credit_limit : (customer?.creditLimit !== undefined ? customer.creditLimit : 0),
    opening_balance: (customer as any)?.opening_balance !== undefined ? (customer as any).opening_balance : (customer?.openingBalance !== undefined ? customer.openingBalance : 0),
    outstanding_balance: (customer as any)?.outstanding_balance !== undefined ? (customer as any).outstanding_balance : (customer?.outstandingBalance !== undefined ? customer.outstandingBalance : 0),
    balance_type: (customer as any)?.balance_type || customer?.balanceType || "credit",
    price_level: (customer as any)?.price_level || customer?.priceLevel || "A",
    is_active: (customer as any)?.is_active !== undefined ? (customer as any).is_active : (customer?.isActive !== undefined ? customer.isActive : true),
    default_discount_percentage: (customer as any)?.default_discount_percentage || 0,
    discount_type: (customer as any)?.discount_type || "percentage",
    credit_days: (customer as any)?.credit_days || 0,
    max_credit_limit: (customer as any)?.max_credit_limit || 0,
    loyalty_points: (customer as any)?.loyalty_points || 0
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
    
    if (!formData.first_name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Map the form data to match the Customer type structure
      const customerData = {
        id: formData.customer_id.replace('CUST-', ''),
        firstName: formData.first_name,
        lastName: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstNumber: formData.gst_number,
        type: formData.type as "retail" | "wholesale",
        creditLimit: formData.credit_limit,
        openingBalance: formData.opening_balance,
        outstandingBalance: formData.outstanding_balance,
        balanceType: formData.balance_type as "credit" | "debit",
        priceLevel: formData.price_level as "A" | "B" | "C",
        isActive: formData.is_active === true,
        active: formData.is_active === true, // For backward compatibility
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (customer?.id) {
        // Update existing customer
        await update("customers", customer.id, customerData);
        toast({
          title: "Customer Updated",
          description: `Customer ${formData.first_name} has been updated`
        });
      } else {
        // Create new customer
        await create("customers", customerData);
        toast({
          title: "Customer Created",
          description: `Customer ${formData.first_name} has been created`
        });
      }
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save customer: ${error.message}`,
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
          <Label htmlFor="customer_id">Customer ID</Label>
          <Input
            id="customer_id"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
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
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Customer Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleSelectChange("type", value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
            </SelectContent>
          </Select>
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
        
        {/* Financial Information */}
        <div className="space-y-2">
          <Label htmlFor="credit_limit">Credit Limit</Label>
          <Input
            id="credit_limit"
            name="credit_limit"
            type="number"
            value={formData.credit_limit}
            onChange={handleChange}
          />
        </div>
        
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
          <Label htmlFor="outstanding_balance">Outstanding Balance</Label>
          <Input
            id="outstanding_balance"
            name="outstanding_balance"
            type="number"
            value={formData.outstanding_balance}
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
          <Label htmlFor="price_level">Price Level</Label>
          <Select
            value={formData.price_level}
            onValueChange={(value) => handleSelectChange("price_level", value)}
          >
            <SelectTrigger id="price_level">
              <SelectValue placeholder="Select Price Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Level A</SelectItem>
              <SelectItem value="B">Level B</SelectItem>
              <SelectItem value="C">Level C</SelectItem>
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

        {/* Discount Settings */}
        <div className="space-y-2">
          <Label htmlFor="default_discount_percentage">Default Discount %</Label>
          <Input
            id="default_discount_percentage"
            name="default_discount_percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.default_discount_percentage}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value) => handleSelectChange("discount_type", value)}
          >
            <SelectTrigger id="discount_type">
              <SelectValue placeholder="Select Discount Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit_days">Credit Days</Label>
          <Input
            id="credit_days"
            name="credit_days"
            type="number"
            min="0"
            value={formData.credit_days}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_credit_limit">Max Credit Limit</Label>
          <Input
            id="max_credit_limit"
            name="max_credit_limit"
            type="number"
            min="0"
            step="0.01"
            value={formData.max_credit_limit}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loyalty_points">Loyalty Points</Label>
          <Input
            id="loyalty_points"
            name="loyalty_points"
            type="number"
            min="0"
            value={formData.loyalty_points}
            onChange={handleChange}
            disabled={!customer}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
