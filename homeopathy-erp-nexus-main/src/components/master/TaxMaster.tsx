
import { TaxProvider } from "./tax/TaxContext";
import { TaxHeader } from "./tax/TaxHeader";
import { TaxList } from "./tax/TaxList";
import { TaxForm } from "./tax/TaxForm";
import { DeleteTaxDialog } from "./tax/DeleteTaxDialog";
import { TaxContent } from "./tax/TaxContent";

const TaxMaster = () => {
  return (
    <div className="p-6 space-y-6">
      <TaxProvider>
        <TaxContent />
      </TaxProvider>
    </div>
  );
};

export default TaxMaster;
