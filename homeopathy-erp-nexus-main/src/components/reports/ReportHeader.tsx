
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ReportHeaderProps {
  onExport: () => void;
}

const ReportHeader = ({ onExport }: ReportHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
      <div className="flex space-x-2">
        <Button onClick={onExport} variant="outline" className="flex items-center">
          <FileDown className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

export default ReportHeader;
