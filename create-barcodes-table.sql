-- Create barcodes table for barcode management
CREATE TABLE IF NOT EXISTS barcodes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    batch_id INTEGER,
    batch_no VARCHAR(100),
    barcode VARCHAR(255) UNIQUE NOT NULL,
    barcode_type VARCHAR(50) DEFAULT 'EAN13', -- EAN13, QR, CODE128, etc.
    mrp DECIMAL(10,2),
    exp_date DATE,
    quantity INTEGER DEFAULT 1,
    warehouse_id INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, printed, used, expired
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_barcodes_product ON barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_batch ON barcodes(batch_no);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode ON barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_barcodes_status ON barcodes(status);
CREATE INDEX IF NOT EXISTS idx_barcodes_exp_date ON barcodes(exp_date);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_barcodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_barcodes_updated_at
    BEFORE UPDATE ON barcodes
    FOR EACH ROW
    EXECUTE FUNCTION update_barcodes_updated_at();

-- Insert sample barcodes for testing
INSERT INTO barcodes (product_id, batch_no, barcode, barcode_type, mrp, exp_date, quantity, status)
SELECT 
    id,
    'BATCH-' || SUBSTRING(id::text, 1, 8),
    '890' || LPAD(FLOOR(RANDOM() * 9999999999)::TEXT, 10, '0'),
    'EAN13',
    mrp,
    CURRENT_DATE + INTERVAL '2 years',
    100,
    'active'
FROM products
WHERE barcode IS NOT NULL
LIMIT 20
ON CONFLICT (barcode) DO NOTHING;

-- Verification
SELECT 
    COUNT(*) as total_barcodes,
    COUNT(DISTINCT product_id) as unique_products,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_barcodes
FROM barcodes;

SELECT 
    b.barcode,
    p.name as product_name,
    b.batch_no,
    b.mrp,
    b.exp_date,
    b.status
FROM barcodes b
JOIN products p ON b.product_id = p.id
LIMIT 10;
