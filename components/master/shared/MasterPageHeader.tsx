
import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileUp, Plus, RefreshCw } from "lucide-react";

interface MasterPageHeaderProps {
  title: string;
  onExport?: () => void;
  onImport?: () => void;
  onAdd?: () => void;
  onRefresh?: () => void;
  addButtonText?: string;
}

export const MasterPageHeader: React.FC<MasterPageHeaderProps> = ({ 
  title, 
  onExport, 
  onImport, 
  onAdd, 
  onRefresh,
  addButtonText = "Add New"
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <div className="flex space-x-2">
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
        
        {onExport && (
          <Button onClick={onExport} variant="outline" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
        
        {onImport && (
          <Button onClick={onImport} variant="outline" className="flex items-center">
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
        
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};
