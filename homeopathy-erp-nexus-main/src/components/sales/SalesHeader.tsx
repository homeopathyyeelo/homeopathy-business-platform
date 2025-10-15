
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

interface SalesHeaderProps {
  onExport: () => void;
  onUploadClick: () => void;
  onSalesReturnClick: () => void;
}

const SalesHeader = ({ onExport, onUploadClick, onSalesReturnClick }: SalesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
      <div className="flex space-x-2">
        <Button onClick={onSalesReturnClick} variant="outline" className="flex items-center">
          <RotateCcw className="mr-2 h-4 w-4" />
          Sales Return
        </Button>
        <Button onClick={onUploadClick} variant="outline" className="flex items-center">
          <FileUp className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <Button variant="outline" className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button onClick={onExport} variant="outline" className="flex items-center">
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default SalesHeader;
