-- ============================================================================
-- COMPLETE HOMEOPATHY SUBCATEGORIES
-- Comprehensive subcategory structure for all main categories
-- ============================================================================

-- Clean existing subcategories
TRUNCATE TABLE subcategories CASCADE;

-- Insert subcategories with proper category relationships
-- Using category codes to match instead of hardcoded IDs

-- Bach Flower Remedies
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Rescue Remedy', 'BACH-RESCUE', 'Emergency combination for stress and trauma'
FROM categories c WHERE c.code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Single Bach Flower Essences', 'BACH-SINGLE', '38 original Bach flower remedies'
FROM categories c WHERE c.code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Bach Remedies', 'BACH-COMBO', 'Custom Bach flower combinations'
FROM categories c WHERE c.code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Stress & Anxiety Blends', 'BACH-STRESS', 'Blends for stress relief'
FROM categories c WHERE c.code = 'BACH';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Sleep & Relaxation Blends', 'BACH-SLEEP', 'Formulas for better sleep'
FROM categories c WHERE c.code = 'BACH';

-- Biochemic Tablets
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, '12 Single Tissue Remedies', 'BIO-SINGLE', 'Individual tissue salts (Calcarea, Ferrum, etc.)'
FROM categories c WHERE c.code = 'BIO';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Bio Combination Tablets (BC1-BC28)', 'BIO-COMBO', 'Combination tissue salts BC1 to BC28'
FROM categories c WHERE c.code = 'BIO';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Children''s Formulations', 'BIO-CHILD', 'Pediatric biochemic formulations'
FROM categories c WHERE c.code = 'BIO';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'General Health', 'BIO-GENERAL', 'General wellness tissue salts'
FROM categories c WHERE c.code = 'BIO';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Special Conditions', 'BIO-SPECIAL', 'Skin, nerves, joints specific'
FROM categories c WHERE c.code = 'BIO';

-- Cosmetics
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Homeopathic Face Creams', 'COSM-FACE', 'Facial care creams'
FROM categories c WHERE c.code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Anti-Acne Creams', 'COSM-ACNE', 'Acne treatment creams'
FROM categories c WHERE c.code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Fairness Creams', 'COSM-FAIR', 'Skin lightening formulas'
FROM categories c WHERE c.code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Anti-Wrinkle Formulas', 'COSM-WRINKLE', 'Anti-aging formulations'
FROM categories c WHERE c.code = 'COSM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Skin Rejuvenation Gels', 'COSM-REJUV', 'Skin revitalizing gels'
FROM categories c WHERE c.code = 'COSM';

-- Creams & Gels
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Pain Relief Creams', 'CREAM-PAIN', 'Topical pain relief'
FROM categories c WHERE c.code = 'CREAM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Anti-Inflammatory Gels', 'CREAM-INFLAM', 'Anti-inflammatory formulations'
FROM categories c WHERE c.code = 'CREAM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Joint & Muscle Creams', 'CREAM-JOINT', 'Joint and muscle care'
FROM categories c WHERE c.code = 'CREAM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Skin Healing Gels', 'CREAM-HEAL', 'Wound and skin healing'
FROM categories c WHERE c.code = 'CREAM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Burn & Injury Creams', 'CREAM-BURN', 'Burn and injury treatment'
FROM categories c WHERE c.code = 'CREAM';

-- Dilutions
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, '3X-6X Dilutions', 'DIL-LOW', 'Low potency dilutions'
FROM categories c WHERE c.code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, '12X-30X Dilutions', 'DIL-MED', 'Medium potency dilutions'
FROM categories c WHERE c.code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, '200X-1M Dilutions', 'DIL-HIGH', 'High potency dilutions'
FROM categories c WHERE c.code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, '10M-CM Dilutions', 'DIL-VERYHIGH', 'Very high potency dilutions'
FROM categories c WHERE c.code = 'DIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Dilutions', 'DIL-COMBO', 'Combination remedy dilutions'
FROM categories c WHERE c.code = 'DIL';

-- Drops
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Cough Drops', 'DROP-COUGH', 'Cough relief drops'
FROM categories c WHERE c.code = 'DROP';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Digestive Drops', 'DROP-DIGEST', 'Digestive health drops'
FROM categories c WHERE c.code = 'DROP';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Allergy Drops', 'DROP-ALLERGY', 'Allergy relief drops'
FROM categories c WHERE c.code = 'DROP';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Stress Relief Drops', 'DROP-STRESS', 'Stress and anxiety drops'
FROM categories c WHERE c.code = 'DROP';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Liver & Kidney Drops', 'DROP-ORGAN', 'Liver and kidney support'
FROM categories c WHERE c.code = 'DROP';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Drops', 'DROP-COMBO', 'Multi-symptom combination drops'
FROM categories c WHERE c.code = 'DROP';

-- Globules
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Plain Globules (Non-Medicated)', 'GLOB-PLAIN', 'Base sugar globules'
FROM categories c WHERE c.code = 'GLOB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Medicated Globules (Ready-to-Use)', 'GLOB-MED', 'Pre-medicated globules'
FROM categories c WHERE c.code = 'GLOB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Sugar Pellets (Different Sizes)', 'GLOB-PELLET', 'Various size pellets'
FROM categories c WHERE c.code = 'GLOB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Customized Doctor Packs', 'GLOB-DOCTOR', 'Doctor-specific packs'
FROM categories c WHERE c.code = 'GLOB';

-- Hair Care
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Hair Fall Drops', 'HAIR-FALL', 'Hair fall control drops'
FROM categories c WHERE c.code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Hair Oil', 'HAIR-OIL', 'Medicated hair oils'
FROM categories c WHERE c.code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Anti-Dandruff Cream', 'HAIR-DANDRUFF', 'Dandruff treatment'
FROM categories c WHERE c.code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Hair Growth Tonic', 'HAIR-GROWTH', 'Hair growth stimulants'
FROM categories c WHERE c.code = 'HAIR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Scalp Treatment Lotion', 'HAIR-SCALP', 'Scalp care lotions'
FROM categories c WHERE c.code = 'HAIR';

-- LM Potencies
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'LM 1-LM 30', 'LM-LOW', 'Lower LM potencies'
FROM categories c WHERE c.code = 'LM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'LM 31-LM 60', 'LM-MED', 'Medium LM potencies'
FROM categories c WHERE c.code = 'LM';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'LM 61-LM 100', 'LM-HIGH', 'Higher LM potencies'
FROM categories c WHERE c.code = 'LM';

-- Mother Tinctures (Q)
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Single Mother Tinctures', 'MT-SINGLE', 'Individual mother tinctures'
FROM categories c WHERE c.code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Mother Tinctures', 'MT-COMBO', 'Combination mother tinctures'
FROM categories c WHERE c.code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Imported Mother Tinctures', 'MT-IMPORT', 'International brands'
FROM categories c WHERE c.code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Herbal Blends', 'MT-HERBAL', 'Herbal combination blends'
FROM categories c WHERE c.code = 'MT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Raw Extracts', 'MT-RAW', 'Base raw extracts'
FROM categories c WHERE c.code = 'MT';

-- Oils
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Pain Relief Oils', 'OIL-PAIN', 'Pain relief massage oils'
FROM categories c WHERE c.code = 'OIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Hair Oils', 'OIL-HAIR', 'Hair care oils'
FROM categories c WHERE c.code = 'OIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Massage Oils', 'OIL-MASSAGE', 'General massage oils'
FROM categories c WHERE c.code = 'OIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Joint Care Oils', 'OIL-JOINT', 'Joint and arthritis oils'
FROM categories c WHERE c.code = 'OIL';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Skin Nourishing Oils', 'OIL-SKIN', 'Skin care and nourishment'
FROM categories c WHERE c.code = 'OIL';

-- Ointments
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Antiseptic Ointments', 'OINT-ANTISEP', 'Antiseptic wound care'
FROM categories c WHERE c.code = 'OINT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Pain Relief Ointments', 'OINT-PAIN', 'Topical pain relief'
FROM categories c WHERE c.code = 'OINT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Anti-Allergic Ointments', 'OINT-ALLERGY', 'Allergy and rash ointments'
FROM categories c WHERE c.code = 'OINT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Joint & Muscle Ointments', 'OINT-JOINT', 'Joint and muscle care'
FROM categories c WHERE c.code = 'OINT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Skin Care Ointments', 'OINT-SKIN', 'General skin care'
FROM categories c WHERE c.code = 'OINT';

-- Syrups
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Cough Syrups', 'SYR-COUGH', 'Cough relief syrups'
FROM categories c WHERE c.code = 'SYR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Tonic Syrups', 'SYR-TONIC', 'Health tonic syrups'
FROM categories c WHERE c.code = 'SYR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Digestive Syrups', 'SYR-DIGEST', 'Digestive health syrups'
FROM categories c WHERE c.code = 'SYR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Immunity Boosters', 'SYR-IMMUNE', 'Immunity enhancing syrups'
FROM categories c WHERE c.code = 'SYR';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Children''s Syrups', 'SYR-CHILD', 'Pediatric syrup formulations'
FROM categories c WHERE c.code = 'SYR';

-- Tablets
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Tablets', 'TAB-COMBO', 'Multi-remedy combination tablets'
FROM categories c WHERE c.code = 'TAB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Single Remedy Tablets', 'TAB-SINGLE', 'Individual remedy tablets'
FROM categories c WHERE c.code = 'TAB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Vitamin-Enriched Tablets', 'TAB-VITAMIN', 'Vitamin fortified tablets'
FROM categories c WHERE c.code = 'TAB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'General Health Tablets', 'TAB-GENERAL', 'General wellness tablets'
FROM categories c WHERE c.code = 'TAB';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Chronic Condition Tablets', 'TAB-CHRONIC', 'Long-term condition tablets'
FROM categories c WHERE c.code = 'TAB';

-- Trituration
INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Single Remedy Triturations', 'TRIT-SINGLE', 'Individual remedy powders'
FROM categories c WHERE c.code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Combination Triturations', 'TRIT-COMBO', 'Combination powder formulas'
FROM categories c WHERE c.code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Mineral Triturations', 'TRIT-MINERAL', 'Mineral-based triturations'
FROM categories c WHERE c.code = 'TRIT';

INSERT INTO subcategories (category_id, name, code, description) 
SELECT c.id, 'Plant-Based Triturations', 'TRIT-PLANT', 'Herbal triturations'
FROM categories c WHERE c.code = 'TRIT';

-- Show results
SELECT 'Subcategories created successfully' as status;
SELECT c.name as category, COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
