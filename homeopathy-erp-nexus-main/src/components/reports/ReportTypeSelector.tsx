
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ReportTypeSelectorProps {
  reportType: string;
  onReportTypeChange: (type: string) => void;
}

const ReportTypeSelector = ({
  reportType,
  onReportTypeChange
}: ReportTypeSelectorProps) => {
  return (
    <div className="flex-grow sm:flex-grow-0">
      <Select value={reportType} onValueChange={onReportTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Report Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sales">Sales Report</SelectItem>
          <SelectItem value="inventory">Inventory Report</SelectItem>
          <SelectItem value="purchase">Purchase Report</SelectItem>
          <SelectItem value="customer">Customer Report</SelectItem>
          <SelectItem value="expiry">Expiry Report</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReportTypeSelector;
