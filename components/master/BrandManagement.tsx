
import { BrandProvider } from './brand/BrandContext';
import BrandMaster from './BrandMaster';

const BrandManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <BrandProvider>
        <BrandMaster />
      </BrandProvider>
    </div>
  );
};

export default BrandManagement;
