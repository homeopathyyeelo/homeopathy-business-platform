
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseFormHeaderProps {
  supplierInfo: string;
  purchaseDate: string;
  dueDate: string;
  status: string;
  paymentStatus: string;
  suppliers: any[];
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PurchaseFormHeader = ({
  supplierInfo,
  purchaseDate,
  dueDate,
  status,
  paymentStatus,
  suppliers,
  onSelectChange,
  onChange
}: PurchaseFormHeaderProps) => {
  return (
    <>
      {/* Supplier and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="supplierInfo">Supplier</Label>
          <Select
            value={supplierInfo}
            onValueChange={(value) => onSelectChange("supplierInfo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier: any) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={purchaseDate}
            onChange={onChange}
          />
        </div>
        
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            type="date"
            id="dueDate"
            name="dueDate"
            value={dueDate}
            onChange={onChange}
          />
        </div>
      </div>
      
      {/* Status and Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => onSelectChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select
            value={paymentStatus}
            onValueChange={(value) => onSelectChange("paymentStatus", value)}
          >
            <SelectTrigger id="paymentStatus">
              <SelectValue placeholder="Select Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};
