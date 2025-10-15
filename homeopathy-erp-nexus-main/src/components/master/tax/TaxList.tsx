
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash } from "lucide-react";
import { FinancialTax as Tax } from "@/types";

interface TaxListProps {
  taxes: Tax[];
  isLoading: boolean;
  onEdit: (tax: Tax) => void;
  onDelete: (id: string) => void;
}

export const TaxList: React.FC<TaxListProps> = ({ 
  taxes, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading tax data...
                </TableCell>
              </TableRow>
            ) : taxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No tax rates found. Add your first tax rate.
                </TableCell>
              </TableRow>
            ) : (
              taxes.map((tax: Tax) => (
                <TableRow key={tax.id}>
                  <TableCell>{tax.name}</TableCell>
                  <TableCell>{tax.type}</TableCell>
                  <TableCell>{tax.percentage}%</TableCell>
                  <TableCell>{tax.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(tax)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(tax.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
