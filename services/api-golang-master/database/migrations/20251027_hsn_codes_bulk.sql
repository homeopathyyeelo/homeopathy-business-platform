-- ============================================================================
-- BULK HSN CODES FOR HOMOEOPATHY, OTC, COSMETICS (≈50)
-- Schema: hsn_codes(id uuid, name text, code text UNIQUE, description text, is_active boolean, created_at, updated_at)
-- We upsert by code to avoid duplicates and keep the schema unchanged
-- ============================================================================

-- Helper: upsert function via INSERT ... ON CONFLICT
-- Note: We embed GST rate and notes inside description to avoid schema changes

-- A) Homeopathy Medicaments (≈20)
INSERT INTO hsn_codes (id, name, code, description, is_active)
VALUES
  (gen_random_uuid(), 'Homeopathic retail medicaments', '30049014', 'Retail medicaments for AYU/Unani/Homeo/Siddha/Biochemic (Homeopathy). GST ~5%. Common retail packs; verify per SKU.', true),
  (gen_random_uuid(), 'Medicaments - non retail/bulk', '30039014', 'AYU/Unani/Homeo/Siddha/Biochemic systems not in measured doses/packings (bulk). GST ~5%.', true),
  (gen_random_uuid(), 'Medicaments (general heading)', '3004', 'Mixed or unmixed for therapeutic/prophylactic uses (catch-all). GST ~5% if applicable; prefer specific subheading.', true),
  (gen_random_uuid(), 'Measured doses - tablets/capsules/packings', '30049051', 'Retail medicaments in measured doses (tabs/caps). GST ~5%.', true),
  (gen_random_uuid(), 'Other medicaments - retail forms', '30049052', 'Other retail medicament forms. GST ~5%.', true),
  (gen_random_uuid(), 'Transdermal medicaments - measured doses', '30049053', 'Transdermal patches or similar; measured doses. GST ~5%.', true),
  (gen_random_uuid(), 'Other medicaments - chapter 30 subheading', '30049061', 'Other categories under chapter 30; use more specific when possible. GST ~5%.', true),
  (gen_random_uuid(), 'Other medicaments retail forms (specified)', '30049071', 'Other specified retail medicaments. GST ~5%.', true),
  (gen_random_uuid(), 'Veterinary medicaments', '30031000', 'Veterinary medicines (when applicable). GST ~5%.', true),
  (gen_random_uuid(), 'Other medicaments - bulk NOS', '30039099', 'Bulk/not otherwise specified medicaments. GST ~5%.', true),
  (gen_random_uuid(), 'Other medicaments retail - NOS', '30049099', 'Retail medicaments not elsewhere specified. GST ~5%.', true),
  (gen_random_uuid(), 'Antibiotics in measured doses (example OTC)', '30042010', 'Antibiotics measured doses; special rules. Typically 5%.', true),
  (gen_random_uuid(), 'Sterile surgical sutures/catgut', '30046000', 'Sterile surgical goods. GST ~12%. Rare in pharmacy.', true),
  (gen_random_uuid(), 'Homoeopathic mother tinctures - bulk', '30039011', 'Homeopathic mother tinctures, raw extracts (bulk). GST ~5%.', true),
  (gen_random_uuid(), 'Homoeopathic mother tinctures - retail', '30049011', 'Retail mother tinctures. GST ~5%.', true),
  (gen_random_uuid(), 'Biochemic tablets & combinations - retail', '30049012', 'Biochemic tissue salts (retail). GST ~5%.', true),
  (gen_random_uuid(), 'Homeopathic ointments/creams - retail', '30049013', 'Ointments/creams containing homeopathic medicaments (retail). GST ~5%.', true),
  (gen_random_uuid(), 'Medicaments with hormones/antibiotics', '30044000', 'Use caution; check classification. GST ~5%.', true),
  (gen_random_uuid(), 'Medical wadding/gauze/bandages', '30045000', 'Medical supplies. GST ~12%.', true),
  (gen_random_uuid(), 'Vaccines', '30032000', 'Vaccines via distribution; GST 0/5% special. Verify per product.', true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, is_active=EXCLUDED.is_active, updated_at=now();

-- B) OTC / Pharmacy Retail Items (≈15)
INSERT INTO hsn_codes (id, name, code, description, is_active)
VALUES
  (gen_random_uuid(), 'Other medicaments (syrups & preparations)', '30044090', 'Syrups and certain liquid meds. GST ~5%.', true),
  (gen_random_uuid(), 'Cough syrups & mixtures (retail)', '30049021', 'Common OTC cough syrups. GST ~5%.', true),
  (gen_random_uuid(), 'Antiseptics & disinfectants', '30042019', 'Hygiene antiseptics/disinfectants. GST ~12%/18% depending on type.', true),
  (gen_random_uuid(), 'Medicaments with vitamins (heading 2936)', '30059000', 'Vitamin medicaments. Typically 12%.', true),
  (gen_random_uuid(), 'Sterile surgical goods - small devices', '30045090', 'Gloves, dressings, small devices. GST ~12%.', true),
  (gen_random_uuid(), 'Medical/diagnostic instruments (small)', '9018', 'Instruments & appliances for medical/surgical/dentistry. GST ~12%.', true),
  (gen_random_uuid(), 'Prepared additives/OTC chemicals', '3824', 'Prepared additives/chemicals (e.g., disinfectant preps). GST ~18%.', true),
  (gen_random_uuid(), 'Homeopathy OTC combination packs', '30039021', 'Combination packs for OTC usage. GST ~5%.', true),
  (gen_random_uuid(), 'Vaccines & biologicals (other)', '30032099', 'Other vaccines/biologicals (small vials). GST 0/5%.', true),
  (gen_random_uuid(), 'Pharmaceutical goods; n.e.c.', '30061000', 'Pharmaceutical goods not elsewhere classified. GST ~5%.', true),
  (gen_random_uuid(), 'Antiinfectives (liquid suspensions)', '30058000', 'Antiinfective suspensions. GST ~5%.', true),
  (gen_random_uuid(), 'Blood products & plasma derivates', '30033010', 'If distributor; special products. GST 0/5%.', true),
  (gen_random_uuid(), 'Eye/ear drops - medicament forms (retail)', '30049031', 'Ophthalmic/otic medicament drops (retail). GST ~5%.', true),
  (gen_random_uuid(), 'Bulk eye/ear drops - non-retail', '30039031', 'Bulk ophthalmic/otic drops (non-retail). GST ~5%.', true),
  (gen_random_uuid(), 'Other syrups & mixtures (non-specified)', '30042090', 'Fallback syrup category. GST ~5%.', true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, is_active=EXCLUDED.is_active, updated_at=now();

-- C) Cosmetics & Personal Care (≈15) — Chapter 33 (commonly 18%)
INSERT INTO hsn_codes (id, name, code, description, is_active)
VALUES
  (gen_random_uuid(), 'Beauty/makeup & skin care (non-medicinal)', '3304', 'Preparations for the care of the skin (other than medicaments). GST ~18%.', true),
  (gen_random_uuid(), 'Face creams (cosmetic)', '33049910', 'Moisturisers/face creams non-medicinal. GST ~18%.', true),
  (gen_random_uuid(), 'Nail/Makeup preparations', '33049920', 'Manicure/pedicure products. GST ~18%.', true),
  (gen_random_uuid(), 'Shampoos', '33051000', 'Haircare shampoos. GST ~18%.', true),
  (gen_random_uuid(), 'Hair preparations (other)', '33059000', 'Hair lacquers/other preparations; tonics/oils non-medicinal. GST ~18%.', true),
  (gen_random_uuid(), 'Perfumes & toilet waters', '33030000', 'Fragrances & deo. GST ~18%.', true),
  (gen_random_uuid(), 'Oral/dental hygiene preparations', '3306', 'Toothpastes, mouthwashes. GST ~18%.', true),
  (gen_random_uuid(), 'Other perfumery/cosmetic preparations', '33079000', 'Catch-all cosmetic code. GST ~18%.', true),
  (gen_random_uuid(), 'Make-up for lips & eyes', '33042000', 'Lip/eye cosmetics. GST ~18%.', true),
  (gen_random_uuid(), 'Moisturizing & body lotions', '33049930', 'Body lotions & moisturizers. GST ~18%.', true),
  (gen_random_uuid(), 'Hair dyes/bleaching preparations', '33052000', 'Hair coloration products. GST ~18%.', true),
  (gen_random_uuid(), 'Personal deodorants', '33073000', 'Sprays/roll-ons. GST ~18%.', true),
  (gen_random_uuid(), 'Toilet preparations (bath oils)', '33074100', 'Bath additives/oils. GST ~18%.', true),
  (gen_random_uuid(), 'Other cosmetic chemical preparations', '33079090', 'Misc cosmetics. GST ~18%.', true),
  (gen_random_uuid(), 'Other toiletries & skin care products', '33049990', 'Fallback cosmetic code. GST ~18%.', true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, is_active=EXCLUDED.is_active, updated_at=now();

-- Show count after upsert
SELECT 'HSN codes total' AS label, COUNT(*) AS total FROM hsn_codes;
