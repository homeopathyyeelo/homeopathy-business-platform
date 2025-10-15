
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

interface SalesTabsHeaderProps {
  onNewRetailSale: () => void;
  onNewWholesaleSale: () => void;
}

const SalesTabsHeader = ({ onNewRetailSale, onNewWholesaleSale }: SalesTabsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <TabsList>
        <TabsTrigger value="retail">Retail Sales</TabsTrigger>
        <TabsTrigger value="wholesale">Wholesale Sales</TabsTrigger>
      </TabsList>

      <div className="flex space-x-2">
        <Button 
          onClick={onNewRetailSale} 
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Retail Sale
        </Button>
        <Button 
          onClick={onNewWholesaleSale} 
          variant="outline" 
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Wholesale Sale
        </Button>
      </div>
    </div>
  );
};

export default SalesTabsHeader;
