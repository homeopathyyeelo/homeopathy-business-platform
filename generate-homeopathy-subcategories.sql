-- Generate Comprehensive Subcategories for Homeopathy Business
-- Based on actual pharmacy/medical shop requirements

-- Clear existing subcategories
TRUNCATE TABLE subcategories CASCADE;

-- ============================================
-- 1. DILUTIONS (Most Important Category)
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Single Remedies', 'DIL-SINGLE', 'Individual homeopathic remedies (Aconite, Arnica, Belladonna, etc.)'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Combination Remedies', 'DIL-COMBO', 'Pre-mixed combinations for specific conditions'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Constitutional Remedies', 'DIL-CONST', 'Deep-acting constitutional medicines'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Acute Remedies', 'DIL-ACUTE', 'Fast-acting remedies for acute conditions'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Chronic Remedies', 'DIL-CHRONIC', 'Long-term treatment remedies'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Nosodes', 'DIL-NOSODE', 'Disease-based potencies (Tuberculinum, Medorrhinum, etc.)'
FROM categories WHERE code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Sarcodes', 'DIL-SARCODE', 'Organ-based remedies (Thyroidinum, Pancreatinum, etc.)'
FROM categories WHERE code = 'DIL';

-- ============================================
-- 2. MOTHER TINCTURES (Q)
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Herbal Tinctures', 'MT-HERB', 'Plant-based mother tinctures'
FROM categories WHERE code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Mineral Tinctures', 'MT-MIN', 'Mineral-based mother tinctures'
FROM categories WHERE code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Animal Tinctures', 'MT-ANIM', 'Animal-based mother tinctures'
FROM categories WHERE code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Digestive Tinctures', 'MT-DIGEST', 'For digestive disorders'
FROM categories WHERE code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Respiratory Tinctures', 'MT-RESP', 'For respiratory conditions'
FROM categories WHERE code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Skin Tinctures', 'MT-SKIN', 'For skin conditions'
FROM categories WHERE code = 'MT';

-- ============================================
-- 3. BIOCHEMIC (Tissue Salts)
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, '12 Tissue Salts', 'BIOC-12TS', 'Original 12 Schuessler tissue salts'
FROM categories WHERE code = 'BIOC';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Single Biochemic', 'BIOC-SINGLE', 'Individual tissue salts (Calc Fluor, Calc Phos, etc.)'
FROM categories WHERE code = 'BIOC';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Biochemic Tablets', 'BIOC-TAB', 'Tablet form tissue salts'
FROM categories WHERE code = 'BIOC';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Biochemic Powder', 'BIOC-POWD', 'Powder form tissue salts'
FROM categories WHERE code = 'BIOC';

-- ============================================
-- 4. BIO COMBINATIONS
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Bio Combination 1-14', 'BIOCOMB-1-14', 'Standard bio combinations BC1 to BC14'
FROM categories WHERE code = 'BIOCOMB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Bio Combination 15-28', 'BIOCOMB-15-28', 'Extended bio combinations BC15 to BC28'
FROM categories WHERE code = 'BIOCOMB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Special Combinations', 'BIOCOMB-SPEC', 'Special formulations for specific conditions'
FROM categories WHERE code = 'BIOCOMB';

-- ============================================
-- 5. TRITURATIONS
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Mineral Triturations', 'TRIT-MIN', 'Ground mineral powders'
FROM categories WHERE code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Metal Triturations', 'TRIT-MET', 'Ground metal powders (Aurum, Argentum, etc.)'
FROM categories WHERE code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Herbal Triturations', 'TRIT-HERB', 'Ground herbal powders'
FROM categories WHERE code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, '3X Triturations', 'TRIT-3X', 'Decimal 3X potency triturations'
FROM categories WHERE code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, '6X Triturations', 'TRIT-6X', 'Decimal 6X potency triturations'
FROM categories WHERE code = 'TRIT';

-- ============================================
-- 6. MEDICINES (General)
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Syrups', 'MED-SYR', 'Homeopathic syrups (cough, tonic, etc.)'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Tablets', 'MED-TAB', 'Homeopathic tablets'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Drops', 'MED-DROP', 'Homeopathic drops'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Ointments', 'MED-OINT', 'External application ointments'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Gels', 'MED-GEL', 'Homeopathic gels'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Oils', 'MED-OIL', 'Homeopathic oils'
FROM categories WHERE code = 'MED';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Sprays', 'MED-SPRAY', 'Homeopathic sprays'
FROM categories WHERE code = 'MED';

-- ============================================
-- 7. BACH FLOWER REMEDIES
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Original 38 Remedies', 'BACH-38', 'Original Bach flower remedies'
FROM categories WHERE code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Rescue Remedy', 'BACH-RESCUE', 'Emergency combination remedy'
FROM categories WHERE code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Mood Remedies', 'BACH-MOOD', 'For emotional balance'
FROM categories WHERE code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Stress Remedies', 'BACH-STRESS', 'For stress and anxiety'
FROM categories WHERE code = 'BACH';

-- ============================================
-- 8. HOMEOPATHY KITS
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Family Kits', 'KIT-FAM', 'Complete family medicine kits'
FROM categories WHERE code = 'KIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Travel Kits', 'KIT-TRAV', 'Portable travel kits'
FROM categories WHERE code = 'KIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'First Aid Kits', 'KIT-AID', 'Emergency first aid kits'
FROM categories WHERE code = 'KIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Doctor Kits', 'KIT-DOC', 'Professional practitioner kits'
FROM categories WHERE code = 'KIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Specialty Kits', 'KIT-SPEC', 'Condition-specific kits (diabetes, arthritis, etc.)'
FROM categories WHERE code = 'KIT';

-- ============================================
-- 9. LM POTENCIES (Millesimal)
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'LM 0/1 to 0/6', 'LM-1-6', 'Lower LM potencies'
FROM categories WHERE code = 'LM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'LM 0/7 to 0/15', 'LM-7-15', 'Medium LM potencies'
FROM categories WHERE code = 'LM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'LM 0/16 to 0/30', 'LM-16-30', 'Higher LM potencies'
FROM categories WHERE code = 'LM';

-- ============================================
-- 10. COSMETICS
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Face Care', 'COSM-FACE', 'Face creams, lotions, cleansers'
FROM categories WHERE code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Body Care', 'COSM-BODY', 'Body lotions, oils, massage oils'
FROM categories WHERE code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Anti-Aging', 'COSM-ANTI', 'Anti-aging creams and serums'
FROM categories WHERE code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Acne Care', 'COSM-ACNE', 'Acne treatment products'
FROM categories WHERE code = 'COSM';

-- ============================================
-- 11. HAIR CARE
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Hair Oils', 'HAIR-OIL', 'Homeopathic hair oils'
FROM categories WHERE code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Shampoos', 'HAIR-SHAM', 'Homeopathic shampoos'
FROM categories WHERE code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Hair Loss Treatment', 'HAIR-LOSS', 'Anti-hair fall products'
FROM categories WHERE code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Conditioners', 'HAIR-COND', 'Hair conditioners'
FROM categories WHERE code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Hair Tonics', 'HAIR-TON', 'Hair growth tonics'
FROM categories WHERE code = 'HAIR';

-- ============================================
-- 12. SKIN CARE
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Skin Creams', 'SKIN-CREAM', 'Moisturizing and healing creams'
FROM categories WHERE code = 'SKIN';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Skin Ointments', 'SKIN-OINT', 'Medicated skin ointments'
FROM categories WHERE code = 'SKIN';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Eczema Care', 'SKIN-ECZ', 'Eczema treatment products'
FROM categories WHERE code = 'SKIN';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Psoriasis Care', 'SKIN-PSO', 'Psoriasis treatment products'
FROM categories WHERE code = 'SKIN';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Wound Care', 'SKIN-WOUND', 'Wound healing products'
FROM categories WHERE code = 'SKIN';

-- ============================================
-- 13. ORAL CARE
-- ============================================
INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Toothpastes', 'ORAL-PASTE', 'Homeopathic toothpastes'
FROM categories WHERE code = 'ORAL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Mouthwash', 'ORAL-WASH', 'Homeopathic mouthwash'
FROM categories WHERE code = 'ORAL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Tooth Powders', 'ORAL-POWD', 'Tooth cleaning powders'
FROM categories WHERE code = 'ORAL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT id, 'Gum Care', 'ORAL-GUM', 'Gum health products'
FROM categories WHERE code = 'ORAL';

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    c.name as category,
    COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
GROUP BY c.name
ORDER BY c.name;

SELECT '✅ Generated ' || COUNT(*) || ' subcategories for homeopathy business!' as status
FROM subcategories;

-- Show sample subcategories
SELECT 
    c.name as category,
    s.name as subcategory,
    s.code,
    s.description
FROM subcategories s
JOIN categories c ON s.category_id = c.id
ORDER BY c.name, s.name
LIMIT 20;
