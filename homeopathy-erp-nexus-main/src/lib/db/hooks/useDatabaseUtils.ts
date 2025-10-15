
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useDatabaseUtils() {
  const { toast } = useToast();
  
  const handleError = (error: any) => {
    console.error("Database error:", error);
    toast({
      title: "Database Error",
      description: error.message || "An error occurred while accessing the database",
      variant: "destructive"
    });
  };

  return {
    handleError
  };
}
