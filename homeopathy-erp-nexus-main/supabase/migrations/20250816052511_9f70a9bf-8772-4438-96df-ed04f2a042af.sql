-- Fix missing RLS policies for existing tables (new tables already have RLS enabled)

-- Enable RLS on tables that don't have it yet
alter table if exists public.taxes enable row level security;
alter table if exists public.prescription_items enable row level security;

-- Add permissive policies for all missing tables to match existing pattern
-- (These are temporary - in production you'd want more restrictive policies)

-- For taxes table
create policy if not exists "Allow all operations on taxes"
  on public.taxes
  for all
  using (true)
  with check (true);

-- For prescription_items table  
create policy if not exists "Allow all operations on prescription_items"
  on public.prescription_items
  for all
  using (true)
  with check (true);

-- Ensure all other existing tables have RLS policies
-- (Only create if they don't already exist - will fail silently if they do)

-- Products policy (already created in previous migration)
-- Inventory policy (already created in previous migration) 
-- Customers policy (already created in previous migration)