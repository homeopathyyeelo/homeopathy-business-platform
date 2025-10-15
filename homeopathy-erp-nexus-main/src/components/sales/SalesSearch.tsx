
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SalesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SalesSearch = ({ searchTerm, onSearchChange }: SalesSearchProps) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by customer name or invoice number..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-sm"
      />
    </div>
  );
};

export default SalesSearch;
