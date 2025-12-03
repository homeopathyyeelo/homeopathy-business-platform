-- Insert default company if not exists
INSERT INTO companies (id, name, code, gstin, address, phone, email, is_active)
VALUES (
    gen_random_uuid(),
    'Yeelo Homeopathy',
    'YEELO',
    '06BUAPG3815Q1ZH',
    'Shop No. 3, Khewat No. 213, Khatoni No. 215, Berka Road, Dhunela, Sohna, Gurgaon, Haryana 122103, India',
    '8478019973',
    'medicine@yeelohomeopathy.com',
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    gstin = EXCLUDED.gstin,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;
