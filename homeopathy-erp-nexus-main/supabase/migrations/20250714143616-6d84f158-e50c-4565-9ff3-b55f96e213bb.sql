-- Add client-wise discount fields to customers table
ALTER TABLE customers 
ADD COLUMN default_discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN discount_type VARCHAR DEFAULT 'percentage',
ADD COLUMN credit_days INTEGER DEFAULT 0,
ADD COLUMN max_credit_limit NUMERIC DEFAULT 0,
ADD COLUMN loyalty_points INTEGER DEFAULT 0;

-- Create customer discount history table
CREATE TABLE customer_discount_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  discount_type VARCHAR NOT NULL,
  discount_value NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  notes TEXT
);

-- Create payment reminders table
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  reminder_type VARCHAR NOT NULL DEFAULT 'overdue',
  reminder_date DATE NOT NULL,
  sent_via VARCHAR,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE customer_discount_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on customer_discount_history" ON customer_discount_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_reminders" ON payment_reminders FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_customer_discount_history_customer_id ON customer_discount_history(customer_id);
CREATE INDEX idx_payment_reminders_customer_id ON payment_reminders(customer_id);
CREATE INDEX idx_payment_reminders_reminder_date ON payment_reminders(reminder_date);

-- Add GST auto-filing configuration table
CREATE TABLE gst_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_number VARCHAR NOT NULL,
  business_name VARCHAR NOT NULL,
  auto_einvoice_threshold NUMERIC DEFAULT 500,
  auto_eway_bill_threshold NUMERIC DEFAULT 50000,
  api_credentials JSONB,
  auto_filing_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gst_configuration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on gst_configuration" ON gst_configuration FOR ALL USING (true);