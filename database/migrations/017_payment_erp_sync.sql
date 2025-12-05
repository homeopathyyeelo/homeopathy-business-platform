-- Migration: Add ERP Sync and Audit tracking to payments table
-- Purpose: Enable robust payment-ERP integration with sync status tracking and reconciliation
-- Date: 2025-12-04

-- Add ERP sync tracking columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS erp_sync_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS erp_sync_attempts INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS erp_sync_last_attempt TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS erp_sync_error TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS erp_reference_id VARCHAR(100);

-- Add missing base columns first
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cheque_status VARCHAR(20);

-- Add reconciliation tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reconciliation_date TIMESTAMP;

-- Add audit field
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Create indexes for ERP sync queries
CREATE INDEX IF NOT EXISTS idx_payments_erp_sync_status ON payments(erp_sync_status);
CREATE INDEX IF NOT EXISTS idx_payments_erp_sync_pending ON payments(erp_sync_status, erp_sync_attempts) WHERE erp_sync_status IN ('PENDING', 'FAILED');
CREATE INDEX IF NOT EXISTS idx_payments_unreconciled ON payments(reconciled, payment_date) WHERE reconciled = FALSE;

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add comments
COMMENT ON COLUMN payments.erp_sync_status IS 'ERP sync status: PENDING, SYNCED, FAILED, HOLD (for cheques until cleared)';
COMMENT ON COLUMN payments.erp_sync_attempts IS 'Number of ERP sync attempts (max 5 before manual intervention required)';
COMMENT ON COLUMN payments.erp_sync_last_attempt IS 'Timestamp of last ERP sync attempt';
COMMENT ON COLUMN payments.erp_sync_error IS 'Error message if ERP sync failed';
COMMENT ON COLUMN payments.erp_reference_id IS 'Reference ID from ERP system after successful sync';
COMMENT ON COLUMN payments.reconciled IS 'Whether payment has been reconciled with bank/ERP records';
COMMENT ON COLUMN payments.reconciliation_date IS 'Date when payment was reconciled';
COMMENT ON COLUMN payments.reconciliation_notes IS 'Notes added during reconciliation process';
COMMENT ON COLUMN payments.cheque_status IS 'Cheque status: RECEIVED, DEPOSITED, CLEARED, BOUNCED';
COMMENT ON COLUMN payments.updated_by IS 'User who last updated the payment record';

COMMENT ON TABLE audit_logs IS 'Audit trail for all payment and critical entity actions';

-- Update existing payments to PENDING status
UPDATE payments 
SET erp_sync_status = CASE 
    WHEN payment_method = 'CHEQUE' AND (cheque_status IS NULL OR cheque_status != 'CLEARED') THEN 'HOLD'
    ELSE 'PENDING'
END
WHERE erp_sync_status IS NULL OR erp_sync_status = '';
