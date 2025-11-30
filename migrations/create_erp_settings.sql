-- ERP Settings Table
CREATE TABLE IF NOT EXISTS erp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50) NOT NULL, -- credit, pos, gst, inventory, etc.
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_editable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default ERP settings
INSERT INTO erp_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
-- Credit & Payment Settings
('CREDIT_DAYS', '7', 'number', 'credit', 'Default Credit Days', 'Default credit period for customers in days'),
('MONTHLY_INTEREST_RATE', '0.24', 'number', 'credit', 'Monthly Interest Rate', 'Interest rate per month (e.g., 0.24 = 24%)'),
('AUTO_CALCULATE_INTEREST', 'true', 'boolean', 'credit', 'Auto Calculate Interest', 'Automatically calculate interest on overdue amounts'),
('GRACE_PERIOD_DAYS', '3', 'number', 'credit', 'Grace Period', 'Additional days before interest starts'),

-- POS Settings
('DEFAULT_TAX_RATE', '5', 'number', 'pos', 'Default Tax Rate', 'Default GST rate for products (%)'),
('MEDICINE_TAX_RATE', '5', 'number', 'pos', 'Medicine Tax Rate', 'GST rate for medicines (%)'),
('COSMETICS_TAX_RATE', '18', 'number', 'pos', 'Cosmetics Tax Rate', 'GST rate for cosmetics (%)'),
('AUTO_PRINT_INVOICE', 'false', 'boolean', 'pos', 'Auto Print Invoice', 'Automatically print invoice after creation'),
('THERMAL_PRINTER_WIDTH', '80', 'number', 'pos', 'Thermal Printer Width', 'Thermal printer width in mm'),

-- Inventory Settings
('LOW_STOCK_THRESHOLD', '10', 'number', 'inventory', 'Low Stock Threshold', 'Alert when stock falls below this quantity'),
('EXPIRY_ALERT_DAYS', '90', 'number', 'inventory', 'Expiry Alert Days', 'Alert when products expire within days'),
('AUTO_BATCH_SELECTION', 'FEFO', 'string', 'inventory', 'Auto Batch Selection', 'Batch selection method: FEFO, FIFO, LIFO'),
('NEGATIVE_STOCK_ALLOWED', 'false', 'boolean', 'inventory', 'Allow Negative Stock', 'Allow selling when stock is 0 or negative'),

-- GST Settings
('GST_STATE_CODE', '06', 'string', 'gst', 'GST State Code', 'State code for GST (e.g., 06 for Haryana)'),
('ENABLE_EINVOICE', 'true', 'boolean', 'gst', 'Enable E-Invoice', 'Enable E-Invoice generation for B2B'),
('EWAYBILL_THRESHOLD', '50000', 'number', 'gst', 'E-Way Bill Threshold', 'Minimum amount for E-Way Bill (₹)'),
('AUTO_GENERATE_EINVOICE', 'true', 'boolean', 'gst', 'Auto Generate E-Invoice', 'Auto-generate E-Invoice for eligible invoices'),

-- Discount Settings
('MAX_DISCOUNT_PERCENT', '50', 'number', 'discount', 'Maximum Discount %', 'Maximum allowed discount percentage'),
('MAX_DISCOUNT_AMOUNT', '10000', 'number', 'discount', 'Maximum Discount Amount', 'Maximum allowed discount amount (₹)'),
('REQUIRE_APPROVAL_ABOVE', '1000', 'number', 'discount', 'Discount Approval Threshold', 'Require manager approval for discounts above (₹)'),

-- Business Settings
('BUSINESS_NAME', 'Yeelo Homeopathy', 'string', 'business', 'Business Name', 'Official business name'),
('BUSINESS_GSTIN', '06BUAPG3815Q1ZH', 'string', 'business', 'GSTIN', 'GST Identification Number'),
('BUSINESS_PHONE', '9876543210', 'string', 'business', 'Phone Number', 'Business contact number'),
('BUSINESS_EMAIL', 'info@yeelo.com', 'string', 'business', 'Email', 'Business email address'),
('BUSINESS_ADDRESS', 'Shop No. 3, Khewat No. 213, Khatoni No. 215, Berka Road, Shiv Mandir, Dhunela, Sohna, Gurugram, Haryana, 122103', 'string', 'business', 'Business Address', 'Complete business address')

ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_erp_settings_category ON erp_settings(category);
CREATE INDEX IF NOT EXISTS idx_erp_settings_key ON erp_settings(setting_key);

-- View for easy querying by category
CREATE OR REPLACE VIEW v_settings_by_category AS
SELECT 
    category,
    json_object_agg(setting_key, json_build_object(
        'value', setting_value,
        'type', setting_type,
        'label', label,
        'description', description,
        'editable', is_editable
    )) as settings
FROM erp_settings
GROUP BY category;
