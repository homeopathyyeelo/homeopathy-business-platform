
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MasterHeaderProps {
  title: string;
  buttonText: string;
  onAction: () => void;
}

export const MasterHeader: React.FC<MasterHeaderProps> = ({ 
  title, 
  buttonText, 
  onAction 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      <Button onClick={onAction} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> {buttonText}
      </Button>
    </div>
  );
};
