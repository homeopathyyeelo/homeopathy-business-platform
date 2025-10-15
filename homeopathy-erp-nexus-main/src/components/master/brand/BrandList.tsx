
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Globe, Mail, Phone } from "lucide-react";
import { Brand } from "@/types";

interface BrandListProps {
  brands: Brand[];
  isLoading: boolean;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

const BrandList = ({ brands, isLoading, onEdit, onDelete }: BrandListProps) => {
  if (isLoading) {
    return <div className="py-8 text-center">Loading brands...</div>;
  }

  if (brands.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No brands found. Add your first homeopathic brand!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{brand.name}</div>
                  {brand.establishedYear && (
                    <div className="text-xs text-muted-foreground">
                      Est. {brand.establishedYear}
                    </div>
                  )}
                  {brand.description && (
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {brand.description}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant={brand.countryOfOrigin === 'India' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {brand.countryOfOrigin}
                </Badge>
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div className="truncate">{brand.manufacturer}</div>
              </TableCell>
              
              <TableCell>
                {brand.specialties && brand.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {brand.specialties.slice(0, 2).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {brand.specialties.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{brand.specialties.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex flex-col gap-1">
                  {brand.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{brand.email}</span>
                    </div>
                  )}
                  {brand.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{brand.phone}</span>
                    </div>
                  )}
                  {brand.website && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{brand.website}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(brand)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(brand)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BrandList;
