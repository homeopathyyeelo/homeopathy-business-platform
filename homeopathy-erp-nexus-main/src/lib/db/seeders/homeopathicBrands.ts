
import { INDIAN_HOMEOPATHY_BRANDS } from '@/types/brand';
import { coreDb } from '../database/core';

export const seedHomeopathicBrands = async (): Promise<void> => {
  console.log('Seeding Indian Homeopathic Brands...');
  
  try {
    const existingBrands = await coreDb.getAll('brands');
    
    // Only seed if no brands exist
    if (existingBrands.length === 0) {
      const brandsToSeed = INDIAN_HOMEOPATHY_BRANDS.map((brandName, index) => ({
        name: brandName,
        description: `Leading homeopathic brand - ${brandName}`,
        manufacturer: brandName,
        countryOfOrigin: 'India',
        active: true
      }));
      
      for (const brandData of brandsToSeed) {
        const newBrand = {
          id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...brandData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await coreDb.create('brands', newBrand);
        console.log(`✅ Created brand: ${newBrand.name}`);
      }
      
      console.log(`🎉 Successfully seeded ${brandsToSeed.length} homeopathic brands`);
    } else {
      console.log('🔍 Brands already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding homeopathic brands:', error);
    throw error;
  }
};

// Auto-seed when this module is imported
seedHomeopathicBrands().catch(console.error);
