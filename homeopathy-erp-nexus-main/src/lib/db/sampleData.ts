
import { Category, Customer, Supplier, Product, Brand, Unit } from '@/types';
import { parsePotency, MedicineForm } from '@/types/product';

// Homeopathic Categories
export const sampleCategories: Category[] = [
  {
    id: 'cat_dilutions',
    name: 'Dilutions',
    description: 'Homeopathic dilutions in various potencies',
    gstPercentage: 12,
    hsnCode: '3003',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat_mother_tinctures',
    name: 'Mother Tinctures',
    description: 'Original herbal extracts',
    gstPercentage: 12,
    hsnCode: '3003',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat_biochemics',
    name: 'Bio-chemic Salts',
    description: 'Schuessler tissue salts',
    gstPercentage: 12,
    hsnCode: '3004',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cat_combinations',
    name: 'Combination Remedies',
    description: 'Complex homeopathic formulations',
    gstPercentage: 12,
    hsnCode: '3004',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Enhanced Homeopathic Brands
export const sampleBrands: Brand[] = [
  {
    id: 'brand_sbl',
    name: 'SBL',
    manufacturer: 'SBL Pvt. Ltd.',
    description: 'One of India\'s leading homeopathic companies',
    countryOfOrigin: 'India',
    establishedYear: 1982,
    specialties: ['Dilutions', 'Mother Tinctures', 'Biochemics', 'Specialties'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_schwabe',
    name: 'Schwabe',
    manufacturer: 'Dr. Willmar Schwabe India Pvt. Ltd.',
    description: 'German quality homeopathic medicines in India',
    countryOfOrigin: 'Germany',
    specialties: ['Dilutions', 'Mother Tinctures', 'Complexes'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_reckeweg',
    name: 'Reckeweg',
    manufacturer: 'Dr. Reckeweg & Co. GmbH',
    description: 'German homeopathic company with combination remedies',
    countryOfOrigin: 'Germany',
    specialties: ['Combinations', 'Dilutions', 'Mother Tinctures'],
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Homeopathic Sample Products
export const sampleProducts: Product[] = [
  {
    id: 'prod_arnica_30c_glob_sbl',
    productCode: 'ARN_30C_GLO_SBL',
    name: 'Arnica Montana',
    potency: parsePotency('30C'),
    form: 'globules' as MedicineForm,
    brandId: 'brand_sbl',
    fullMedicineName: 'Arnica Montana 30C Globules (SBL)',
    sku: 'ARN_30C_GLO_SBL',
    categoryId: 'cat_dilutions',
    manufacturer: 'SBL Pvt. Ltd.',
    hsnCode: '30039099',
    gstPercentage: 12,
    reorderLevel: 10,
    defaultSellingPriceRetail: 85,
    batchTracking: true,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'prod_arnica_200c_liq_sbl',
    productCode: 'ARN_200C_LIQ_SBL',
    name: 'Arnica Montana',
    potency: parsePotency('200C'),
    form: 'drops' as MedicineForm,
    brandId: 'brand_sbl',
    fullMedicineName: 'Arnica Montana 200C Drops (SBL)',
    sku: 'ARN_200C_LIQ_SBL',
    categoryId: 'cat_dilutions',
    manufacturer: 'SBL Pvt. Ltd.',
    hsnCode: '30039099',
    gstPercentage: 12,
    reorderLevel: 5,
    defaultSellingPriceRetail: 110,
    batchTracking: true,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Sample customers focused on homeopathic pharmacy
export const sampleCustomers: Customer[] = [
  {
    id: 'cust_dr_sharma',
    customerId: 'CUST001',
    firstName: 'Dr. Rajesh',
    lastName: 'Sharma',
    name: 'Dr. Rajesh Sharma',
    email: 'dr.sharma@clinic.com',
    phone: '+91-9876543210',
    address: 'Medical Center, MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    type: 'wholesale',
    creditLimit: 50000,
    openingBalance: 0,
    outstandingBalance: 0,
    balanceType: 'credit',
    priceLevel: 'A',
    isActive: true,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cust_mrs_patel',
    customerId: 'CUST002',
    firstName: 'Mrs. Priya',
    lastName: 'Patel',
    name: 'Mrs. Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91-9123456789',
    address: 'Flat 202, Sunrise Apartments',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    type: 'retail',
    creditLimit: 10000,
    openingBalance: 0,
    outstandingBalance: 0,
    balanceType: 'credit',
    priceLevel: 'B',
    isActive: true,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Homeopathic medicine suppliers
export const sampleSuppliers: Supplier[] = [
  {
    id: 'supp_sbl',
    supplierId: 'SUPP001',
    companyName: 'SBL Pvt. Ltd.',
    contactPerson: 'Mr. Raj Kumar',
    email: 'orders@sbl.co.in',
    phone: '+91-11-26692828',
    address: 'A-36, Sector-7, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    gstNumber: '09AABCS1681C1ZY',
    openingBalance: 0,
    balanceType: 'credit',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'supp_schwabe',
    supplierId: 'SUPP002',
    companyName: 'Dr. Willmar Schwabe India Pvt. Ltd.',
    contactPerson: 'Ms. Anita Singh',
    email: 'info@schwabeindia.com',
    phone: '+91-22-66806666',
    address: 'Unit 1, Corporate Park, Sion',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400022',
    gstNumber: '27AABCS1681C2ZX',
    openingBalance: 0,
    balanceType: 'credit',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Units for homeopathic medicines
export const sampleUnits: Unit[] = [
  {
    id: 'unit_ml',
    name: 'Milliliter',
    shortName: 'ml',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_gm',
    name: 'Gram',
    shortName: 'gm',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_bottle',
    name: 'Bottle',
    shortName: 'btl',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
