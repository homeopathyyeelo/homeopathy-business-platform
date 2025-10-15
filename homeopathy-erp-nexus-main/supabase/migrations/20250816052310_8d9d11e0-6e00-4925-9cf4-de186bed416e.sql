-- Add missing columns to existing tables

-- 1) Add missing customer columns
alter table public.customers 
  add column if not exists type text default 'retail',
  add column if not exists "firstName" text,
  add column if not exists "lastName" text,
  add column if not exists name text,
  add column if not exists "gstNumber" text,
  add column if not exists "creditLimit" numeric default 0,
  add column if not exists "openingBalance" numeric default 0,
  add column if not exists "outstandingBalance" numeric default 0,
  add column if not exists "balanceType" text default 'credit',
  add column if not exists "priceLevel" text default 'A',
  add column if not exists "isActive" boolean default true,
  add column if not exists active boolean default true;

-- Populate camelCase columns from existing snake_case data where possible
update public.customers set 
  "firstName" = coalesce("firstName", first_name, ''),
  "lastName" = coalesce("lastName", last_name),
  name = coalesce(name, trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))),
  "gstNumber" = coalesce("gstNumber", gst_number),
  "creditLimit" = coalesce("creditLimit", credit_limit, 0),
  "openingBalance" = coalesce("openingBalance", opening_balance, 0),
  "balanceType" = coalesce("balanceType", balance_type, 'credit'),
  "isActive" = coalesce("isActive", is_active, true),
  active = coalesce(active, is_active, true)
where "firstName" is null or name is null;

-- Create indexes
create index if not exists idx_customers_type on public.customers(type);

-- 2) Add missing inventory columns
alter table public.inventory 
  add column if not exists mrp numeric,
  add column if not exists discount numeric,
  add column if not exists warehouse_name varchar,
  add column if not exists last_stock_update timestamptz default now();

-- Ensure RLS policies exist (will fail silently if they already exist)
do $$
begin
  -- Try to create policies, ignore errors if they already exist
  begin
    execute 'create policy "Allow all operations on products" on public.products for all using (true) with check (true)';
  exception when duplicate_object then
    null; -- Ignore if policy already exists
  end;
  
  begin
    execute 'create policy "Allow all operations on inventory" on public.inventory for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
  
  begin
    execute 'create policy "Allow all operations on customers" on public.customers for all using (true) with check (true)';
  exception when duplicate_object then
    null;
  end;
end $$;