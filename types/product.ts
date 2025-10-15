// Product-related types for homeopathy ERP

export interface Potency {
  scale: 'decimal' | 'centesimal' | 'lm' | 'mother-tincture';
  value: number | string;
  fullNotation: string; // e.g., "30C", "200C", "1M", "LM6", "MT"
}

export type MedicineForm = 
  | 'globules' 
  | 'tablets' 
  | 'drops' 
  | 'dilution' 
  | 'mother-tincture'
  | 'trituration'
  | 'ointment'
  | 'cream'
  | 'syrup'
  | 'injection'
  | 'powder';

export interface PackSize {
  id: string;
  name: string; // e.g., "30ML", "100ML", "25GM"
  description?: string;
  active: boolean;
}

export interface Product {
  id: string;
  productCode: string;
  name: string; // Base medicine name (e.g., "Arnica Montana")
  description?: string;
  
  // Homeopathy Classification - REQUIRED FIELDS
  potency: Potency; // REQUIRED
  form: MedicineForm; // REQUIRED
  fullMedicineName: string; // Auto-generated: "Arnica Montana 30C Globules"
  
  // Brand & Category - REQUIRED FIELDS
  brandId: string; // REQUIRED
  brand?: Brand; // Brand object for display (computed from brandId)
  categoryId: string; // REQUIRED
  category?: Category; // Category object for display (computed from categoryId)
  
  // Product Details
  manufacturer?: string; // Will be same as brand name
  packSize?: PackSize;
  sku?: string; // Auto-generated
  barcode?: string;
  
  // Tax & Pricing - REQUIRED FIELDS
  hsnCode: string; // REQUIRED - Auto-filled from category
  gstPercentage: number; // REQUIRED - Auto-filled from category
  
  // Pricing
  purchasePrice?: number;
  defaultSellingPriceRetail?: number;
  defaultSellingPriceWholesale?: number;
  
  // Inventory Management
  reorderLevel?: number;
  maxStockLevel?: number;
  minStockLevel?: number;
  defaultRackLocation?: string;
  
  // Batch Tracking - REQUIRED for medicines
  batchTracking: boolean; // REQUIRED - Default true for medicines
  expiryTracking?: boolean;
  
  // Status
  active: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Import Brand and Category types to avoid circular dependencies
interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  gstPercentage?: number;
}

// Utility functions for potency handling
export const parsePotency = (potencyString: string): Potency => {
  const cleaned = potencyString.trim().toUpperCase();
  
  // Mother Tincture
  if (cleaned === 'MT' || cleaned === 'MOTHER TINCTURE') {
    return {
      scale: 'mother-tincture',
      value: 'MT',
      fullNotation: 'MT'
    };
  }
  
  // LM potencies
  if (cleaned.startsWith('LM') || cleaned.startsWith('0/')) {
    const value = cleaned.replace(/^(LM|0\/)/, '');
    return {
      scale: 'lm',
      value: parseInt(value) || 1,
      fullNotation: `LM${value}`
    };
  }
  
  // Decimal scale (X potencies)
  if (cleaned.includes('X')) {
    const value = parseInt(cleaned.replace('X', ''));
    return {
      scale: 'decimal',
      value: value,
      fullNotation: `${value}X`
    };
  }
  
  // Centesimal scale (C potencies and M potencies)
  if (cleaned.includes('C') || cleaned.includes('M')) {
    let value: number | string;
    let notation: string;
    
    if (cleaned.includes('M')) {
      // Handle M potencies (1M, 10M, 50M, CM, etc.)
      const mValue = cleaned.replace('M', '');
      if (mValue === '' || mValue === '1') {
        value = 1000;
        notation = '1M';
      } else if (mValue === 'C') {
        value = 100000;
        notation = 'CM';
      } else {
        value = parseInt(mValue) * 1000;
        notation = `${mValue}M`;
      }
    } else {
      // Handle C potencies
      value = parseInt(cleaned.replace('C', ''));
      notation = `${value}C`;
    }
    
    return {
      scale: 'centesimal',
      value: value,
      fullNotation: notation
    };
  }
  
  // Default to 30C if parsing fails
  return {
    scale: 'centesimal',
    value: 30,
    fullNotation: '30C'
  };
};

// Generate full medicine name
export const generateFullMedicineName = (
  name: string, 
  potency: Potency, 
  form: MedicineForm,
  brandName?: string
): string => {
  const formattedForm = form.charAt(0).toUpperCase() + form.slice(1);
  let fullName = `${name} ${potency.fullNotation} ${formattedForm}`;
  
  // Add brand prefix for certain brands
  if (brandName && brandName.includes('Dr. Reckeweg')) {
    const productNumber = Math.floor(Math.random() * 999) + 1; // Simulate R-series
    fullName = `R${productNumber} - ${fullName}`;
  }
  
  return fullName;
};

// Generate SKU
export const generateProductSKU = (
  name: string,
  potency: Potency,
  form: MedicineForm,
  brandName?: string
): string => {
  const nameCode = name.split(' ').map(word => word.substring(0, 2).toUpperCase()).join('');
  const potencyCode = potency.fullNotation.replace(/[^A-Z0-9]/g, '');
  const formCode = form.substring(0, 3).toUpperCase();
  const brandCode = brandName ? brandName.substring(0, 3).toUpperCase() : 'GEN';
  
  return `${brandCode}-${nameCode}-${potencyCode}-${formCode}`;
};

// Get common potencies for dropdown
export const getCommonPotencies = (): string[] => {
  return [
    // Decimal Scale
    '3X', '6X', '12X', '30X',
    
    // Centesimal Scale - Low
    '3C', '6C', '12C', '30C',
    
    // Centesimal Scale - Medium
    '200C', '1M',
    
    // Centesimal Scale - High
    '10M', '50M', 'CM',
    
    // LM Potencies
    'LM1', 'LM2', 'LM3', 'LM6', 'LM12', 'LM18', 'LM24', 'LM30',
    
    // Mother Tincture
    'MT'
  ];
};

// Get medicine form options
export const getMedicineFormOptions = () => {
  return [
    { value: 'globules', label: 'Globules' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'drops', label: 'Drops' },
    { value: 'dilution', label: 'Dilution' },
    { value: 'mother-tincture', label: 'Mother Tincture' },
    { value: 'trituration', label: 'Trituration' },
    { value: 'ointment', label: 'Ointment' },
    { value: 'cream', label: 'Cream' },
    { value: 'syrup', label: 'Syrup' },
    { value: 'injection', label: 'Injection' },
    { value: 'powder', label: 'Powder' }
  ];
};

// Validation helpers
export const validateProductClassification = (product: Partial<Product>): string[] => {
  const errors: string[] = [];
  
  if (!product.name?.trim()) {
    errors.push('Medicine name is required');
  }
  
  if (!product.potency?.fullNotation) {
    errors.push('Potency is required');
  }
  
  if (!product.form) {
    errors.push('Medicine form is required');
  }
  
  if (!product.brandId) {
    errors.push('Brand selection is required');
  }
  
  if (!product.categoryId) {
    errors.push('Category selection is required');
  }
  
  if (!product.hsnCode?.trim()) {
    errors.push('HSN Code is required');
  }
  
  if (!product.gstPercentage || product.gstPercentage <= 0) {
    errors.push('Valid GST percentage is required');
  }
  
  return errors;
};
