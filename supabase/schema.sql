-- ============================================================================
-- Met Scents — database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh
-- project. Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type gender_type as enum ('men', 'women', 'unisex');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_type as enum ('available', 'low_stock', 'out_of_stock', 'coming_soon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enquiry_status as enum ('new', 'contacted', 'pending', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  slug text not null unique,
  description text,
  fragrance_notes text,
  fragrance_type text,
  gender gender_type not null default 'unisex',
  category text not null default 'unisex-fragrances',
  image_url text,
  featured boolean not null default false,
  new_arrival boolean not null default false,
  best_seller boolean not null default false,
  availability availability_type not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_slug on products (slug);
create index if not exists idx_products_gender on products (gender);
create index if not exists idx_products_category on products (category);
create index if not exists idx_products_featured on products (featured) where featured = true;
create index if not exists idx_products_new_arrival on products (new_arrival) where new_arrival = true;
create index if not exists idx_products_best_seller on products (best_seller) where best_seller = true;
create index if not exists idx_products_search on products using gin (
  to_tsvector('english', coalesce(brand, '') || ' ' || coalesce(name, ''))
);

-- ----------------------------------------------------------------------------
-- product_variants (size / price combinations)
-- ----------------------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text not null,
  price numeric(10, 2) not null check (price >= 0),
  availability availability_type not null default 'available',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_variants_product_id on product_variants (product_id);

-- ----------------------------------------------------------------------------
-- enquiries
-- ----------------------------------------------------------------------------
create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  whatsapp_number text not null,
  email text,
  location text,
  message text,
  estimated_total numeric(10, 2) not null default 0,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enquiries_status on enquiries (status);
create index if not exists idx_enquiries_created_at on enquiries (created_at desc);

-- ----------------------------------------------------------------------------
-- enquiry_items — snapshot of product/price at time of enquiry, so later
-- price or catalogue changes never rewrite history.
-- ----------------------------------------------------------------------------
create table if not exists enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  brand text,
  size text not null,
  price numeric(10, 2) not null,
  quantity int not null default 1
);

create index if not exists idx_enquiry_items_enquiry_id on enquiry_items (enquiry_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_variants_updated_at on product_variants;
create trigger trg_variants_updated_at before update on product_variants
  for each row execute function set_updated_at();

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

drop trigger if exists trg_enquiries_updated_at on enquiries;
create trigger trg_enquiries_updated_at before update on enquiries
  for each row execute function set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table enquiries enable row level security;
alter table enquiry_items enable row level security;

-- Public (anon) read access to catalogue data --------------------------------
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories
  for select using (true);

drop policy if exists "public read products" on products;
create policy "public read products" on products
  for select using (true);

drop policy if exists "public read product_variants" on product_variants;
create policy "public read product_variants" on product_variants
  for select using (true);

-- Authenticated (admin) full access -----------------------------------------
-- Any user in Supabase Auth is treated as an admin/owner. Only the shop
-- owner should ever be added to Supabase Auth for this project — see README.
drop policy if exists "admin manage categories" on categories;
create policy "admin manage categories" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage products" on products;
create policy "admin manage products" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage product_variants" on product_variants;
create policy "admin manage product_variants" on product_variants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Enquiries: customers may INSERT (submit an enquiry) but never read/update/
-- delete. All enquiry submissions go through the server (service role) via
-- /api/enquiries, so in practice anon INSERT is not even required — it is
-- left disabled by default and the API route uses the service role key.
drop policy if exists "admin read enquiries" on enquiries;
create policy "admin read enquiries" on enquiries
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin update enquiries" on enquiries;
create policy "admin update enquiries" on enquiries
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin delete enquiries" on enquiries;
create policy "admin delete enquiries" on enquiries
  for delete using (auth.role() = 'authenticated');

drop policy if exists "admin read enquiry_items" on enquiry_items;
create policy "admin read enquiry_items" on enquiry_items
  for select using (auth.role() = 'authenticated');

-- No public insert/select policy is created for enquiries/enquiry_items:
-- the enquiry API route uses the service-role key (bypasses RLS) so writes
-- always go through server-side validation and price recalculation.

-- ============================================================================
-- Storage bucket for product images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
