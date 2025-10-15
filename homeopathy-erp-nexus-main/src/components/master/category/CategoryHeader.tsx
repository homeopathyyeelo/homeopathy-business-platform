
import React from "react";
import { MasterHeader } from "../shared/MasterHeader";

interface CategoryHeaderProps {
  onAddCategory: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({ onAddCategory }) => {
  return (
    <MasterHeader 
      title="Category Management" 
      buttonText="Add Category" 
      onAction={onAddCategory} 
    />
  );
};
