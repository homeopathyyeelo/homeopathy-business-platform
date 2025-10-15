
// Brand-related types for homeopathy ERP

export interface Brand {
  id: string;
  name: string;
  description?: string;
  manufacturer?: string; // Will be same as name for homeopathy
  countryOfOrigin?: string;
  specialties?: string[]; // e.g., ["Combination remedies", "Classical remedies"]
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  establishedYear?: number;
  contactInfo?: string; // Simplified as string to avoid conflicts
  isActive?: boolean; // Alias for active
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Common Indian homeopathy brands
export const INDIAN_HOMEOPATHY_BRANDS = [
  'SBL Pvt Ltd',
  'Dr. Willmar Schwabe India Pvt. Ltd.',
  'Bakson Drugs & Pharmaceuticals Pvt. Ltd.',
  'Bjain Pharmaceuticals Pvt. Ltd.',
  'Wheezal Homoeo Pharma',
  'Haslab (Hasanuddin Laboratory)',
  'Lords Homoeopathic Laboratory',
  'Adel Pekana Germany',
  'Allen Laboratory',
  'Similia Homoeo Laboratory'
];

// International homeopathy brands
export const INTERNATIONAL_HOMEOPATHY_BRANDS = [
  'Dr. Reckeweg & Co. GmbH',
  'Heel GmbH',
  'Weleda AG',
  'Boiron',
  'Hyland\'s Homeopathic',
  'Standard Homeopathic Company',
  'Biologische Heilmittel Heel GmbH'
];

export const getBrandSpecialties = (brandName: string): string[] => {
  const specialtyMap: Record<string, string[]> = {
    'Dr. Reckeweg & Co. GmbH': ['Combination remedies', 'German preparations', 'Bio-combinations'],
    'SBL Pvt Ltd': ['Classical remedies', 'Mother tinctures', 'Dilutions'],
    'Dr. Willmar Schwabe India Pvt. Ltd.': ['Classical remedies', 'Patent medicines', 'German preparations'],
    'Bakson Drugs & Pharmaceuticals Pvt. Ltd.': ['Combination remedies', 'Patent medicines', 'Homeopathic drops'],
    'Bjain Pharmaceuticals Pvt. Ltd.': ['Dilutions', 'Mother tinctures', 'Bio-combinations'],
    'Wheezal Homoeo Pharma': ['Specialized remedies', 'Combination medicines'],
    'Boiron': ['Classical remedies', 'Single remedies', 'French preparations'],
    'Heel GmbH': ['Biological medicines', 'Complex remedies', 'Injectable preparations']
  };
  
  return specialtyMap[brandName] || ['Homeopathic medicines'];
};

// Utility function to get Indian brands
export const getIndianHomeopathicBrands = () => INDIAN_HOMEOPATHY_BRANDS;
