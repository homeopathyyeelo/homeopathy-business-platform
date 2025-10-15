-- Fix missing RLS policies - PostgreSQL CREATE POLICY doesn't support IF NOT EXISTS

-- Enable RLS on tables that don't have it yet
alter table if exists public.taxes enable row level security;
alter table if exists public.prescription_items enable row level security;

-- Add policies (will error if they exist, but that's OK)
-- For taxes table
create policy "Allow all operations on taxes"
  on public.taxes
  for all
  using (true)
  with check (true);

-- For prescription_items table  
create policy "Allow all operations on prescription_items"
  on public.prescription_items
  for all
  using (true)
  with check (true);