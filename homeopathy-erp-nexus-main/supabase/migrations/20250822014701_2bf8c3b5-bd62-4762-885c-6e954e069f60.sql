-- Create missing tables for returns and credit notes
CREATE TABLE IF NOT EXISTS public.sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR UNIQUE NOT NULL,
    original_invoice_id UUID,
    original_invoice_number VARCHAR,
    customer_id UUID,
    return_date DATE NOT NULL,
    reason VARCHAR,
    refund_method VARCHAR DEFAULT 'cash',
    notes TEXT,
    total_return_amount NUMERIC DEFAULT 0,
    status VARCHAR DEFAULT 'completed',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number VARCHAR UNIQUE NOT NULL,
    customer_id UUID,
    original_invoice_id UUID,
    return_id UUID,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status VARCHAR DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on sales_returns" 
ON public.sales_returns 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on credit_notes" 
ON public.credit_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create triggers for timestamps
CREATE TRIGGER update_sales_returns_updated_at
    BEFORE UPDATE ON public.sales_returns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_notes_updated_at
    BEFORE UPDATE ON public.credit_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();