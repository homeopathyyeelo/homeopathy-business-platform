-- Update Yeelo Homeopathy company details
DELETE FROM company_settings;

INSERT INTO company_settings (gstin, company_name, state_code, address, city, pincode, phone, email)
VALUES (
    '06BUAPG3815Q1ZH',
    'Yeelo Homeopathy',
    '06',
    'Shop No. 3, Khewat No. 213, Khatoni No. 215, Berka Road, Shiv Mandir, Dhunela, Sohna',
    'Gurugram',
    '122103',
    '8478019973',
    'medicine@yeelohomeopathy.com'
);

SELECT * FROM company_settings;
