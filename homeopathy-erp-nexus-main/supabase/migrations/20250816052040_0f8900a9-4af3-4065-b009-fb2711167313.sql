-- Create core tables required by the app (products, inventory, customers)
-- Fixed policy syntax issue

-- 1) Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  product_code varchar,
  description text,
  potency text,
  form text,
  full_medicine_name text,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  sku varchar,
  barcode varchar,
  hsn_code varchar,
  gst_percentage numeric default 12,
  purchase_price numeric,
  retail_price numeric,
  wholesale_price numeric,
  reorder_level integer default 0,
  min_stock_level integer default 0,
  max_stock_level integer,
  batch_tracking boolean default true,
  is_batch_tracked boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_products_brand_id on public.products(brand_id);
create index if not exists idx_products_category_id on public.products(category_id);
create unique index if not exists idx_products_sku_unique on public.products(sku) where sku is not null;
create unique index if not exists idx_products_product_code_unique on public.products(product_code) where product_code is not null;

-- RLS for products
alter table public.products enable row level security;

-- Create policy (without if not exists - if it already exists this will just fail silently)
create policy "Allow all operations on products"
  on public.products
  for all
  using (true)
  with check (true);

-- Trigger to maintain updated_at
create trigger if not exists trg_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();


-- 2) Inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  batch_number varchar not null,
  manufacturing_date date,
  expiry_date date,
  quantity_in_stock numeric default 0,
  purchase_price numeric,
  mrp numeric,
  selling_price_retail numeric,
  selling_price_wholesale numeric,
  discount numeric,
  rack_location varchar,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  warehouse_name varchar,
  last_stock_update timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_inventory_product_batch unique(product_id, batch_number)
);

create index if not exists idx_inventory_product_id on public.inventory(product_id);
create index if not exists idx_inventory_expiry_date on public.inventory(expiry_date);
create index if not exists idx_inventory_rack_location on public.inventory(rack_location);

alter table public.inventory enable row level security;

create policy "Allow all operations on inventory"
  on public.inventory
  for all
  using (true)
  with check (true);

create trigger if not exists trg_inventory_updated_at
before update on public.inventory
for each row execute function public.update_updated_at_column();


-- 3) Customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  -- Core identity (camelCase for compatibility with TypeScript interfaces)
  "firstName" text not null,
  "lastName" text,
  name text,
  email text,
  phone text not null,
  address text,
  city text,
  state text,
  pincode text,
  "gstNumber" text,
  type text not null default 'retail',
  -- Finance/discount profile
  "creditLimit" numeric default 0,
  "openingBalance" numeric default 0,
  "outstandingBalance" numeric default 0,
  "balanceType" text default 'credit',
  "priceLevel" text default 'A',
  default_discount_percentage numeric default 0,
  discount_type text default 'percentage',
  credit_days integer default 0,
  max_credit_limit numeric default 0,
  loyalty_points numeric default 0,
  "isActive" boolean default true,
  active boolean default true,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_type on public.customers(type);

alter table public.customers enable row level security;

create policy "Allow all operations on customers"
  on public.customers
  for all
  using (true)
  with check (true);

create trigger if not exists trg_customers_updated_at
before update on public.customers
for each row execute function public.update_updated_at_column();