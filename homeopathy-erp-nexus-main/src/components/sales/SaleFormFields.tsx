
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CustomerSelector from "../shared/CustomerSelector";
import { Customer } from "@/types";

interface SaleFormFieldsProps {
  date: string;
  setDate: (date: string) => void;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  paymentStatus: string;
  setPaymentStatus: (status: any) => void;
  paymentMethod: string;
  setPaymentMethod: (method: any) => void;
  notes: string;
  setNotes: (notes: string) => void;
  saleType: 'retail' | 'wholesale';
  pricingLevel?: string;
  setPricingLevel?: (level: string) => void;
}

const SaleFormFields = ({
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
  saleType,
  pricingLevel,
  setPricingLevel
}: SaleFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <CustomerSelector
            selectedCustomerId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            customerType={saleType}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
            <SelectTrigger id="paymentStatus">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {saleType === 'wholesale' && setPricingLevel && (
        <div className="space-y-2 mt-4">
          <Label htmlFor="pricingLevel">Pricing Level</Label>
          <Select value={pricingLevel || 'standard'} onValueChange={(value: string) => setPricingLevel(value)}>
            <SelectTrigger id="pricingLevel">
              <SelectValue placeholder="Select pricing level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="A">Level A (Premium)</SelectItem>
              <SelectItem value="B">Level B (Regular)</SelectItem>
              <SelectItem value="C">Level C (Economy)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or comments about this sale"
          rows={2}
        />
      </div>
    </>
  );
};

export default SaleFormFields;
