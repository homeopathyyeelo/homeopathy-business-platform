-- Clean Master Data for Fresh Start
-- Keep essential lookup data but remove duplicates

-- Clean categories (keep essential ones)
DELETE FROM categories WHERE name NOT IN (
  'Dilutions', 'Mother Tinctures', 'Biochemic', 'Bio Combination', 
  'Ointments & Creams', 'Patent Medicines', 'Tablets', 'Drops'
);

-- Clean brands (keep common homeopathy brands)
DELETE FROM brands WHERE name NOT IN (
  'SBL', 'Schwabe India', 'Bakson', 'Allen', 'Reckeweg', 'Dr. Willmar Schwabe',
  'Hahnemann', 'Medisynth', 'B Jain', 'Adel', 'Haslab'
);

-- Clean potencies (keep standard ones)
DELETE FROM potencies WHERE code NOT IN (
  '6C', '12C', '30C', '200C', '1M', '10M', 'CM', 'LM', 'Q', 'MT',
  '3X', '6X', '12X', '30X', '200X'
);

-- Clean forms (keep standard ones)
DELETE FROM forms WHERE name NOT IN (
  'Dilution', 'Mother Tincture', 'Tablet', 'Globules', 'Drops', 
  'Ointment', 'Cream', 'Gel', 'Syrup', 'Oil'
);

-- Show what remains
SELECT 'Categories' as table_name, COUNT(*) as remaining_rows FROM categories
UNION ALL
SELECT 'Brands', COUNT(*) FROM brands
UNION ALL
SELECT 'Potencies', COUNT(*) FROM potencies
UNION ALL
SELECT 'Forms', COUNT(*) FROM forms;
