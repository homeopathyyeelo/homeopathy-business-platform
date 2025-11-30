-- Accounting Ledger System Database Schema
-- Double-entry bookkeeping with chart of accounts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CHART OF ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_account_id uuid REFERENCES ledger_accounts(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false,
    opening_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_type ON ledger_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_parent ON ledger_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_code ON ledger_accounts(account_code);

-- ============================================================================
-- JOURNAL ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50), -- INVOICE, PAYMENT, PURCHASE, ADJUSTMENT, MANUAL
    reference_id VARCHAR(255),
    description TEXT,
    is_posted BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id uuid REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_amount NUMERIC(15,2) DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(15,2) DEFAULT 0 CHECK (credit_amount >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE ACCOUNT BALANCES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    acc_type VARCHAR(50);
BEGIN
    -- Get account type
    SELECT account_type INTO acc_type
    FROM ledger_accounts
    WHERE id = NEW.account_id;
    
    -- Update balance based on account type and normal balance
    UPDATE ledger_accounts
    SET current_balance = current_balance + 
        CASE 
            -- Asset and Expense accounts: Debit increases, Credit decreases
            WHEN acc_type IN ('ASSET', 'EXPENSE') 
            THEN NEW.debit_amount - NEW.credit_amount
            -- Liability, Equity, and Revenue accounts: Credit increases, Debit decreases
            ELSE NEW.credit_amount - NEW.debit_amount
        END,
        updated_at = now()
    WHERE id = NEW.account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_account_balance ON journal_entry_lines;
CREATE TRIGGER trg_update_account_balance
    AFTER INSERT ON journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- ============================================================================
-- STANDARD CHART OF ACCOUNTS (Indian Accounting Standards)
-- ============================================================================

-- Clear existing if re-running
DELETE FROM ledger_accounts WHERE is_system_account = true;

-- Level 0: Main Groups
INSERT INTO ledger_accounts (account_code, account_name, account_type, is_system_account, description) VALUES
('1000', 'Assets', 'ASSET', true, 'All Assets'),
('2000', 'Liabilities', 'LIABILITY', true, 'All Liabilities'),
('3000', 'Equity', 'EQUITY', true, 'Owners Equity'),
('4000', 'Income', 'REVENUE', true, 'All Revenue/Income'),
('5000', 'Expenses', 'EXPENSE', true, 'All Expenses');

-- Level 1: Asset Sub-groups
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '1100', 'Current Assets', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1000'
UNION ALL
SELECT '1200', 'Fixed Assets', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1000';

-- Level 2: Current Assets Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '1110', 'Cash & Bank', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1100'
UNION ALL
SELECT '1120', 'Accounts Receivable (Debtors)', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1100'
UNION ALL
SELECT '1130', 'Inventory', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1100';

-- Level 3: Cash & Bank Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '1111', 'Cash in Hand', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1110'
UNION ALL
SELECT '1112', 'Bank Account - Current', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1110'
UNION ALL
SELECT '1113', 'UPI/Payment Gateway', 'ASSET', id, true FROM ledger_accounts WHERE account_code = '1110';

-- Level 1: Liability Sub-groups
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '2100', 'Current Liabilities', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2000';

-- Level 2: Current Liabilities Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '2110', 'Accounts Payable (Creditors)', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2100'
UNION ALL
SELECT '2120', 'GST/Tax Payable', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2100';

-- Level 3: Tax Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '2121', 'CGST Payable', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2120'
UNION ALL
SELECT '2122', 'SGST Payable', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2120'
UNION ALL
SELECT '2123', 'IGST Payable', 'LIABILITY', id, true FROM ledger_accounts WHERE account_code = '2120';

-- Level 1: Equity
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '3100', 'Capital', 'EQUITY', id, true FROM ledger_accounts WHERE account_code = '3000'
UNION ALL
SELECT '3200', 'Retained Earnings', 'EQUITY', id, true FROM ledger_accounts WHERE account_code = '3000';

-- Level 1: Income/Revenue
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '4100', 'Sales Revenue', 'REVENUE', id, true FROM ledger_accounts WHERE account_code = '4000'
UNION ALL
SELECT '4200', 'Other Income', 'REVENUE', id, true FROM ledger_accounts WHERE account_code = '4000';

-- Level 2: Sales Revenue Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '4110', 'POS Sales', 'REVENUE', id, true FROM ledger_accounts WHERE account_code = '4100'
UNION ALL
SELECT '4120', 'B2B Sales', 'REVENUE', id, true FROM ledger_accounts WHERE account_code = '4100';

-- Level 1: Expenses
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '5100', 'Cost of Goods Sold', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5000'
UNION ALL
SELECT '5200', 'Operating Expenses', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5000'
UNION ALL
SELECT '5300', 'Administrative Expenses', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5000';

-- Level 2: Operating Expenses Detail
INSERT INTO ledger_accounts (account_code, account_name, account_type, parent_account_id, is_system_account) 
SELECT '5210', 'Rent', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5200'
UNION ALL
SELECT '5220', 'Utilities', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5200'
UNION ALL
SELECT '5230', 'Salaries & Wages', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5200'
UNION ALL
SELECT '5240', 'Marketing & Advertising', 'EXPENSE', id, true FROM ledger_accounts WHERE account_code = '5200';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View chart of accounts tree
-- SELECT 
--     REPEAT('  ', COALESCE(array_length(string_to_array(account_code, ''), 1), 0) - 4) || account_code as code,
--     account_name,
--     account_type,
--     current_balance
-- FROM ledger_accounts
-- WHERE is_active = true
-- ORDER BY account_code;

-- Verify debits = credits for all journal entries
-- SELECT 
--     je.entry_number,
--     SUM(jel.debit_amount) as total_debits,
--     SUM(jel.credit_amount) as total_credits,
--     SUM(jel.debit_amount) - SUM(jel.credit_amount) as difference
-- FROM journal_entries je
-- JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
-- GROUP BY je.id, je.entry_number
-- HAVING SUM(jel.debit_amount) != SUM(jel.credit_amount);
