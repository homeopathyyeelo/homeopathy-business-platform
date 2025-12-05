-- Migration: Create E-Way Bill tracking table
-- Purpose: Store E-Way Bill references for record-keeping
-- Date: 2025-12-04

CREATE TABLE IF NOT EXISTS ewaybills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    ewaybill_no VARCHAR(50) UNIQUE NOT NULL,
    generated_date TIMESTAMP DEFAULT NOW(),
    valid_upto TIMESTAMP,
    distance INTEGER,
    transport_mode VARCHAR(20),
    transport_id VARCHAR(50),
    transporter_id VARCHAR(15),
    transporter_name VARCHAR(200),
    from_place VARCHAR(200),
    to_place VARCHAR(200),
    status VARCHAR(20) DEFAULT 'GENERATED',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ewaybills_invoice ON ewaybills(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ewaybills_no ON ewaybills(ewaybill_no);
CREATE INDEX IF NOT EXISTS idx_ewaybills_valid_upto ON ewaybills(valid_upto);

-- Comments
COMMENT ON TABLE ewaybills IS 'E-Way Bill references for transport compliance (local tracking only)';
COMMENT ON COLUMN ewaybills.ewaybill_no IS 'Local E-Way Bill reference number (not GST portal submitted)';
COMMENT ON COLUMN ewaybills.status IS 'Status: GENERATED, CANCELLED';
COMMENT ON COLUMN ewaybills.transport_mode IS 'Transport mode: 1-Road, 2-Rail, 3-Air, 4-Ship';
COMMENT ON COLUMN ewaybills.transport_id IS 'Vehicle number or LR number';
COMMENT ON COLUMN ewaybills.transporter_id IS 'GSTIN of transporter (if applicable)';
