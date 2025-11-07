-- Yeelo Homeopathy Platform - Seed Data
-- This script populates the database with initial data for development and testing

-- Insert admin user
INSERT INTO users (full_name, phone, email, password_hash, role) VALUES
('Amit Ghosh', '9876543310', 'amit@yeelo.in', '$2b$10$example_hash_here', 'admin'),
('Priya Sharma', '9876543311', 'priya@yeelo.in', '$2b$10$example_hash_here', 'staff'),
('Rajesh Kumar', '9876543312', 'rajesh@yeelo.in', '$2b$10$example_hash_here', 'marketer');

-- Insert main shop
INSERT INTO shops (name, address, geo_lat, geo_lng, phone, gmb_place_id) VALUES
('Yeelo Homeopathy - Sohna Road', 'Shop No. 15, Sohna Road, Sector 47, Gurgaon, Haryana 122018', 28.4115, 77.0472, '9812345678', 'ChIJexample123'),
('Yeelo Homeopathy - Badshahpur', 'Main Market, Badshahpur, Gurgaon, Haryana 122001', 28.4200, 77.0600, '9812345679', 'ChIJexample124');

-- Insert homeopathy products with proper categorization
INSERT INTO products (sku, name, description, brand, category, potency, unit_price, mrp, images, tags, indications) VALUES
-- Mother Tinctures
('YEL-MT-001', 'Berberis Aquifolium Q', 'Mother tincture for skin disorders and liver complaints', 'SBL', 'Mother Tincture', 'Q', 450.00, 500.00, ARRAY['/images/berberis-q.jpg'], ARRAY['skin', 'liver', 'popular'], 'Skin eruptions, eczema, psoriasis, liver disorders'),
('YEL-MT-002', 'Calendula Officinalis Q', 'Healing and antiseptic mother tincture', 'Dr. Reckeweg', 'Mother Tincture', 'Q', 380.00, 420.00, ARRAY['/images/calendula-q.jpg'], ARRAY['healing', 'antiseptic', 'wounds'], 'Cuts, wounds, burns, skin healing'),
('YEL-MT-003', 'Arnica Montana Q', 'For trauma, bruises and muscle pain', 'Schwabe', 'Mother Tincture', 'Q', 420.00, 460.00, ARRAY['/images/arnica-q.jpg'], ARRAY['trauma', 'bruises', 'pain'], 'Bruises, trauma, muscle pain, sprains'),

-- Dilutions
('YEL-DL-001', 'Sulphur 30C', 'Constitutional remedy for skin and digestive issues', 'SBL', 'Dilution', '30C', 120.00, 140.00, ARRAY['/images/sulphur-30c.jpg'], ARRAY['constitutional', 'skin', 'digestion'], 'Chronic skin conditions, digestive disorders'),
('YEL-DL-002', 'Pulsatilla 30C', 'For changeable symptoms and hormonal issues', 'Dr. Reckeweg', 'Dilution', '30C', 125.00, 145.00, ARRAY['/images/pulsatilla-30c.jpg'], ARRAY['hormonal', 'changeable', 'women'], 'Menstrual disorders, mood swings, respiratory issues'),
('YEL-DL-003', 'Nux Vomica 30C', 'For digestive complaints and lifestyle disorders', 'Schwabe', 'Dilution', '30C', 130.00, 150.00, ARRAY['/images/nux-vomica-30c.jpg'], ARRAY['digestion', 'lifestyle', 'stress'], 'Indigestion, constipation, stress-related disorders'),

-- Biochemic Tablets
('YEL-BC-001', 'Calcarea Phosphorica 6X', 'For bone and teeth development', 'Schwabe', 'Biochemic', '6X', 95.00, 110.00, ARRAY['/images/calc-phos-6x.jpg'], ARRAY['bones', 'teeth', 'children'], 'Bone development, teething troubles, growth issues'),
('YEL-BC-002', 'Ferrum Phosphoricum 6X', 'For fever and inflammation', 'SBL', 'Biochemic', '6X', 90.00, 105.00, ARRAY['/images/ferrum-phos-6x.jpg'], ARRAY['fever', 'inflammation', 'immunity'], 'Early stages of fever, inflammation, anemia'),
('YEL-BC-003', 'Kali Phosphoricum 6X', 'For nervous exhaustion and mental fatigue', 'Dr. Reckeweg', 'Biochemic', '6X', 100.00, 115.00, ARRAY['/images/kali-phos-6x.jpg'], ARRAY['nervous', 'mental', 'fatigue'], 'Mental exhaustion, nervous debility, insomnia'),

-- Combination Remedies
('YEL-CB-001', 'Cold & Cough Syrup', 'Homeopathic syrup for cold and cough', 'Yeelo', 'Combination', 'Mixed', 180.00, 200.00, ARRAY['/images/cold-cough-syrup.jpg'], ARRAY['cold', 'cough', 'respiratory'], 'Common cold, cough, respiratory congestion'),
('YEL-CB-002', 'Digestive Drops', 'For indigestion and acidity', 'Yeelo', 'Combination', 'Mixed', 160.00, 180.00, ARRAY['/images/digestive-drops.jpg'], ARRAY['digestion', 'acidity', 'stomach'], 'Indigestion, acidity, stomach discomfort');

-- Insert inventory for main shop
INSERT INTO inventory (product_id, shop_id, stock_qty, reorder_point) VALUES
(1, 1, 25, 5), (2, 1, 30, 5), (3, 1, 20, 5),
(4, 1, 50, 10), (5, 1, 45, 10), (6, 1, 40, 10),
(7, 1, 60, 15), (8, 1, 55, 15), (9, 1, 50, 15),
(10, 1, 35, 8), (11, 1, 40, 8);

-- Insert sample customers
INSERT INTO customers (name, phone, email, addresses, tags, consent_marketing, consent_whatsapp, preferred_language) VALUES
('Suresh Kumar', '9812345111', 'suresh@example.com', 
 '[{"label": "Home", "line1": "House No. 123", "line2": "Sector 5", "city": "Gurgaon", "state": "Haryana", "pincode": "122001"}]', 
 ARRAY['regular', 'skin-issues'], true, true, 'hinglish'),
('Meera Patel', '9812345112', 'meera@example.com',
 '[{"label": "Home", "line1": "Flat 4B", "line2": "DLF Phase 2", "city": "Gurgaon", "state": "Haryana", "pincode": "122002"}]',
 ARRAY['new', 'digestive-issues'], true, false, 'en'),
('Ramesh Singh', '9812345113', null,
 '[{"label": "Home", "line1": "Village Badshahpur", "city": "Gurgaon", "state": "Haryana", "pincode": "122001"}]',
 ARRAY['village', 'elderly'], false, true, 'hi');

-- Insert local areas for targeting
INSERT INTO local_areas (name, type, geo_center_lat, geo_center_lng, radius_km, population_estimate, notes) VALUES
('Sohna Road', 'area', 28.4115, 77.0472, 5.0, 50000, 'Main shop location and surrounding area'),
('Badshahpur Village', 'village', 28.4200, 77.0600, 3.0, 12000, 'Traditional village with good homeopathy acceptance'),
('Sector 47 Gurgaon', 'sector', 28.4100, 77.0450, 2.0, 25000, 'Urban residential sector'),
('DLF Phase 1-4', 'area', 28.4700, 77.1000, 4.0, 80000, 'Premium residential area'),
('Old Gurgaon', 'area', 28.4600, 77.0300, 6.0, 100000, 'Traditional Gurgaon area');

-- Link customers to areas
INSERT INTO customer_areas (customer_id, area_id, is_primary) VALUES
(1, 3, true), (2, 4, true), (3, 2, true);

-- Insert AI prompts for content generation
INSERT INTO ai_prompts (name, category, prompt_template, language, use_case, created_by) VALUES
-- Instagram prompts
('Instagram Daily Post - English', 'instagram', 'You are Yeelo Homeopathy''s friendly copywriter. Write a short Instagram caption (<=150 chars) for product {{product_name}} highlighting {{benefit}} and include a local call-to-action: "Visit our shop on Sohna Road, Gurgaon". Include one emoji and 3 hashtags.', 'en', 'daily_post', 1),
('Instagram Product Promo - Hinglish', 'instagram', 'Create a warm Hinglish Instagram caption (<=140 chars) promoting {{product_name}} for {{use_case}}. Use one emoji and end with "Call 9812345678" and hashtags #Gurgaon #SohnaRoad.', 'hinglish', 'product_promo', 1),

-- WhatsApp prompts
('WhatsApp Broadcast Offer', 'whatsapp', 'Write a concise WhatsApp message (<=300 chars) announcing a {{discount_percent}}% discount with code {{coupon_code}} valid until {{expires_at}} for customers within {{radius_km}} km. Use friendly tone and "Reply ORDER" CTA.', 'en', 'broadcast_offer', 1),
('WhatsApp Order Confirmation', 'whatsapp', 'Write an order confirmation template. Variables: {{customer_name}}, {{order_id}}, {{items_list}}, {{total}}, {{pickup_time}}. Keep friendly, confirm pickup options and payment methods.', 'en', 'order_confirmation', 1),

-- SMS prompts
('SMS Short Offer', 'sms', 'Produce an SMS (<=160 chars) for Yeelo: "{{discount_percent}}% off on {{product_category}} at Yeelo Homeopathy. Use {{coupon_code}}. Visit Sohna Road. Call 9812345678". Make it crisp and urgent.', 'en', 'short_offer', 1),

-- GMB prompts
('GMB Whats New Post', 'gmb', 'Write a Google Business Profile "What''s new" post (max 300 chars) announcing {{announcement}} with a line about {{featured_product}} and a CTA "Visit our shop — Sohna Road, Gurgaon".', 'en', 'whats_new', 1),

-- Customer reply prompts
('Customer Support Reply', 'reply', 'You are Yeelo Homeopathy''s support assistant. Customer message: "{{message}}". The store is in Gurgaon, opens 9am-7pm. Provide a concise answer (max 3 sentences) that is accurate and includes "Call 9812345678" if they request more details. If medical advice is requested, respond: "Please consult a qualified practitioner; we can book an appointment."', 'en', 'customer_support', 1),

-- Village outreach prompts
('Village Outreach Hindi', 'outreach', 'Write a 2-line Hindi message inviting nearby village residents for a free consultation camp at Yeelo (date {{date}}). Mention location "Sohna Road" and "free consult" and short CTA "Aaiye aur fayda uthaaiye".', 'hi', 'village_outreach', 1);

-- Insert sample templates
INSERT INTO templates (name, channel, language, content, variables, created_by) VALUES
('Welcome New Customer', 'whatsapp', 'en', 
 'Welcome to Yeelo Homeopathy, {{customer_name}}! 🌿 Thank you for choosing natural healing. Visit us at Sohna Road, Gurgaon or call 9812345678 for consultation. Get 10% off your first purchase with code WELCOME10.',
 ARRAY['customer_name'], 1),
('Stock Alert SMS', 'sms', 'en',
 '{{product_name}} back in stock at Yeelo! Limited quantity. Visit Sohna Road or call 9812345678. Use STOCK5 for 5% off. Valid 48hrs.',
 ARRAY['product_name'], 1),
('Instagram Monsoon Post', 'instagram', 'hinglish',
 'Monsoon mein skin problems? 🌧️ Try Berberis 30C for natural healing! Visit Yeelo Homeopathy, Sohna Road. #MonsoonCare #Homeopathy #Gurgaon',
 ARRAY[], 1);

-- Insert sample coupons
INSERT INTO coupons (code, name, discount_type, discount_value, min_order_amount, usage_limit, expires_at, created_by) VALUES
('WELCOME10', 'Welcome Discount', 'percent', 10.00, 200.00, 100, '2025-12-31 23:59:59', 1),
('MONSOON15', 'Monsoon Special', 'percent', 15.00, 500.00, 50, '2025-10-31 23:59:59', 1),
('VILLAGE20', 'Village Outreach', 'percent', 20.00, 300.00, 200, '2025-11-30 23:59:59', 1),
('STOCK5', 'Stock Alert Discount', 'percent', 5.00, 100.00, null, '2025-12-31 23:59:59', 1);

-- Insert sample orders
INSERT INTO orders (customer_id, shop_id, order_number, status, source, total_amount, delivery_type) VALUES
(1, 1, 'YEL-2025-001', 'delivered', 'whatsapp', 570.00, 'pickup'),
(2, 1, 'YEL-2025-002', 'confirmed', 'walkin', 245.00, 'pickup'),
(3, 1, 'YEL-2025-003', 'pending', 'phone', 380.00, 'delivery');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
-- Order 1: Berberis Q + Sulphur 30C
(1, 1, 1, 450.00, 450.00),
(1, 4, 1, 120.00, 120.00),
-- Order 2: Pulsatilla 30C + Ferrum Phos 6X
(2, 5, 1, 125.00, 125.00),
(2, 8, 1, 90.00, 90.00),
-- Order 3: Calendula Q
(3, 2, 1, 380.00, 380.00);

-- Insert sample campaigns
INSERT INTO campaigns (name, channel, status, schedule_type, target_filter, created_by) VALUES
('Monsoon Skin Care Campaign', 'whatsapp', 'completed', 'immediate', 
 '{"tags": ["skin-issues"], "areas": [1, 3], "consent_whatsapp": true}', 3),
('Weekly New Arrivals', 'instagram', 'scheduled', 'recurring',
 '{"cron": "0 10 * * 1", "all_followers": true}', 3),
('Village Health Camp Invite', 'sms', 'draft', 'scheduled',
 '{"areas": [2], "consent_sms": true, "scheduled_at": "2025-09-20T10:00:00"}', 3);

-- Log some sample events
INSERT INTO events (event_type, entity_type, entity_id, payload, user_id) VALUES
('order_placed', 'order', 1, '{"source": "whatsapp", "total": 570.00, "items": 2}', 1),
('campaign_sent', 'campaign', 1, '{"recipients": 25, "channel": "whatsapp"}', 3),
('product_low_stock', 'product', 3, '{"current_stock": 4, "reorder_point": 5}', null),
('customer_registered', 'customer', 1, '{"source": "whatsapp", "consent_marketing": true}', 1);
