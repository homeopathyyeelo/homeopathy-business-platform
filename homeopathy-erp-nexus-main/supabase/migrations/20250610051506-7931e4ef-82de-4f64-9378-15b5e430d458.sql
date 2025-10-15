
-- First, create unique constraint on brands name if it doesn't exist
ALTER TABLE brands ADD CONSTRAINT brands_name_unique UNIQUE (name);

-- Insert Dr. Reckeweg brand with proper conflict handling
INSERT INTO brands (id, name, description, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Dr. Reckeweg & Co. GmbH', 
  'German homeopathic company with combination remedies',
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- Get the brand ID for Dr. Reckeweg to use in updates
DO $$
DECLARE
    reckeweg_brand_id UUID;
BEGIN
    SELECT id INTO reckeweg_brand_id FROM brands WHERE name = 'Dr. Reckeweg & Co. GmbH';
    
    -- Update all existing products to use Dr. Reckeweg brand if they don't have a brand assigned
    UPDATE products 
    SET brand_id = reckeweg_brand_id, updated_at = NOW()
    WHERE brand_id IS NULL;
END $$;

-- Add missing columns to products table for homeopathy classification
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS potency VARCHAR(20),
ADD COLUMN IF NOT EXISTS form VARCHAR(50),
ADD COLUMN IF NOT EXISTS full_medicine_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 12,
ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT true;

-- Update categories table to include HSN codes and GST rates
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 12;

-- Create unique constraint on categories name if it doesn't exist
ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);

-- Insert homeopathy category master data with proper UUIDs
INSERT INTO categories (id, name, description, hsn_code, gst_percentage, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'Dilution', 'Homeopathic dilutions', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Mother Tincture (MT)', 'Mother tinctures', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Biochemic', 'Biochemic medicines', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Bio-Combination (Bio-Com)', 'Bio-combination medicines', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Trituration Tablets', 'Trituration tablets', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Patent Drop', 'Patent drops', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Patent Tablets', 'Patent tablets', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Cosmetic (Non-Medicated)', 'Cosmetic products', '3304', 18, true, NOW(), NOW()),
(gen_random_uuid(), 'Syrups & Tonics', 'Syrups and tonics', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Ointments & Creams', 'Ointments and creams', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Globules (Plain)', 'Plain globules', '3004', 12, true, NOW(), NOW()),
(gen_random_uuid(), 'Accessories', 'Pharmacy accessories', '7010', 18, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  hsn_code = EXCLUDED.hsn_code,
  gst_percentage = EXCLUDED.gst_percentage,
  updated_at = NOW();

-- Update existing products to have required classification fields if missing
UPDATE products 
SET 
  potency = COALESCE(potency, '30C'),
  form = COALESCE(form, 'globules'),
  gst_percentage = 12,
  batch_tracking = true,
  updated_at = NOW()
WHERE potency IS NULL OR form IS NULL;
