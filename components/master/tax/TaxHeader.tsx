
import React from "react";
import { MasterHeader } from "../shared/MasterHeader";

interface TaxHeaderProps {
  onAddTax: () => void;
}

export const TaxHeader: React.FC<TaxHeaderProps> = ({ onAddTax }) => {
  return (
    <MasterHeader 
      title="Tax Management" 
      buttonText="Add Tax" 
      onAction={onAddTax} 
    />
  );
};
